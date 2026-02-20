import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import RendezVous from '#models/RendezVous'
import Medecin from '#models/Medecin'
import Patient from '#models/Patient'
import { DateTime } from 'luxon'
import { createRendezVousValidator, updateRendezVousStatusValidator } from '#validators/rendez_vous'
import NotificationService from '#services/NotificationService'
import AuditService from '#services/AuditService'
import AppointmentExpirationService from '#services/AppointmentExpirationService'
import UserProfile from '#models/UserProfile'
import { BUSINESS_TIMEZONE, formatBusinessDateTime, nowInBusinessTimezone } from '../utils/timezone.js'
import { RendezVousTransformer } from '../transformers/RendezVousTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

export default class RendezVousController {
  /**
   * Annule automatiquement les rendez-vous en attente dont l'heure est passée
   * @private
   */
  private async cancelExpiredAppointments(): Promise<number> {
    return AppointmentExpirationService.runCycle()
  }

  /**
   * Lister les rendez-vous
   * @route GET /api/v1/appointments
   * @access Authentifié
   */
  public async index({ request, response, auth }: HttpContext) {
    try {
      // Annuler automatiquement les rendez-vous expirés avant de retourner la liste
      await this.cancelExpiredAppointments()
      
      const { patientId, medecinId, date, startDate, endDate, status, establishmentId, includeAutoCancelled } = request.qs()

      // Validation des statuts autorisés
      const validStatuses = ['programme', 'en_cours', 'termine', 'annule']
      
      const query = RendezVous.query()
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .orderBy('dateHeure', 'asc')
        
      // Exclure les rendez-vous annulés automatiquement de la liste par défaut
      // (ceux qui ont été annulés automatiquement ont une note contenant "Annulé automatiquement")
      // Sauf si on filtre explicitement par statut 'annule'
      const shouldIncludeAutoCancelled = includeAutoCancelled === '1' || includeAutoCancelled === 'true'
      if ((!status || status !== 'annule') && !shouldIncludeAutoCancelled) {
        query.where((q) => {
          q.where('statut', '!=', 'annule')
            .orWhere((q2) => {
              q2.where('statut', 'annule')
                .where('notes', 'NOT LIKE', '%Annulé automatiquement%')
            })
        })
      }

      // Si l'utilisateur est un médecin et qu'aucun medecinId n'est spécifié, filtrer automatiquement par son medecinId
      if (auth.user && !medecinId) {
        const user = auth.user as any
        // Chercher le médecin associé à cet utilisateur
        const medecin = await Medecin.query()
          .where('userId', user.id)
          .first()
        
        if (medecin) {
          // Filtrer automatiquement par le médecin connecté
          query.where('medecinId', medecin.id)
        }
      }

      // Validation UUID pour patientId
      if (patientId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(patientId)) {
          throw AppException.badRequest('Format UUID invalide pour patientId')
        }
        query.where('patientId', patientId)
      }

      // Validation UUID pour medecinId (si spécifié explicitement, cela override le filtre automatique)
      if (medecinId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(medecinId)) {
          throw AppException.badRequest('Format UUID invalide pour medecinId')
        }
        query.where('medecinId', medecinId)
      }

