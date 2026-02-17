import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Analyse from '#models/Analyse'
import Patient from '#models/Patient'
import Medecin from '#models/Medecin'
import Consultation from '#models/Consultation'
import UserProfile from '#models/UserProfile'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { DateTime } from 'luxon'
import { createAnalyseValidator, updateAnalyseValidator, searchAnalysesValidator } from '#validators/analyse'
import CacheService from '#services/CacheService'

export default class AnalysesController {
  
  /**
   * Génère un numéro d'analyse au format "ANL-yymjXXX"
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * XXX: nombre aléatoire (3 chiffres, 000-999)
   */
  private generateNumeroAnalyse(): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2) // 2 derniers chiffres de l'année
    const month = now.month
    const day = now.day
    
    // Conversion du mois : 1-9 pour janvier-septembre, A-C pour octobre-décembre
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9) // A=10, B=11, C=12
    
    // Conversion du jour : 1-9 pour 1-9, A-V pour 10-31
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9) // A=10, B=11, ..., V=31
    
    // Nombre aléatoire sur 3 chiffres
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `ANL-${year}${monthChar}${dayChar}${randomNum}`
  }

  /**
   * Lister les analyses
   * @route GET /api/v1/analyses
   */
  public async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // Validation des paramètres de recherche
      const validatedParams = await request.validateUsing(searchAnalysesValidator)
      const { patientId, consultationId, statut, typeAnalyse, search } = validatedParams
      const { page, limit } = PaginationHelper.fromQueryString(request, 20, 1000)

      const query = Analyse.query()
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .preload('consultation')
        .preload('resultats')
        .orderBy('datePrescription', 'desc')

      if (patientId) {
        query.where('patientId', patientId)
      }

      if (consultationId) {
        query.where('consultationId', consultationId)
      }

      if (statut) {
        query.where('statut', statut)
      }

      if (typeAnalyse) {
        query.where('typeAnalyse', typeAnalyse)
      }

      // Recherche par numéro d'analyse, nom du patient, ou type d'analyse
      if (search && search.trim()) {
        const searchTerm = `%${search.trim().toLowerCase()}%`
        query.where((q) => {
          q.whereRaw('LOWER(numero_analyse) LIKE ?', [searchTerm])
            .orWhereRaw('LOWER(type_analyse::text) LIKE ?', [searchTerm])
            .orWhereHas('patient', (patientQuery) => {
              patientQuery.whereHas('user', (userQuery) => {
                userQuery.whereRaw('LOWER(nom_complet) LIKE ?', [searchTerm])
              })
              .orWhereRaw('LOWER(numero_patient) LIKE ?', [searchTerm])
            })
        })
      }

      // Si c'est un médecin, filtrer par ses analyses (optionnel, basé sur les permissions)
      // L'administrateur peut voir toutes les analyses grâce à ses permissions
      if (user.role === 'docteur' && !patientId) {
        const medecin = await Medecin.findBy('userId', user.id)
        if (medecin) {
          query.where('medecinId', medecin.id)
        }
      }

      const analyses = await query.paginate(page, limit)

      return response.json(
        ApiResponse.paginated(
          analyses.all().map(a => ({
            id: a.id,
            numeroAnalyse: a.numeroAnalyse,
            patient: a.patient ? {
              id: a.patient.id,
              name: a.patient.user?.nomComplet || 'Patient inconnu',
              numeroPatient: a.patient.numeroPatient
            } : null,
            medecin: a.medecin ? {
              id: a.medecin.id,
              name: a.medecin.user?.nomComplet || 'Médecin inconnu'
            } : null,
            consultation: a.consultation ? {
              id: a.consultation.id,
              dateConsultation: a.consultation.dateConsultation
            } : null,
            typeAnalyse: a.typeAnalyse,
            statut: a.statut,
            datePrescription: a.datePrescription,
            datePrelevement: a.datePrelevement,
            dateReception: a.dateReception,
            dateResultat: a.dateResultat,
            laboratoire: a.laboratoire,
            notesPrescription: a.notesPrescription,
            priorite: a.priorite,
            resultats: a.resultats || [],
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
          })),
          analyses.currentPage,
          analyses.perPage,
          analyses.total
        )
      )
    } catch (error: any) {
      if (error?.code === 'E_VALIDATION_ERROR' || error?.status === 422) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération de la liste des analyses')
      throw AppException.internal('Erreur lors du chargement des analyses.')
    }
  }

  /**
   * Afficher les détails d'une analyse
   * @route GET /api/v1/analyses/:id
   */
  public async show({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.query()
        .where('id', params.id)
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .preload('consultation')
        .preload('resultats', (q) => q.preload('valideur'))
        .preload('factures')
        .first()

      if (!analyse) {
        throw AppException.notFound('Analyse')
      }

      return response.json(
        ApiResponse.success({
          id: analyse.id,
          numeroAnalyse: analyse.numeroAnalyse,
          patient: analyse.patient ? {
            id: analyse.patient.id,
            name: analyse.patient.user?.nomComplet || 'Patient inconnu',
            numeroPatient: analyse.patient.numeroPatient
          } : null,
          medecin: analyse.medecin ? {
            id: analyse.medecin.id,
            name: analyse.medecin.user?.nomComplet || 'Médecin inconnu'
          } : null,
          consultation: analyse.consultation ? {
            id: analyse.consultation.id,
            dateConsultation: analyse.consultation.dateConsultation
          } : null,
          typeAnalyse: analyse.typeAnalyse,
          statut: analyse.statut,
          datePrescription: analyse.datePrescription,
          datePrelevement: analyse.datePrelevement,
          dateReception: analyse.dateReception,
          dateResultat: analyse.dateResultat,
          laboratoire: analyse.laboratoire,
          notesPrescription: analyse.notesPrescription,
          priorite: analyse.priorite,
          resultats: analyse.resultats.map(r => ({
            id: r.id,
            parametre: r.parametre,
            valeur: r.valeur,
            unite: r.unite,
            valeurNormaleMin: r.valeurNormaleMin,
            valeurNormaleMax: r.valeurNormaleMax,
            interpretation: r.interpretation,
            commentaire: r.commentaire,
            annotation: r.annotation || null,
            signature: r.signature ? 'signée' : null,
            validePar: r.validePar ? {
              id: r.valideur?.id,
              name: r.valideur?.nomComplet
            } : null,
            dateValidation: r.dateValidation,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
          })),
          facture: analyse.factures && analyse.factures.length > 0 ? {
            id: analyse.factures[0].id,
            numeroFacture: analyse.factures[0].numeroFacture,
            montantTotal: analyse.factures[0].montantTotal,
            statut: analyse.factures[0].statut
          } : null,
          createdAt: analyse.createdAt,
          updatedAt: analyse.updatedAt
        })
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération de l\'analyse')
      throw AppException.internal('Erreur lors du chargement de l\'analyse.')
    }
  }

  /**
   * Créer une nouvelle analyse
   * @route POST /api/v1/analyses
   */
  public async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // La vérification de permission est gérée par le middleware
      // Récupérer le médecin si l'utilisateur est médecin, sinon null
      const medecin = user.role === 'docteur' ? await Medecin.findBy('userId', user.id) : null

      // Validation avec VineJS
      const payload = await request.validateUsing(createAnalyseValidator)

      // Vérifier que le patient existe
      const patient = await Patient.find(payload.patientId)
      if (!patient) {
        throw AppException.notFound('Patient introuvable')
      }

      // Vérifier la consultation si fournie
      if (payload.consultationId) {
        const consultation = await Consultation.find(payload.consultationId)
        if (!consultation) {
          throw AppException.notFound('Consultation introuvable')
        }
      }

      // Générer le numéro d'analyse
      let numeroAnalyse = this.generateNumeroAnalyse()
      
      // Vérifier l'unicité et régénérer si nécessaire (max 10 tentatives)
      let attempts = 0
      while (attempts < 10) {
        const existing = await Analyse.query().where('numeroAnalyse', numeroAnalyse).first()
        if (!existing) {
          break
        }
        // Attendre une seconde et régénérer
        await new Promise(resolve => setTimeout(resolve, 1000))
        numeroAnalyse = this.generateNumeroAnalyse()
        attempts++
      }
      
      // En cas d'échec, ajouter un suffixe aléatoire tout en gardant le format ANL-
      if (attempts >= 10) {
        const baseNumber = this.generateNumeroAnalyse()
        numeroAnalyse = `${baseNumber}${Math.floor(Math.random() * 10)}`
      }

      // Créer l'analyse
      const analyse = await Analyse.create({
        numeroAnalyse,
        patientId: payload.patientId,
        consultationId: payload.consultationId || null,
        medecinId: medecin?.id || null, // Peut être null si l'utilisateur n'est pas médecin
        typeAnalyse: payload.typeAnalyse as any,
        statut: 'prescrite',
        laboratoire: payload.laboratoire || null,
        notesPrescription: payload.notesPrescription || null,
        priorite: (payload.priorite || 'normale') as any
      })
      await CacheService.deleteAsync('analyses:stats')

      await analyse.load('patient', (q) => q.preload('user'))
      if (analyse.medecinId) {
        await analyse.load('medecin', (q) => q.preload('user'))
      }

      return response.status(201).json(
        ApiResponse.created({
          id: analyse.id,
          numeroAnalyse: analyse.numeroAnalyse,
          patient: analyse.patient ? {
            id: analyse.patient.id,
            name: analyse.patient.user?.nomComplet || 'Patient inconnu'
          } : null,
          typeAnalyse: analyse.typeAnalyse,
          statut: analyse.statut,
          datePrescription: analyse.datePrescription,
          priorite: analyse.priorite
        }, 'Analyse prescrite avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la création de l\'analyse')
      throw AppException.internal('Erreur lors de la création de l\'analyse.')
    }
  }

  /**
   * Mettre à jour une analyse
   * @route PUT /api/v1/analyses/:id
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.find(params.id)
      if (!analyse) {
        throw AppException.notFound('Analyse')
      }

      // Validation avec VineJS
      const payload = await request.validateUsing(updateAnalyseValidator)

      // Mettre à jour les champs fournis
      if (payload.typeAnalyse) analyse.typeAnalyse = payload.typeAnalyse
      if (payload.statut) analyse.statut = payload.statut as any
      if (payload.datePrescription) analyse.datePrescription = DateTime.fromJSDate(payload.datePrescription)
      if (payload.dateResultat) analyse.dateResultat = DateTime.fromJSDate(payload.dateResultat)
      if (payload.notes) analyse.notesPrescription = payload.notes
      if (payload.laboratoire !== undefined) analyse.laboratoire = payload.laboratoire
      if (payload.priorite) analyse.priorite = payload.priorite as any

      await analyse.save()
      await CacheService.deleteAsync('analyses:stats')

      await analyse.load('patient', (q) => q.preload('user'))
      if (analyse.medecinId) {
        await analyse.load('medecin', (q) => q.preload('user'))
      }
      await analyse.load('resultats')

      return response.json(
        ApiResponse.updated({
          id: analyse.id,
          numeroAnalyse: analyse.numeroAnalyse,
          statut: analyse.statut,
          datePrelevement: analyse.datePrelevement,
          dateReception: analyse.dateReception,
          dateResultat: analyse.dateResultat
        }, 'Analyse mise à jour avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la mise à jour de l\'analyse')
      throw AppException.internal('Erreur lors de la mise à jour de l\'analyse.')
    }
  }

  /**
   * Annuler une analyse
   * @route PATCH /api/v1/analyses/:id/cancel
   */
  public async cancel({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.find(params.id)
      if (!analyse) {
        throw AppException.notFound('Analyse')
      }

      if (analyse.statut === 'annulee') {
        throw AppException.badRequest('Cette analyse est déjà annulée')
      }

      if (analyse.statut === 'terminee') {
        throw AppException.badRequest('Impossible d\'annuler une analyse terminée')
      }

      analyse.statut = 'annulee'
      await analyse.save()
      await CacheService.deleteAsync('analyses:stats')

      return response.json(
        ApiResponse.success({
          id: analyse.id,
          statut: analyse.statut
        }, 'Analyse annulée avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de l\'annulation de l\'analyse')
      throw AppException.internal('Erreur lors de l\'annulation de l\'analyse.')
    }
  }

  /**
   * Supprimer une analyse
   * @route DELETE /api/v1/analyses/:id
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.find(params.id)
      if (!analyse) {
        throw AppException.notFound('Analyse')
      }

      // La vérification de permission est gérée par le middleware

      // Supprimer l'analyse (les résultats seront supprimés en cascade grâce à la relation)
      await analyse.delete()

      return response.json(
        ApiResponse.success(null, 'Analyse supprimée avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la suppression de l\'analyse')
      throw AppException.internal('Erreur lors de la suppression de l\'analyse.')
    }
  }

  /**
   * Statistiques des analyses
   * @route GET /api/v1/analyses/stats
   */
  public async stats({ response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const cacheKey = 'analyses:stats'
      const cached = await CacheService.getAsync(cacheKey)
      if (cached !== undefined) {
        return response.json(ApiResponse.success(cached))
      }

      const total = await Analyse.query().count('* as total').first()
      const parStatut = await Analyse.query()
        .select('statut')
        .count('* as count')
        .groupBy('statut')
      
      const parType = await Analyse.query()
        .select('type_analyse')
        .count('* as count')
        .groupBy('type_analyse')

      const data = {
        total: Number(total?.$extras.total || 0),
        parStatut: parStatut.map(s => ({
          statut: s.statut,
          count: Number(s.$extras.count || 0)
        })),
        parType: parType.map(t => ({
          type: t.typeAnalyse,
          count: Number(t.$extras.count || 0)
        }))
      }
      await CacheService.setAsync(cacheKey, data, 60)
      return response.json(ApiResponse.success(data))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques')
      throw AppException.internal('Erreur lors du chargement des statistiques.')
    }
  }
}

