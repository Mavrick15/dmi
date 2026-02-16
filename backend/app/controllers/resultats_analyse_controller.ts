import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import ResultatAnalyse from '#models/ResultatAnalyse'
import Analyse from '#models/Analyse'
import UserProfile from '#models/UserProfile'
import NotificationService from '#services/NotificationService'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { DateTime } from 'luxon'

export default class ResultatsAnalyseController {
  
  /**
   * Calculer l'interprétation d'un résultat
   */
  private calculateInterpretation(
    valeur: string,
    valeurNormaleMin: number | null,
    valeurNormaleMax: number | null
  ): 'normal' | 'anormal_bas' | 'anormal_haut' | 'critique' {
    const numValue = parseFloat(valeur)
    if (isNaN(numValue)) {
      return 'normal' // Si la valeur n'est pas numérique, on considère normal
    }

    if (valeurNormaleMin === null && valeurNormaleMax === null) {
      return 'normal'
    }

    if (valeurNormaleMin !== null && numValue < valeurNormaleMin) {
      const ecart = ((valeurNormaleMin - numValue) / valeurNormaleMin) * 100
      return ecart > 50 ? 'critique' : 'anormal_bas'
    }

    if (valeurNormaleMax !== null && numValue > valeurNormaleMax) {
      const ecart = ((numValue - valeurNormaleMax) / valeurNormaleMax) * 100
      return ecart > 50 ? 'critique' : 'anormal_haut'
    }

    return 'normal'
  }