      // Filtre par établissement (médecins rattachés à cet établissement)
      if (establishmentId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(establishmentId)) {
          throw AppException.badRequest('Format UUID invalide pour establishmentId')
        }
        query.whereHas('medecin', (q) => q.where('etablissementId', establishmentId))
      }

      // Validation du statut
      if (status) {
        if (!validStatuses.includes(status)) {
          throw AppException.badRequest(`Statut invalide. Valeurs autorisées: ${validStatuses.join(', ')}`)
        }
        query.where('statut', status)
      }
      
      // Validation de la date (date spécifique)
      if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(date)) {
          throw AppException.badRequest('Format de date invalide. Utilisez YYYY-MM-DD')
        }
        // Syntaxe standard SQL pour ignorer l'heure
        query.whereRaw('DATE(date_heure) = ?', [date])
      }
      
      // Validation de la plage de dates (startDate et endDate)
      if (startDate || endDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        
        if (startDate) {
          if (!dateRegex.test(startDate)) {
            throw AppException.badRequest('Format de startDate invalide. Utilisez YYYY-MM-DD')
          }
          query.whereRaw('DATE(date_heure) >= ?', [startDate])
        }
        
        if (endDate) {
          if (!dateRegex.test(endDate)) {
            throw AppException.badRequest('Format de endDate invalide. Utilisez YYYY-MM-DD')
          }
          query.whereRaw('DATE(date_heure) <= ?', [endDate])
        }
      }

      const rdvList = await query.exec()

      const transformedData = RendezVousTransformer.transformMany(rdvList)

      return response.json(ApiResponse.success(transformedData))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération de la liste des rendez-vous')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors du chargement des rendez-vous.')
    }
  }

  /**
   * Créer un rendez-vous avec détection de conflits
   * @route POST /api/v1/appointments
   * @access Authentifié
   */
  public async store({ request, response, auth }: HttpContext) {
    // Validation avec VineJS
    const payload = await request.validateUsing(createRendezVousValidator)

    // Restriction : un médecin ne peut créer un rendez-vous que pour lui-même.
    // Seuls les infirmiers (et admin/gestionnaire) peuvent créer des RDV pour n'importe quel médecin.
    const user = auth.user as any
    if (user?.role && ['docteur_clinique', 'docteur_labo'].includes(user.role)) {
      const medecinConnected = await Medecin.query().where('userId', user.id).first()
      if (!medecinConnected) {
        throw AppException.forbiddenWithMessage('Aucun profil médecin associé à votre compte. Vous ne pouvez pas créer de rendez-vous.')
      }
      if (payload.medecinId !== medecinConnected.id) {
        throw AppException.forbiddenWithMessage('Un médecin ne peut créer un rendez-vous que pour lui-même. Pour programmer un RDV pour un autre médecin, contactez un infirmier ou l\'administration.')
      }
    }
    
    // Combiner date et time en dateHeure
    const dateStr = payload.date // Format: YYYY-MM-DD
    const timeStr = payload.time // Format: HH:mm
    const dateTimeStr = `${dateStr}T${timeStr}:00` // Format: YYYY-MM-DDTHH:mm:ss
    // Interpréter l'heure choisie dans le fuseau métier (pas celui du serveur).
    // Puis convertir en UTC pour stockage cohérent et affichage stable côté clients.
    const startDateTime = DateTime.fromISO(dateTimeStr, { zone: BUSINESS_TIMEZONE }).toUTC()

    // Ne pas autoriser un rendez-vous dans le passé
    const now = nowInBusinessTimezone()
    if (startDateTime <= now) {
      throw AppException.badRequest('Impossible de programmer un rendez-vous dans le passé. Veuillez choisir une date et une heure à venir.')
    }
    
    // Utiliser duration ou dureeMinutes (priorité à duration du frontend)
    const duration = payload.duration || payload.dureeMinutes || 30
    
    // Utiliser type comme motif (priorité à type du frontend)
    const motif = payload.type || payload.motif || 'Consultation'
    
    // Utiliser priority ou priorite (priorité à priority du frontend)
    // Mapper les valeurs pour correspondre au modèle
    let priorite: 'faible' | 'normale' | 'elevee' | 'urgente' = 'normale'
    if (payload.priority) {
      priorite = payload.priority as 'faible' | 'normale' | 'elevee' | 'urgente'
    } else if (payload.priorite) {
      priorite = payload.priorite as 'faible' | 'normale' | 'elevee' | 'urgente'
    }
    // Calcul de l'heure de fin pour la comparaison
    const endDateTime = startDateTime.plus({ minutes: duration })

    try {
      // Restriction métier: un patient ne peut avoir qu'un seul rendez-vous actif
      // (programmé ou en cours) avec le même médecin.
      const existingActiveAppointment = await RendezVous.query()
        .where('patientId', payload.patientId)
        .where('medecinId', payload.medecinId)
        .whereIn('statut', ['programme', 'en_cours'])
        .first()

      if (existingActiveAppointment) {
        throw AppException.badRequest(
          'Ce patient a déjà un rendez-vous actif avec ce médecin. Terminez ou annulez le rendez-vous existant avant d’en créer un nouveau.'
        )
      }

      // --- LOGIQUE DE CONFLIT AVANCÉE ---
      // On cherche si un RDV existe DÉJÀ pour ce médecin qui chevauche la période demandée.
      // Un conflit existe si : (NouveauDebut < AncienFin) ET (NouveauFin > AncienDebut)
      
      const conflict = await RendezVous.query()
        .where('medecinId', payload.medecinId)
        .andWhereNot('statut', 'annule')
        .andWhere(query => {
           // On compare les timestamps en SQL
           // 1. L'ancien RDV commence AVANT la fin du nouveau
           query.where('date_heure', '<', endDateTime.toSQL()!)
           
           // 2. L'ancien RDV finit APRÈS le début du nouveau
           // Syntaxe PostgreSQL pour ajouter des minutes à un timestamp
           query.andWhereRaw(`(date_heure + (duree_minutes || ' minutes')::interval) > ?`, [startDateTime.toSQL()!])
        })
        .first()

      if (conflict) {
        return response.conflict({ 
            success: false,
            message: 'Ce créneau horaire est déjà occupé ou chevauche un autre rendez-vous pour ce médecin.',
            conflict_details: {
                existing_start: conflict.dateHeure,
                duration: conflict.dureeMinutes
            }
        })
      }
      
      // Vérification disponibilité patient (pour éviter qu'il soit à deux endroits à la fois)
      const patientConflict = await RendezVous.query()
        .where('patientId', payload.patientId)
        .andWhereNot('statut', 'annule')
        .andWhere(query => {
           query.where('date_heure', '<', endDateTime.toSQL()!)
           query.andWhereRaw(`(date_heure + (duree_minutes || ' minutes')::interval) > ?`, [startDateTime.toSQL()!])
        })
        .first()

      if (patientConflict) {
          throw AppException.duplicate('Le patient a déjà un autre rendez-vous programmé sur ce créneau horaire.')
      }

      // Utiliser une transaction pour garantir la cohérence des données
      const trx = await db.transaction()

      try {
        // Création en base
        const rdv = await RendezVous.create({
          patientId: payload.patientId,
          medecinId: payload.medecinId,
          dateHeure: startDateTime,
          dureeMinutes: duration,
          motif: motif,
          priorite: priorite,
          notes: payload.notes,
          statut: 'programme'
        }, { client: trx })

        // Charger les relations pour les notifications
        await rdv.load('patient', (q) => q.preload('user'))
        await rdv.load('medecin', (q) => q.preload('user'))

        await trx.commit()

        // Log d'audit - Création de rendez-vous
        const patientName = rdv.patient?.user?.nomComplet || 'Patient'
        const doctorName = rdv.medecin?.user?.nomComplet || 'Médecin'
      const appointmentDate = formatBusinessDateTime(startDateTime)
        const creator = auth.user as any
        const creatorName = creator?.nomComplet || creator?.email || 'Système'
        
        await AuditService.logAppointmentCreated(
          { auth, request, response } as HttpContext,
          rdv.id,
          patientName,
          doctorName,
          appointmentDate,
          creatorName
        )

        // Créer des notifications selon la priorité (en dehors de la transaction car elles sont asynchrones)
        if (priorite === 'urgente') {
          // Notification critique pour rendez-vous urgent
          await NotificationService.notifyUrgentAppointment(
            rdv.id,
            rdv.patient?.user?.nomComplet || 'Patient',
            rdv.medecin?.userId || payload.medecinId, // Utiliser userId du médecin (UserProfile)
            formatBusinessDateTime(startDateTime)
          )
        } else {
          // Notification normale pour le patient ET le médecin concerné uniquement
          const patientUser = await Patient.find(payload.patientId)
          await patientUser?.load('user')
          const doctorUserId = rdv.medecin?.userId // Récupérer le userId du médecin (UserProfile)
          
          if (!doctorUserId) {
            logger.warn({ medecinId: payload.medecinId }, 'Impossible de trouver le userId du médecin pour la notification')
          }
          
          await NotificationService.notifyAppointment(
            patientUser?.userId || null,
            rdv.id,
            formatBusinessDateTime(startDateTime),
            rdv.medecin?.user?.nomComplet || 'Médecin',
            doctorUserId || '', // Utiliser userId du médecin (UserProfile), pas l'ID du modèle Medecin
            patientUser?.user?.nomComplet || null, // Nom du patient pour personnaliser le message
            rdv.motif || null // Type de rendez-vous (motif)
          )
        }

        const transformedRdv = RendezVousTransformer.transform(rdv, true)

        return response.status(201).json(
          ApiResponse.created(
            transformedRdv,
            'Rendez-vous confirmé avec succès'
          )
        )
      } catch (trxError) {
        await trx.rollback()
        throw trxError
      }

    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création du rendez-vous')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.badRequest('Erreur technique lors de la création du rendez-vous.')
    }
  }

  /**
   * Récupérer un rendez-vous par ID
   * @route GET /api/v1/appointments/:id
   * @access Authentifié
   */
  public async show({ params, response }: HttpContext) {
    try {
      const rdv = await RendezVous.query()
        .where('id', params.id)
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .firstOrFail()

      const transformedRdv = RendezVousTransformer.transform(rdv, true)

      return response.json(ApiResponse.success(transformedRdv))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Rendez-vous')
      }
      logger.error({ err: error, appointmentId: params.id }, 'Erreur lors de la récupération du rendez-vous')
      throw AppException.internal('Erreur technique lors de la récupération du rendez-vous.')
    }
  }

  /**
   * Mettre à jour le statut d'un rendez-vous
   * @route PATCH /api/v1/appointments/:id/status
   * @access Authentifié
   */
  public async updateStatus({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateRendezVousStatusValidator)
    
    // Accepter status (camelCase) ou statut (snake_case)
    const newStatut = payload.statut || payload.status
    
    if (!newStatut) {
      throw AppException.badRequest('Le statut est requis (statut ou status).')
    }
    
    try {
      const rdv = await RendezVous.findOrFail(params.id)
      
      // Validation : vérifier que le statut est valide
      const validStatuses = ['programme', 'en_cours', 'termine', 'annule']
      if (!validStatuses.includes(newStatut)) {
        throw AppException.badRequest(`Statut invalide. Valeurs acceptées : ${validStatuses.join(', ')}`)
      }

      // Règle métier : un médecin ne peut pas avoir 2 consultations "en_cours" en même temps.
      if (newStatut === 'en_cours' && rdv.statut !== 'en_cours') {
        const activeConsultation = await RendezVous.query()
          .where('medecinId', rdv.medecinId)
          .where('statut', 'en_cours')
          .whereNot('id', rdv.id)
          .first()

        if (activeConsultation) {
          throw AppException.badRequest(
            'Ce médecin a déjà une consultation en cours. Terminez-la avant de démarrer un autre rendez-vous.'
          )
        }
      }
      
      const oldStatut = rdv.statut
      rdv.statut = newStatut as 'programme' | 'en_cours' | 'termine' | 'annule'
      if (payload.notes) {
        rdv.notes = payload.notes
      }

      // Maintenir les champs d'annulation cohérents en base.
      if (newStatut === 'annule' && oldStatut !== 'annule') {
        rdv.motifAnnulation = payload.notes || 'Rendez-vous annulé'
        rdv.annulePar = (auth.user as any)?.id || 'system'
        rdv.dateAnnulation = nowInBusinessTimezone()
      } else if (newStatut !== 'annule' && oldStatut === 'annule') {
        rdv.motifAnnulation = null
        rdv.annulePar = null
        rdv.dateAnnulation = null
      }
      
      // Charger les relations avant la sauvegarde pour les notifications
      await rdv.load('patient', (q) => q.preload('user'))
      await rdv.load('medecin', (q) => q.preload('user'))
      
      await rdv.save()

      // Notification si le rendez-vous est annulé
      if (newStatut === 'annule' && oldStatut !== 'annule') {
        if (rdv.medecin?.userId) {
          const notifDate = rdv.dateHeure.toFormat("dd/MM/yyyy 'à' HH:mm")
          const notifDoctor = rdv.medecin.user?.nomComplet || 'Médecin'
          const reason = payload.notes || 'Rendez-vous annulé'
          
          await NotificationService.notifyAppointmentCancelled(
            rdv.patient?.userId || null,
            rdv.id,
            notifDate,
            notifDoctor,
            rdv.medecin.userId,
            reason,
            false // Annulation manuelle
          )
        }
      }

      // Notification aux infirmières quand la consultation démarre
      if (newStatut === 'en_cours' && oldStatut === 'programme') {
        const nurseUsers = await UserProfile.query().where('role', 'infirmiere').where('actif', true)
        const nurseIds = nurseUsers.map((u) => u.id)

        if (nurseIds.length > 0) {
          const doctorName = rdv.medecin?.user?.nomComplet || 'Médecin'
          const patientName = rdv.patient?.user?.nomComplet || 'Patient'

          await NotificationService.createNotification(
            nurseIds,
            'Consultation démarrée',
            `${doctorName} a démarré la consultation avec ${patientName}.`,
            {
              type: 'info',
              category: 'clinical',
              targetId: rdv.id,
              targetType: 'appointment',
              actionUrl: `/console-clinique?patientId=${rdv.patientId}&appointmentId=${rdv.id}&startConsultation=true`,
              priority: 'normal',
              groupKey: `consultation_started_${rdv.id}`,
              metadata: {
                appointmentId: rdv.id,
                patientId: rdv.patientId,
                patientName,
                doctorId: rdv.medecinId,
                doctorName,
                status: 'en_cours',
              },
            }
          )
        }
      }

      // Log d'audit spécifique selon le nouveau statut
      const patientName = rdv.patient?.user?.nomComplet || 'Patient'
      const doctorName = rdv.medecin?.user?.nomComplet || 'Médecin'
      const appointmentDate = rdv.dateHeure.toFormat("dd/MM/yyyy 'à' HH:mm")
      const user = auth.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      
      if (newStatut === 'annule' && oldStatut !== 'annule') {
        // Log d'annulation
        await AuditService.logAppointmentCancelled(
          { auth, request, response } as HttpContext,
          params.id,
          patientName,
          doctorName,
          appointmentDate,
          userName,
          payload.notes || 'Rendez-vous annulé'
        )
      } else if ((newStatut === 'en_cours' || newStatut === 'termine') && oldStatut === 'programme') {
        // Log de confirmation (quand le rendez-vous démarre ou se termine)
        await AuditService.logAppointmentConfirmed(
          { auth, request, response } as HttpContext,
          params.id,
          patientName,
          appointmentDate,
          userName
        )
      } else {
        // Log générique de mise à jour pour les autres changements
        await AuditService.logUpdate(
          { auth, request, response } as HttpContext,
          'rendezvous',
          params.id,
          `RDV ${patientName} - ${doctorName}`,
          { statut: { ancien: oldStatut, nouveau: newStatut }, notes: payload.notes }
        )
      }

      const transformedRdv = RendezVousTransformer.transform(rdv, true)

      return response.json(
        ApiResponse.success(
          transformedRdv,
          'Statut mis à jour'
        )
      )
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Rendez-vous')
      }
      logger.error({ err: error }, 'Erreur lors de la mise à jour du statut du rendez-vous')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur technique lors de la mise à jour du statut.')
    }
  }

  /**
   * Mettre à jour un rendez-vous
   * @route PATCH /api/v1/appointments/:id
   * @access Authentifié avec permission appointment_edit
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const rdv = await RendezVous.findOrFail(params.id)
      
      // Charger les relations avant la mise à jour
      await rdv.load('patient', (q) => q.preload('user'))
      await rdv.load('medecin', (q) => q.preload('user'))
      
      const oldDateHeure = rdv.dateHeure
      const oldDuration = rdv.dureeMinutes
      
      // Mettre à jour la date/heure si fournie
      if (request.input('dateHeure')) {
        // Interpréter la date comme heure métier (Kinshasa) pour éviter les décalages.
        const dateHeureInput = request.input('dateHeure')
        // Si la chaîne contient un décalage de fuseau horaire, l'utiliser, sinon interpréter comme local
        const newDateHeure = dateHeureInput.includes('+') || dateHeureInput.includes('-') || dateHeureInput.endsWith('Z')
          ? DateTime.fromISO(dateHeureInput).toUTC()
          : DateTime.fromISO(dateHeureInput, { zone: BUSINESS_TIMEZONE }).toUTC()
        const duration = request.input('dureeMinutes') || rdv.dureeMinutes || 30
        const endDateTime = newDateHeure.plus({ minutes: duration })
        
        // Vérifier les conflits avec d'autres rendez-vous du même médecin
        const conflict = await RendezVous.query()
          .where('medecinId', rdv.medecinId)
          .whereNot('id', rdv.id)
          .andWhereNot('statut', 'annule')
          .andWhere(query => {
            query.where('date_heure', '<', endDateTime.toSQL()!)
            query.andWhereRaw(`(date_heure + (duree_minutes || ' minutes')::interval) > ?`, [newDateHeure.toSQL()!])
          })
          .first()
        
        if (conflict) {
          throw AppException.badRequest('Ce créneau horaire est déjà occupé ou chevauche un autre rendez-vous pour ce médecin.')
        }
        
        // Vérifier les conflits avec d'autres rendez-vous du même patient
        const patientConflict = await RendezVous.query()
          .where('patientId', rdv.patientId)
          .whereNot('id', rdv.id)
          .andWhereNot('statut', 'annule')
          .andWhere(query => {
            query.where('date_heure', '<', endDateTime.toSQL()!)
            query.andWhereRaw(`(date_heure + (duree_minutes || ' minutes')::interval) > ?`, [newDateHeure.toSQL()!])
          })
          .first()
        
        if (patientConflict) {
          throw AppException.duplicate('Le patient a déjà un autre rendez-vous programmé sur ce créneau horaire.')
        }
        
        rdv.dateHeure = newDateHeure
      }
      
      // Mettre à jour la durée si fournie
      if (request.input('dureeMinutes')) {
        rdv.dureeMinutes = request.input('dureeMinutes')
      }
      
      // Mettre à jour le motif si fourni
      if (request.input('motif')) {
        rdv.motif = request.input('motif')
      }
      
      // Mettre à jour les notes si fournies
      if (request.input('notes') !== undefined) {
        rdv.notes = request.input('notes')
      }
      
      // Mettre à jour la priorité si fournie
      if (request.input('priorite') || request.input('priority')) {
        const priorite = request.input('priorite') || request.input('priority')
        rdv.priorite = priorite as 'faible' | 'normale' | 'elevee' | 'urgente'
      }
      
      await rdv.save()
      
      // Log d'audit
      const patientName = rdv.patient?.user?.nomComplet || 'Patient'
      const user = auth.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      const changes: Record<string, any> = {}
      
      // Si la date a changé, log spécifique de reprogrammation
      if (oldDateHeure && oldDateHeure.toMillis() !== rdv.dateHeure.toMillis()) {
        await AuditService.logAppointmentRescheduled(
          { auth, request, response } as HttpContext,
          params.id,
          patientName,
          oldDateHeure.toFormat("dd/MM/yyyy 'à' HH:mm"),
          rdv.dateHeure.toFormat("dd/MM/yyyy 'à' HH:mm"),
          userName
        )
        changes.dateHeure = { ancien: oldDateHeure.toFormat('dd/MM/yyyy HH:mm'), nouveau: rdv.dateHeure.toFormat('dd/MM/yyyy HH:mm') }
      }
      
      if (oldDuration !== rdv.dureeMinutes) {
        changes.dureeMinutes = { ancien: oldDuration, nouveau: rdv.dureeMinutes }
      }
      
      // Log générique de mise à jour si d'autres champs ont changé
      if (Object.keys(changes).length > 0 || request.input('motif') || request.input('notes') || request.input('priorite')) {
        await AuditService.logAppointmentUpdated(
          { auth, request, response } as HttpContext,
          params.id,
          patientName,
          changes,
          userName
        )
      }
      
      // Recharger les relations après la mise à jour
      await rdv.load('patient', (q) => q.preload('user'))
      await rdv.load('medecin', (q) => q.preload('user'))
      
      const transformedRdv = RendezVousTransformer.transform(rdv, true)
      
      return response.json(
        ApiResponse.success(
          transformedRdv,
          'Rendez-vous mis à jour avec succès'
        )
      )
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Rendez-vous')
      }
      logger.error({ err: error, appointmentId: params.id }, 'Erreur lors de la mise à jour du rendez-vous')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur technique lors de la mise à jour du rendez-vous.')
    }
  }

  /**
   * Supprimer un rendez-vous
   * @route DELETE /api/v1/appointments/:id
   * @access Authentifié avec permission appointment_delete
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      const rdv = await RendezVous.findOrFail(params.id)
      
      // Charger les relations pour le log
      await rdv.load('patient', (q) => q.preload('user'))
      await rdv.load('medecin', (q) => q.preload('user'))
      
      const rdvInfo = `RDV ${rdv.patient?.user?.nomComplet || 'Patient'} - ${rdv.medecin?.user?.nomComplet || 'Médecin'} le ${rdv.dateHeure.toFormat('dd/MM/yyyy HH:mm')}`
      
      // Supprimer le rendez-vous
      await rdv.delete()

      // Log d'audit
      await AuditService.logDelete(
        { auth, request: {} as any, response } as HttpContext,
        'rendezvous',
        params.id,
        rdvInfo
      )

      return response.json(
        ApiResponse.deleted('Rendez-vous supprimé avec succès.')
      )
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Rendez-vous')
      }
      logger.error({ err: error }, 'Erreur lors de la suppression du rendez-vous')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur technique lors de la suppression.')
    }
  }

  /**
   * Liste des médecins disponibles.
   * Restriction : un médecin connecté ne voit que lui-même (il ne peut créer des RDV que pour lui).
   * Les infirmiers, admin et gestionnaire voient tous les médecins.
   * @route GET /api/v1/doctors
   * @queryParam establishmentId (optionnel) - Filtrer par établissement
   * @access Authentifié
   */
  public async medecins({ request, response, auth }: HttpContext) {
    try {
      const establishmentId = request.input('establishmentId')
      const query = Medecin.query()
        .preload('user')
        .preload('department')
        .where('disponible', true)

      // Un médecin ne peut créer un RDV que pour lui-même : ne retourner que son profil
      const user = auth.user as any
      if (user?.role && ['docteur_clinique', 'docteur_labo'].includes(user.role)) {
        query.where('userId', user.id)
      } else if (establishmentId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(establishmentId)) {
          query.where('etablissement_id', establishmentId)
        }
      }

      const medecins = await query.exec()
      const data = medecins.map(m => {
        const departmentName = m.department?.nom || m.specialite || 'Non spécifiée'
        return {
          id: m.id,
          value: m.id,
          label: `Dr. ${m.user?.nomComplet ?? 'Médecin'} - ${departmentName}`,
          name: m.user?.nomComplet,
          nomComplet: m.user?.nomComplet,
        }
      })

      return response.json(ApiResponse.success(data))
    } catch (error) {
      throw AppException.internal('Impossible de charger la liste des médecins.')
    }
  }
}