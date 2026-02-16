import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import ConsultationTemplate from '#models/ConsultationTemplate'
import UserProfile from '#models/UserProfile'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { createTemplateValidator, updateTemplateValidator } from '#validators/clinical_template'

export default class ClinicalTemplatesController {
  
  /**
   * Lister les templates
   * @route GET /api/v1/clinical/templates
   */
  public async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const { category, search, includePrivate = 'false', page, limit } = request.qs()
      const includePrivateBool = includePrivate === 'true'

      // Validation de la pagination
      const { page: pageNum, limit: limitNum } = PaginationHelper.validateAndNormalize(
        page,
        limit,
        20, // Limite par défaut
        100  // Limite maximale
      )

      // Validation de la recherche (longueur minimale et maximale)
      if (search) {
        const searchTrimmed = search.trim()
        if (searchTrimmed.length < 2) {
          throw AppException.badRequest('La recherche doit contenir au moins 2 caractères')
        }
        if (searchTrimmed.length > 100) {
          throw AppException.badRequest('La recherche ne peut pas dépasser 100 caractères')
        }
      }

      let query = ConsultationTemplate.query()

      // Filtrer par visibilité
      if (!includePrivateBool) {
        query.where('is_public', true)
      } else {
        // Inclure les templates publics + ceux créés par l'utilisateur
        query.where((q) => {
          q.where('is_public', true)
            .orWhere('created_by', user.id)
        })
      }

      // Filtrer par catégorie
      if (category) {
        const categoryTrimmed = category.trim()
        if (categoryTrimmed.length === 0) {
          throw AppException.badRequest('Le nom de catégorie ne peut pas être vide')
        }
        if (categoryTrimmed.length > 100) {
          throw AppException.badRequest('Le nom de catégorie ne peut pas dépasser 100 caractères')
        }
        query.where('category', categoryTrimmed)
      }

      // Recherche (optimisée avec index GIN - fallback sur ILIKE si recherche simple)
      if (search) {
        const searchTerm = search.trim()
        // Pour les recherches avec wildcards, utiliser ILIKE (l'index GIN aidera pour les recherches complexes)
        query.where((q) => {
          q.whereILike('name', `%${searchTerm}%`)
            .orWhereILike('description', `%${searchTerm}%`)
        })
      }

      // Compter le total (avant pagination)
      const total = await query.clone().count('* as total').first()
      const totalCount = Number(total?.$extras.total || 0)

      // Paginer et trier
      const templates = await query
        .orderBy('created_at', 'desc')
        .offset((pageNum - 1) * limitNum)
        .limit(limitNum)

      return response.json(ApiResponse.success({
        data: templates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération des templates de consultation')
      throw AppException.internal('Erreur lors du chargement des templates de consultation.')
    }
  }

  /**
   * Créer un template
   * @route POST /api/v1/clinical/templates
   */
  public async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const payload = await request.validateUsing(createTemplateValidator)

      const template = await ConsultationTemplate.create({
        ...payload,
        createdBy: user.id,
      })

      return response.status(201).json(ApiResponse.created(template))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, userId: user?.id }, 'Erreur lors de la création du template de consultation')
      throw AppException.internal('Erreur lors de la création du template de consultation.')
    }
  }

  /**
   * Mettre à jour un template
   * @route PUT /api/v1/clinical/templates/:id
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID du template')
      }

      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const template = await ConsultationTemplate.findOrFail(params.id)

      // Vérifier les permissions
      if (template.createdBy !== user.id && user.role !== 'admin') {
        throw AppException.forbidden('Vous ne pouvez modifier que vos propres templates')
      }

      const payload = await request.validateUsing(updateTemplateValidator)

      template.merge(payload)
      await template.save()

      return response.json(ApiResponse.success(template))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, templateId: params.id, userId: user?.id }, 'Erreur lors de la mise à jour du template de consultation')
      throw AppException.internal('Erreur lors de la mise à jour du template de consultation.')
    }
  }

  /**
   * Supprimer un template
   * @route DELETE /api/v1/clinical/templates/:id
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID du template')
      }

      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const template = await ConsultationTemplate.findOrFail(params.id)

      // Vérifier les permissions
      if (template.createdBy !== user.id && user.role !== 'admin') {
        throw AppException.forbidden('Vous ne pouvez supprimer que vos propres templates')
      }

      await template.delete()

      return response.json(ApiResponse.deleted())
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, templateId: params.id, userId: user?.id }, 'Erreur lors de la suppression du template de consultation')
      throw AppException.internal('Erreur lors de la suppression du template de consultation.')
    }
  }
}

