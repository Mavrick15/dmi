import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import KnowledgeBase from '#models/knowledge_base'
import { AppException } from '#exceptions/AppException'

export default class KnowledgeBasesController {
  /**
   * Liste les entrées de la base de connaissances avec filtres
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const { category, search, type } = request.qs()

      let query = KnowledgeBase.query().where('actif', true)

      // Filtrer par type
      if (type && ['protocols', 'medications', 'diagnostics', 'procedures', 'guidelines'].includes(type)) {
        query = query.where('type', type)
      }

      // Filtrer par catégorie
      if (category) {
        query = query.where('category', 'ilike', `%${category}%`)
      }

      // Recherche textuelle
      if (search && search.length >= 2) {
        query = query.where((q) => {
          q.where('title', 'ilike', `%${search}%`)
            .orWhere('name', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
            .orWhere('code', 'ilike', `%${search}%`)
            // Recherche dans les tags (JSON) - gérer le cas où tags peut être null
            .orWhereRaw("COALESCE(tags::text, '') ilike ?", [`%${search}%`])
        })
      }

      // Trier par ordre d'affichage puis par date de mise à jour
      // Gérer le cas où ordre_affichage peut être null
      query = query
        .orderByRaw('COALESCE(ordre_affichage, 999999) ASC')
        .orderBy('last_updated', 'desc')

      const knowledgeBases = await query

      return response.ok({
        success: true,
        data: knowledgeBases,
        meta: {
          total: knowledgeBases.length
        }
      })
    } catch (error) {
      // Logger l'erreur complète pour le débogage
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur KnowledgeBasesController.index:', error)
        console.error('Message d\'erreur:', errorMessage)
      }
      // Inclure le message d'erreur dans les détails pour faciliter le débogage
      throw AppException.internal(
        `Erreur lors de la récupération de la base de connaissances: ${errorMessage}`,
        error
      )
    }
  }

  /**
   * Affiche une entrée spécifique
   */
  public async show({ params, response }: HttpContextContract) {
    try {
      const knowledgeBase = await KnowledgeBase.findOrFail(params.id)

      return response.ok({
        success: true,
        data: knowledgeBase
      })
    } catch (error) {
      throw AppException.notFound('Entrée de la base de connaissances introuvable')
    }
  }

  /**
   * Crée une nouvelle entrée
   */
  public async store({ request, response, auth }: HttpContextContract) {
    try {
      const data = request.only([
        'type', 'title', 'name', 'description', 'category', 'code', 'urgency',
        'dosage', 'contraindications', 'interactions', 'sideEffects',
        'criteria', 'examinations', 'differential',
        'indication', 'steps', 'complications',
        'content', 'tags', 'lastUpdated', 'actif', 'ordreAffichage'
      ])

      // Validation basique
      if (!data.type || !['protocols', 'medications', 'diagnostics', 'procedures', 'guidelines'].includes(data.type)) {
        throw AppException.badRequest('Le type est requis et doit être valide')
      }

      if (!data.title && !data.name) {
        throw AppException.badRequest('Le titre ou le nom est requis')
      }

      const knowledgeBase = await KnowledgeBase.create({
        ...data,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date()
      })

      return response.created({
        success: true,
        data: knowledgeBase,
        message: 'Entrée créée avec succès'
      })
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la création de l\'entrée', error)
    }
  }

  /**
   * Met à jour une entrée
   */
  public async update({ params, request, response }: HttpContextContract) {
    try {
      const knowledgeBase = await KnowledgeBase.findOrFail(params.id)
      const data = request.only([
        'type', 'title', 'name', 'description', 'category', 'code', 'urgency',
        'dosage', 'contraindications', 'interactions', 'sideEffects',
        'criteria', 'examinations', 'differential',
        'indication', 'steps', 'complications',
        'content', 'tags', 'lastUpdated', 'actif', 'ordreAffichage'
      ])

      knowledgeBase.merge({
        ...data,
        lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date()
      })
      await knowledgeBase.save()

      return response.ok({
        success: true,
        data: knowledgeBase,
        message: 'Entrée mise à jour avec succès'
      })
    } catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la mise à jour de l\'entrée', error)
    }
  }

  /**
   * Supprime une entrée (soft delete)
   */
  public async destroy({ params, response }: HttpContextContract) {
    try {
      const knowledgeBase = await KnowledgeBase.findOrFail(params.id)
      knowledgeBase.actif = false
      await knowledgeBase.save()

      return response.ok({
        success: true,
        message: 'Entrée supprimée avec succès'
      })
    } catch (error) {
      throw AppException.internal('Erreur lors de la suppression de l\'entrée', error)
    }
  }
}