  /**
   * Lister les résultats d'une analyse
   * @route GET /api/v1/analyses/:analyseId/resultats
   */
  public async index({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.find(params.analyseId)
      if (!analyse) {
        throw AppException.notFound('Analyse introuvable')
      }

      const resultats = await ResultatAnalyse.query()
        .where('analyseId', params.analyseId)
        .preload('valideur')
        .orderBy('createdAt', 'asc')

      return response.json(
        ApiResponse.success(
          resultats.map(r => ({
            id: r.id,
            parametre: r.parametre,
            valeur: r.valeur,
            unite: r.unite,
            valeurNormaleMin: r.valeurNormaleMin,
            valeurNormaleMax: r.valeurNormaleMax,
            interpretation: r.interpretation,
            commentaire: r.commentaire,
            annotation: r.annotation || null,
            signature: r.signature ? 'signée' : null, // Ne pas envoyer la signature complète pour des raisons de sécurité
            validePar: r.validePar ? {
              id: r.valideur?.id,
              name: r.valideur?.nomComplet
            } : null,
            dateValidation: r.dateValidation,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
          }))
        )
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération des résultats')
      throw AppException.internal('Erreur lors du chargement des résultats.')
    }
  }

  /**
   * Créer des résultats pour une analyse
   * @route POST /api/v1/analyses/:analyseId/resultats
   */
  public async store({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const analyse = await Analyse.find(params.analyseId)
      if (!analyse) {
        throw AppException.notFound('Analyse introuvable')
      }

      if (analyse.statut === 'annulee') {
        throw AppException.badRequest('Impossible d\'ajouter des résultats à une analyse annulée')
      }

      const payload = request.only(['resultats'])
      
      if (!payload.resultats || !Array.isArray(payload.resultats)) {
        throw AppException.badRequest('Les résultats doivent être un tableau')
      }

      const resultatsCrees = []

      for (const resultat of payload.resultats) {
        const { parametre, valeur, unite, valeurNormaleMin, valeurNormaleMax, commentaire, annotation } = resultat

        if (!parametre || !valeur) {
          continue // Ignorer les résultats incomplets
        }

        const interpretation = this.calculateInterpretation(
          valeur,
          valeurNormaleMin || null,
          valeurNormaleMax || null
        )

        const resultatAnalyse = await ResultatAnalyse.create({
          analyseId: analyse.id,
          parametre,
          valeur,
          unite: unite || null,
          valeurNormaleMin: valeurNormaleMin || null,
          valeurNormaleMax: valeurNormaleMax || null,
          interpretation,
          commentaire: commentaire || null,
          annotation: annotation || null
        })

        resultatsCrees.push(resultatAnalyse)
      }

      // Mettre à jour le statut de l'analyse
      if (analyse.statut === 'prescrite' || analyse.statut === 'en_cours') {
        analyse.statut = 'terminee'
        analyse.dateResultat = DateTime.now()
        await analyse.save()
      }

      // Charger les relations pour la notification
      await analyse.load('patient', (q) => q.preload('user'))
      if (analyse.medecinId) {
        await analyse.load('medecin', (q) => q.preload('user'))
      }

      // Créer une notification pour le médecin prescripteur
      if (analyse.medecinId && analyse.medecin?.userId) {
        try {
          const patientName = analyse.patient?.user?.nomComplet || analyse.patient?.numeroPatient || 'Patient'
          const typeAnalyse = analyse.typeAnalyse || 'Analyse'
          
          // Vérifier s'il y a des résultats critiques
          const hasCriticalResults = resultatsCrees.some(r => r.interpretation === 'critique')
          
          // Récupérer l'ID utilisateur du médecin
          const medecinUserId = analyse.medecin.userId
          
          await NotificationService.createNotification(
            medecinUserId,
            hasCriticalResults 
              ? '⚠️ Résultats d\'analyse critiques disponibles' 
              : 'Résultats d\'analyse disponibles',
            hasCriticalResults
              ? `Les résultats de l'analyse "${typeAnalyse}" pour ${patientName} présentent des valeurs critiques nécessitant votre attention.`
              : `Les résultats de l'analyse "${typeAnalyse}" pour ${patientName} sont maintenant disponibles.`,
            {
              type: hasCriticalResults ? 'critical' : 'info',
              category: 'clinical',
              actionUrl: `/analyses-laboratoire?analyseId=${analyse.id}`,
              targetId: analyse.id,
              targetType: 'analyse',
              priority: hasCriticalResults ? 'urgent' : 'normal'
            }
          )
        } catch (notificationError) {
          // Ne pas faire échouer la création des résultats si la notification échoue
          logger.warn({ err: notificationError }, 'Erreur lors de la création de la notification pour les résultats d\'analyse')
        }
      }

      return response.status(201).json(
        ApiResponse.created({
          resultats: resultatsCrees.map(r => ({
            id: r.id,
            parametre: r.parametre,
            valeur: r.valeur,
            unite: r.unite,
            interpretation: r.interpretation
          })),
          analyse: {
            id: analyse.id,
            statut: analyse.statut,
            dateResultat: analyse.dateResultat
          }
        }, 'Résultats enregistrés avec succès')
      )
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error, message: error.message, stack: error.stack }, 'Erreur lors de la création des résultats')
      
      // Afficher l'erreur réelle pour le débogage
      const errorMessage = error.message || 'Erreur inconnue'
      throw AppException.internal(`Erreur lors de l'enregistrement des résultats: ${errorMessage}`)
    }
  }

  /**
   * Mettre à jour un résultat
   * @route PUT /api/v1/resultats/:id
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const resultat = await ResultatAnalyse.find(params.id)
      if (!resultat) {
        throw AppException.notFound('Résultat introuvable')
      }

      const payload = request.only([
        'parametre',
        'valeur',
        'unite',
        'valeurNormaleMin',
        'valeurNormaleMax',
        'commentaire',
        'annotation'
      ])

      if (payload.parametre) resultat.parametre = payload.parametre
      if (payload.valeur) resultat.valeur = payload.valeur
      if (payload.unite !== undefined) resultat.unite = payload.unite
      if (payload.valeurNormaleMin !== undefined) resultat.valeurNormaleMin = payload.valeurNormaleMin
      if (payload.valeurNormaleMax !== undefined) resultat.valeurNormaleMax = payload.valeurNormaleMax
      if (payload.commentaire !== undefined) resultat.commentaire = payload.commentaire
      if (payload.annotation !== undefined) resultat.annotation = payload.annotation

      // Recalculer l'interprétation
      resultat.interpretation = this.calculateInterpretation(
        resultat.valeur,
        resultat.valeurNormaleMin,
        resultat.valeurNormaleMax
      )

      await resultat.save()

      return response.json(
        ApiResponse.updated({
          id: resultat.id,
          parametre: resultat.parametre,
          valeur: resultat.valeur,
          interpretation: resultat.interpretation
        }, 'Résultat mis à jour avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la mise à jour du résultat')
      throw AppException.internal('Erreur lors de la mise à jour du résultat.')
    }
  }

  /**
   * Valider un résultat
   * @route PATCH /api/v1/resultats/:id/validate
   */
  public async validate({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // La vérification de permission est gérée par le middleware

      const resultat = await ResultatAnalyse.find(params.id)
      if (!resultat) {
        throw AppException.notFound('Résultat introuvable')
      }

      if (resultat.validePar) {
        throw AppException.badRequest('Ce résultat est déjà validé')
      }

      const payload = request.only(['signature'])
      
      resultat.validePar = user.id
      resultat.dateValidation = DateTime.now()
      if (payload.signature) {
        resultat.signature = payload.signature
      }
      await resultat.save()

      // Charger l'analyse pour mettre à jour son statut
      const analyse = await Analyse.find(resultat.analyseId)
      if (analyse && analyse.statut === 'terminee') {
        // Vérifier si tous les résultats sont validés
        const tousResultats = await ResultatAnalyse.query()
          .where('analyseId', analyse.id)
        
        const tousValides = tousResultats.every(r => r.validePar !== null)
        
        if (tousValides) {
          analyse.statut = 'en_attente_validation'
          await analyse.save()
        }
      }

      await resultat.load('valideur')

      return response.json(
        ApiResponse.success({
          id: resultat.id,
          validePar: {
            id: resultat.valideur?.id,
            name: resultat.valideur?.nomComplet
          },
          dateValidation: resultat.dateValidation
        }, 'Résultat validé avec succès')
      )
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la validation du résultat')
      throw AppException.internal('Erreur lors de la validation du résultat.')
    }
  }
}

