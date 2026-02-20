import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Consultation from '#models/Consultation'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Medecin from '#models/Medecin'
import Patient from '#models/Patient'
import RendezVous from '#models/RendezVous'
import UserProfile from '#models/UserProfile'
import Prescription from '#models/Prescription'
import transmit from '@adonisjs/transmit/services/main'
import { createConsultationValidator, updateConsultationValidator } from '#validators/consultation'
import WebhookService from '#services/WebhookService'
import NotificationService from '#services/NotificationService'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import { ConsultationTransformer } from '../transformers/ConsultationTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

export default class ConsultationController {
  
  /**
   * Lister les consultations
   * @route GET /api/v1/consultations
   * @access Docteur, Infirmière
   */
  public async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const { patientId, medecinId } = request.qs()
      const { page, limit } = PaginationHelper.fromQueryString(request, 50, 100)

      // Validation UUID pour patientId
      if (patientId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(patientId)) {
          throw AppException.badRequest('Format UUID invalide pour patientId')
        }
      }

      // Validation UUID pour medecinId
      if (medecinId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(medecinId)) {
          throw AppException.badRequest('Format UUID invalide pour medecinId')
        }
      }

      const query = Consultation.query()
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .orderBy('dateConsultation', 'desc')

      if (patientId) {
        query.where('patientId', patientId)
      }

      if (medecinId) {
        query.where('medecinId', medecinId)
      } else {
        // Si pas de filtre médecin, on peut filtrer par le médecin connecté
        // Optimisation : Charger le médecin une seule fois au début si nécessaire
        let medecin = null
        if (!patientId && (['docteur_clinique', 'docteur_labo'].includes(user.role) || user.role === 'infirmiere')) {
          medecin = await Medecin.findBy('userId', user.id)
          if (medecin) {
            // Si on filtre par patient, on montre toutes les consultations de ce patient
            // Sinon, on montre seulement celles du médecin connecté
            query.where('medecinId', medecin.id)
          }
        }
      }

      const consultations = await query.paginate(page, limit)

      const transformedData = ConsultationTransformer.transformMany(consultations.all())

      return response.json(
        ApiResponse.paginated(
          transformedData,
          consultations.currentPage,
          consultations.perPage,
          consultations.total
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération de la liste des consultations')
      throw AppException.internal('Erreur lors du chargement des consultations.')
    }
  }
  
  /**
   * Créer une nouvelle consultation
   * @route POST /api/v1/consultations
   * @access Docteur, Infirmière
   */
  public async store({ request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile 
    
    // 1. Vérifications de sécurité
    if (!user) {
        throw AppException.unauthorized('Session expirée')
    }
    
    // 2. Vérification du rôle : Seuls les médecins clinique (docteur_clinique) peuvent créer des consultations
    if (!['docteur_clinique'].includes(user.role)) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        throw AppException.forbidden(userName)
    }
    
    const medecin = await Medecin.findBy('userId', user.id)
    if (!medecin) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        throw AppException.forbidden(userName)
    }

    // 2. Validation des données avec VineJS
    const payload = await request.validateUsing(createConsultationValidator)
    const { patientId, consultationData } = payload
    let rendezVousId = payload.rendezVousId

    // 2. Restriction : Un seul RDV par jour
    const todayStart = DateTime.now().startOf('day').toSQL()
    const todayEnd = DateTime.now().endOf('day').toSQL()

    const existingConsultation = await Consultation.query()
        .where('patientId', patientId)
        .andWhereBetween('dateConsultation', [todayStart, todayEnd])
        .first()

    if (existingConsultation) {
        throw AppException.duplicate("Ce patient a déjà été consulté aujourd'hui.")
    }

    // 3. Liaison automatique du RDV et vérification de validité
    if (rendezVousId) {
      // Vérifier que le rendez-vous existe et est valide pour une consultation
      const rdv = await RendezVous.find(rendezVousId)
      if (!rdv) {
        throw AppException.notFound('Rendez-vous introuvable')
      }
      
      // Vérifier si le rendez-vous est annulé
      if (rdv.statut === 'annule') {
        throw AppException.badRequest('Impossible de créer une consultation pour un rendez-vous annulé')
      }
      
      // Vérifier si le rendez-vous est dépassé (heure de fin passée)
      const appointmentEnd = rdv.dateHeure.plus({ minutes: rdv.dureeMinutes || 30 })
      const now = DateTime.now()
      if (appointmentEnd < now) {
        throw AppException.badRequest('Impossible de créer une consultation pour un rendez-vous dépassé')
      }
      
      // Vérifier que le patient du rendez-vous correspond au patient de la consultation
      if (rdv.patientId !== patientId) {
        throw AppException.badRequest('Le patient du rendez-vous ne correspond pas au patient de la consultation')
      }
    }
    
    if (!rendezVousId) {
        const existingRdv = await RendezVous.query()
            .where('patientId', patientId)
            .andWhere('medecinId', medecin.id)
            .andWhereBetween('dateHeure', [todayStart, todayEnd])
            .andWhereNot('statut', 'annule')
            .andWhereNot('statut', 'termine')
            .first()
        
        if (existingRdv) {
            rendezVousId = existingRdv.id
        }
    }

    const trx = await db.transaction()
    
    try {
      // 4. Préparation des données
      const rawSymptoms = Array.isArray(consultationData.symptoms) ? consultationData.symptoms : [];
      const rawVitals = consultationData.vitalSigns || {};
      const rawExams = Array.isArray(consultationData.requestedExams) ? consultationData.requestedExams : [];
      const medicationsList = Array.isArray(consultationData.medications) ? consultationData.medications : [];
      
      const traitementPrescrit = medicationsList.length > 0 
            ? medicationsList.map((m: any) => `${m.name} (${m.dosage})`).join('; ')
            : (consultationData.treatment || null);
            
      const symptomesCompat = consultationData.chiefComplaint 
            ? `${consultationData.chiefComplaint}. ${rawSymptoms.join(', ')}`
            : rawSymptoms.join(', ');

      // 5. Création Consultation
      const consultation = await Consultation.create({
        patientId: patientId,
        medecinId: medecin.id,
        rendezVousId: rendezVousId || null, 
        dateConsultation: DateTime.now(),
        dureeConsultation: consultationData.duration ? Number(consultationData.duration) : 15,
        
        motifPrincipal: consultationData.chiefComplaint || null,
        symptomesAssocies: rawSymptoms, 
        constantesVitales: rawVitals, 
        examensDemandes: rawExams,
        
        examenPhysique: consultationData.examination || null,
        diagnosticPrincipal: consultationData.diagnosis || null,
        diagnosisCode: consultationData.diagnosisCode || null,
        diagnosisCodeId: consultationData.diagnosisCodeId || null,
        planTraitement: consultationData.treatment || null,
        instructionsSuivi: consultationData.followUp || null,
        notesConsultation: consultationData.consultationNotes || null,
        
        diagnostic: consultationData.diagnosis || null, 
        symptomes: symptomesCompat || null, 
        traitementPrescrit: traitementPrescrit, 
        
      }, { client: trx })

      // 6. Création Prescriptions (Mise à jour pour utiliser le modèle Prescription)
      const prescriptionsCreated = []
      if (medicationsList.length > 0) {
        for (const med of medicationsList) {
            if (med.id) {
                const prescription = await Prescription.create({
                    consultationId: consultation.id,
                    medicamentId: med.id,
                    quantite: med.quantity || 1, // Utiliser la quantité du payload
                    posologie: med.frequency || 'Non spécifié', // Mapping vers le champ 'posologie'
                    dureeTraitement: med.duration || null,      // Mapping vers 'duree_traitement'
                    instructionsSpeciales: med.dosage || null,   // Stocker le dosage dans instructionsSpeciales
                    delivre: false,
                    datePrescription: DateTime.now()
                }, { client: trx })
                prescriptionsCreated.push({
                  id: prescription.id,
                  medicamentId: med.id,
                  medicamentName: med.name || 'Médicament inconnu',
                  quantite: med.quantity || 1,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  duration: med.duration
                })
            }
        }
      }

      // 7. Clôture RDV
      if (rendezVousId) {
        const rdv = await RendezVous.find(rendezVousId, { client: trx })
        if (rdv) {
          rdv.statut = 'termine'
          await rdv.save() 
        }
      }
      
      await trx.commit()

      // 8. Notifications (après le commit, on ne peut plus utiliser trx)
      const patient = await Patient.find(patientId)
      await patient?.load('user')
      const patientName = patient?.user?.nomComplet || 'Patient'
      
      // Notification de nouvelle consultation
      await NotificationService.notifyNewConsultation(
        consultation.id,
        patientName,
        user.id,
        user.nomComplet || 'Médecin'
      )
      
      // Notification de prescription créée (si médicaments prescrits)
      if (medicationsList.length > 0) {
        await NotificationService.notifyPrescriptionCreated(
          consultation.id,
          patientName,
          user.id,
          user.nomComplet || 'Médecin',
          medicationsList.length,
          prescriptionsCreated // Passer les détails des prescriptions
        )
      }

      // 9. Déclencher les webhooks
      await WebhookService.triggerWebhook('consultation.created', {
        consultationId: consultation.id,
        patientId: consultation.patientId,
        medecinId: consultation.medecinId,
        date: consultation.dateConsultation.toISO(),
      })

      // Log d'audit pour la consultation
      await AuditService.logConsultationCreated(
        { auth, request, response } as HttpContext,
        consultation.id,
        patientName,
        user.nomComplet || 'Médecin',
        consultationData.chiefComplaint
      )

      // Log d'audit spécifique pour chaque prescription (traçabilité complète)
      if (prescriptionsCreated.length > 0) {
        for (const prescription of prescriptionsCreated) {
          await AuditService.logPrescriptionCreated(
            { auth, request, response } as HttpContext,
            prescription.id,
            patientName,
            user.nomComplet || 'Médecin',
            1 // Une prescription = 1 médicament
          )
        }
      }

      const transformedConsultation = ConsultationTransformer.transform(consultation, true)

      return response.status(201).json(
        ApiResponse.created(
          transformedConsultation,
          'Consultation et prescriptions enregistrées avec succès.'
        )
      )

    } catch (error) {
      await trx.rollback()
      logger.error({ 
        err: error, 
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        patientId,
        medecinId: medecin.id
      }, 'Erreur lors de la création de la consultation')
      if (error instanceof AppException) {
        throw error
      }
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? (error as any)?.message || 'Erreur inconnue lors de la sauvegarde'
        : 'Erreur technique lors de la sauvegarde.'
      throw AppException.internal(errorMessage)
    }
  }

  /**
   * Mettre à jour une consultation existante
   * @route PUT /api/v1/consultations/:id
   * @access Docteur (uniquement ses propres consultations)
   */
  public async update({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    
    // 1. Vérifications de sécurité
    if (!user) {
        throw AppException.unauthorized('Session expirée')
    }
    
    // 2. Vérification du rôle : Seuls les médecins clinique peuvent modifier des consultations
    if (!['docteur_clinique'].includes(user.role)) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        throw AppException.forbidden(userName)
    }
    
    const medecin = await Medecin.findBy('userId', user.id)
    if (!medecin) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        throw AppException.forbidden(userName)
    }

    const consultationId = params.id
    const consultation = await Consultation.find(consultationId)
    
    if (!consultation) {
        throw AppException.notFound('Consultation')
    }

    // 3. Vérifier que la consultation appartient au médecin connecté
    if (consultation.medecinId !== medecin.id) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        throw AppException.forbidden(userName)
    }

    const trx = await db.transaction()

    try {
        // 4. Validation des données avec VineJS
        const payload = await request.validateUsing(updateConsultationValidator)
        const { consultationData } = payload

        // 5. Préparation des données (similaire à store)
        const rawSymptoms = consultationData.symptoms || []
        const rawVitals = consultationData.vitalSigns || {}
        const rawExams = consultationData.requestedExams || []
        const medicationsList = consultationData.medications || []

        const traitementPrescrit = medicationsList.length > 0 
            ? medicationsList.map((m: any) => `${m.name} (${m.dosage})`).join('; ')
            : (consultationData.treatment || consultation.traitementPrescrit);
            
        const symptomesCompat = consultationData.chiefComplaint 
            ? `${consultationData.chiefComplaint}. ${rawSymptoms.join(', ')}`
            : rawSymptoms.join(', ') || consultation.symptomes;

        // 6. Mise à jour de la consultation
        consultation.dureeConsultation = consultationData.duration ? Number(consultationData.duration) : consultation.dureeConsultation
        consultation.motifPrincipal = consultationData.chiefComplaint || consultation.motifPrincipal
        consultation.symptomesAssocies = rawSymptoms.length > 0 ? rawSymptoms : consultation.symptomesAssocies
        consultation.constantesVitales = Object.keys(rawVitals).length > 0 ? rawVitals : consultation.constantesVitales
        consultation.examensDemandes = rawExams.length > 0 ? rawExams : consultation.examensDemandes
        consultation.examenPhysique = consultationData.examination || consultation.examenPhysique
        consultation.diagnosticPrincipal = consultationData.diagnosis || consultation.diagnosticPrincipal
        consultation.diagnosisCode = consultationData.diagnosisCode || consultation.diagnosisCode
        consultation.diagnosisCodeId = consultationData.diagnosisCodeId || consultation.diagnosisCodeId
        consultation.planTraitement = consultationData.treatment || consultation.planTraitement
        consultation.instructionsSuivi = consultationData.followUp || consultation.instructionsSuivi
        consultation.notesConsultation = consultationData.consultationNotes || consultation.notesConsultation
        consultation.diagnostic = consultationData.diagnosis || consultation.diagnostic
        consultation.symptomes = symptomesCompat || consultation.symptomes
        consultation.traitementPrescrit = traitementPrescrit || consultation.traitementPrescrit

        consultation.useTransaction(trx)
        await consultation.save()

        // 7. Mise à jour des prescriptions (supprimer les anciennes et créer les nouvelles)
        if (medicationsList.length > 0) {
            // Supprimer les anciennes prescriptions
            await Prescription.query({ client: trx })
                .where('consultationId', consultation.id)
                .delete()

            // Créer les nouvelles prescriptions
            for (const med of medicationsList) {
                if (med.id) {
                    await Prescription.create({
                        consultationId: consultation.id,
                        medicamentId: med.id,
                        quantite: med.quantity || 1, // Utiliser la quantité du payload
                        posologie: med.frequency || 'Non spécifié',
                        dureeTraitement: med.duration || null,
                        instructionsSpeciales: med.dosage || null, // Stocker le dosage
                        delivre: false,
                        datePrescription: DateTime.now()
                    }, { client: trx })
                }
            }
        }

        await trx.commit()

        // 8. Notification Temps Réel à la Pharmacie si nouvelles prescriptions
        if (medicationsList.length > 0) {
            await transmit.broadcast('pharmacy_channel', {
                type: 'prescription_updated',
                message: `Ordonnance mise à jour pour le patient (ID: ${consultation.patientId.substring(0,8)}...)`
            })
        }

        // 9. Déclencher les webhooks
        await WebhookService.triggerWebhook('consultation.updated', {
            consultationId: consultation.id,
            patientId: consultation.patientId,
            medecinId: consultation.medecinId,
            date: consultation.dateConsultation.toISO(),
        })

        // Log d'audit - Consultation mise à jour
        const patient = await Patient.find(consultation.patientId)
        await patient?.load('user')
        const patientName = patient?.user?.nomComplet || 'Patient'
        
        await AuditService.logConsultationUpdated(
            { auth, request, response } as HttpContext,
            consultation.id,
            patientName,
            user.nomComplet || 'Médecin',
            consultationData
        )
        
        // Log d'audit pour prescriptions modifiées
        if (medicationsList.length > 0) {
          await AuditService.logPrescriptionUpdated(
            { auth, request, response } as HttpContext,
            consultation.id, // Utiliser l'ID de consultation comme proxy
            patientName,
            user.nomComplet || 'Médecin',
            { medicationsCount: medicationsList.length }
          )
        }

        const transformedConsultation = ConsultationTransformer.transform(consultation, true)

        return response.json(
          ApiResponse.success(
            transformedConsultation,
            'Consultation mise à jour avec succès.'
          )
        )

    } catch (error) {
        await trx.rollback()
        logger.error({ err: error }, 'Erreur lors de la mise à jour de la consultation')
        if (error instanceof AppException) {
          throw error
        }
        throw AppException.internal(
          'Erreur technique lors de la mise à jour.',
          process.env.NODE_ENV === 'development' ? (error as any).message : undefined
        )
    }
  }
}