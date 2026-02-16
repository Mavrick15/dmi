import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import QuickNote from '#models/QuickNote'
import UserProfile from '#models/UserProfile'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { createQuickNoteValidator, updateQuickNoteValidator } from '#validators/quick_note'

export default class QuickNotesController {
  
  /**
   * Lister les notes rapides
   * @route GET /api/v1/clinical/quick-notes
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

      let query = QuickNote.query()

      // Filtrer par visibilité
      if (!includePrivateBool) {
        query.where('is_public', true)
      } else {
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
        if (categoryTrimmed.length > 50) {
          throw AppException.badRequest('Le nom de catégorie ne peut pas dépasser 50 caractères')
        }
        query.where('category', categoryTrimmed)
      }

      // Recherche (optimisée avec index GIN - fallback sur ILIKE si recherche simple)
      if (search) {
        const searchTerm = search.trim()
        // Pour les recherches avec wildcards, utiliser ILIKE (l'index GIN aidera pour les recherches complexes)
        query.whereILike('text', `%${searchTerm}%`)
      }

      // Compter le total (avant pagination)
      const total = await query.clone().count('* as total').first()
      const totalCount = Number(total?.$extras.total || 0)

      // Paginer et trier par usage (plus utilisées en premier)
      const notes = await query
        .orderBy('usage_count', 'desc')
        .orderBy('created_at', 'desc')
        .offset((pageNum - 1) * limitNum)
        .limit(limitNum)

      return response.json(ApiResponse.success({
        data: notes,
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
      logger.error({ err: error }, 'Erreur lors de la récupération des notes rapides')
      throw AppException.internal('Erreur lors du chargement des notes rapides.')
    }
  }

  /**
   * Créer une note rapide
   * @route POST /api/v1/clinical/quick-notes
   */
  public async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const payload = await request.validateUsing(createQuickNoteValidator)

      const note = await QuickNote.create({
        ...payload,
        createdBy: user.id,
      })

      return response.status(201).json(ApiResponse.created(note))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, userId: user?.id }, 'Erreur lors de la création de la note rapide')
      throw AppException.internal('Erreur lors de la création de la note rapide.')
    }
  }

  /**
   * Incrémenter le compteur d'utilisation
   * @route POST /api/v1/clinical/quick-notes/:id/use
   */
  public async use({ params, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID de la note')
      }

      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const note = await QuickNote.findOrFail(params.id)
      note.usageCount = (note.usageCount || 0) + 1
      await note.save()

      return response.json(ApiResponse.success(note))
    } catch (error) {
      throw error
    }
  }

  /**
   * Mettre à jour une note
   * @route PUT /api/v1/clinical/quick-notes/:id
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID de la note')
      }

      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const note = await QuickNote.findOrFail(params.id)

      if (note.createdBy !== user.id && user.role !== 'admin') {
        throw AppException.forbidden('Vous ne pouvez modifier que vos propres notes')
      }

      const payload = await request.validateUsing(updateQuickNoteValidator)

      note.merge(payload)
      await note.save()

      return response.json(ApiResponse.success(note))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, noteId: params.id, userId: user?.id }, 'Erreur lors de la mise à jour de la note rapide')
      throw AppException.internal('Erreur lors de la mise à jour de la note rapide.')
    }
  }

  /**
   * Supprimer une note
   * @route DELETE /api/v1/clinical/quick-notes/:id
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID de la note')
      }

      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const note = await QuickNote.findOrFail(params.id)

      if (note.createdBy !== user.id && user.role !== 'admin') {
        throw AppException.forbidden('Vous ne pouvez supprimer que vos propres notes')
      }

      await note.delete()

      return response.json(ApiResponse.deleted())
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      const user = auth.user as UserProfile
      logger.error({ err: error, noteId: params.id, userId: user?.id }, 'Erreur lors de la suppression de la note rapide')
      throw AppException.internal('Erreur lors de la suppression de la note rapide.')
    }
  }
}

