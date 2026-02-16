import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Cim10Code from '#models/Cim10Code'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import db from '@adonisjs/lucid/services/db'

export default class Cim10Controller {
  
  /**
   * Rechercher des codes CIM-10
   * @route GET /api/v1/clinical/cim10
   */
  public async search({ request, response }: HttpContext) {
    const { q, category, page = '1', limit = '50' } = request.qs()
    try {
      // Validation de la pagination
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
      const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50))
      const offset = (pageNum - 1) * limitNum

      let query = Cim10Code.query()

      // Recherche par code ou nom
      if (q) {
        query.where((qBuilder) => {
          qBuilder.whereILike('code', `%${q}%`)
            .orWhereILike('name', `%${q}%`)
        })
      }

      // Filtrer par catégorie
      if (category) {
        query.where('category', category)
      }

      // Compter le total (avant pagination)
      const total = await query.clone().count('* as total').first()
      const totalCount = Number(total?.$extras.total || 0)

      // Paginer les résultats
      const codes = await query
        .orderBy('usage_count', 'desc')
        .orderBy('code', 'asc')
        .offset(offset)
        .limit(limitNum)

      return response.json(ApiResponse.success({
        data: codes,
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
      const { q } = request.qs()
      logger.error({ err: error, query: q }, 'Erreur lors de la recherche de codes CIM-10')
      throw AppException.internal('Erreur lors de la recherche de codes CIM-10.')
    }
  }

  /**
   * Obtenir les catégories CIM-10
   * @route GET /api/v1/clinical/cim10/categories
   */
  public async categories({ response }: HttpContext) {
    try {
      const categories = await db
        .from('cim10_codes')
        .select('category')
        .count('* as count')
        .groupBy('category')
        .orderBy('category', 'asc')

      return response.json(ApiResponse.success(categories))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération des catégories CIM-10')
      throw AppException.internal('Erreur lors du chargement des catégories CIM-10.')
    }
  }

  /**
   * Obtenir un code par son ID
   * @route GET /api/v1/clinical/cim10/:id
   */
  public async show({ params, response }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID du code CIM-10')
      }

      const code = await Cim10Code.findOrFail(params.id)
      return response.json(ApiResponse.success(code))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error, codeId: params.id }, 'Erreur lors de la récupération du code CIM-10')
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Code CIM-10')
      }
      throw AppException.internal('Erreur lors du chargement du code CIM-10.')
    }
  }

  /**
   * Incrémenter le compteur d'utilisation d'un code
   * @route POST /api/v1/clinical/cim10/:id/use
   */
  public async use({ params, response }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID du code CIM-10')
      }

      const code = await Cim10Code.findOrFail(params.id)
      code.usageCount = (code.usageCount || 0) + 1
      await code.save()

      return response.json(ApiResponse.success(code))
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error, codeId: params.id }, 'Erreur lors de l\'incrémentation du compteur d\'utilisation du code CIM-10')
      throw AppException.internal('Erreur lors de la mise à jour du compteur d\'utilisation.')
    }
  }
}

