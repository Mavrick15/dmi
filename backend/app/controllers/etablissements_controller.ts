import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Etablissement from '#models/Etablissement'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import { EtablissementTransformer } from '../transformers/EtablissementTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import CacheService from '#services/CacheService'

export default class EtablissementsController {
  
  public async index({ request, response }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 9, 100)
    const search = request.input('search')
    const type = request.input('type')
    const actif = request.input('actif')

    // Validation de la recherche
    if (search) {
      const searchTrimmed = search.trim()
      if (searchTrimmed.length < 2) {
        throw AppException.badRequest('La recherche doit contenir au moins 2 caractères')
      }
      if (searchTrimmed.length > 100) {
        throw AppException.badRequest('La recherche ne peut pas dépasser 100 caractères')
      }
    }

    const query = Etablissement.query()

    if (search) {
      const searchTerm = search.trim()
      query.where((q) => {
        q.where('nom', 'ilike', `%${searchTerm}%`)
         .orWhere('adresse', 'ilike', `%${searchTerm}%`)
         .orWhere('email', 'ilike', `%${searchTerm}%`)
      })
    }

    if (type) {
      query.where('type_etablissement', type)
    }

    if (actif !== undefined) {
      query.where('actif', actif === 'true' || actif === true)
    }

    const etablissements = await query
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    const transformedData = EtablissementTransformer.transformMany(etablissements.all())

    return response.json(
      ApiResponse.paginated(
        transformedData,
        etablissements.currentPage,
        etablissements.perPage,
        etablissements.total
      )
    )
  }

  public async show({ params, response }: HttpContext) {
    try {
      const etablissement = await Etablissement.findOrFail(params.id)
      const transformed = EtablissementTransformer.transform(etablissement)
      return response.json(ApiResponse.success(transformed))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Établissement introuvable')
      }
      throw error
    }
  }

  public async store({ request, response, auth }: HttpContext) {
    const data = request.only(['nom', 'adresse', 'telephone', 'email', 'typeEtablissement', 'numeroAgrement'])

    if (!data.nom) {
        throw AppException.badRequest("Le nom de l'établissement est obligatoire.")
    }

    const existing = await Etablissement.findBy('nom', data.nom.trim())
    if (existing) {
        throw AppException.duplicate("Un établissement avec ce nom")
    }

    try {
      const etablissement = await Etablissement.create({
          ...data,
          nom: data.nom.trim(),
          actif: true
      })
      await CacheService.deleteAsync('etablissements:stats')
      await CacheService.deleteAsync('admin:stats:overview')

      // Log d'audit
      await AuditService.logCreate(
        { auth, request, response } as HttpContext,
        'etablissement',
        etablissement.id,
        etablissement.nom
      )

      const transformedEtablissement = EtablissementTransformer.transform(etablissement)

      return response.status(201).json(
        ApiResponse.created(
          transformedEtablissement,
          'Établissement créé'
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création de l\'établissement')
      throw error
    }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const etablissement = await Etablissement.findOrFail(params.id)
      const oldValues = {
        nom: etablissement.nom,
        adresse: etablissement.adresse,
        telephone: etablissement.telephone,
        email: etablissement.email,
        typeEtablissement: etablissement.typeEtablissement,
        numeroAgrement: etablissement.numeroAgrement,
        actif: etablissement.actif
      }

      const data = request.only(['nom', 'adresse', 'telephone', 'email', 'typeEtablissement', 'numeroAgrement', 'actif'])

      // Vérifier si le nom change et s'il existe déjà
      if (data.nom && data.nom.trim() !== etablissement.nom) {
        const existing = await Etablissement.findBy('nom', data.nom.trim())
        if (existing && existing.id !== params.id) {
          throw AppException.duplicate("Un établissement avec ce nom existe déjà")
        }
      }

      // Mettre à jour seulement les champs fournis
      if (data.nom !== undefined) etablissement.nom = data.nom.trim()
      if (data.adresse !== undefined) etablissement.adresse = data.adresse || null
      if (data.telephone !== undefined) etablissement.telephone = data.telephone || null
      if (data.email !== undefined) etablissement.email = data.email || null
      if (data.typeEtablissement !== undefined) etablissement.typeEtablissement = data.typeEtablissement
      if (data.numeroAgrement !== undefined) etablissement.numeroAgrement = data.numeroAgrement || null
      if (data.actif !== undefined) etablissement.actif = data.actif

      await etablissement.save()
      await CacheService.deleteAsync('etablissements:stats')
      await CacheService.deleteAsync('admin:stats:overview')

      // Log d'audit
      const changes: Record<string, any> = {}
      if (data.nom && data.nom !== oldValues.nom) changes.nom = { old: oldValues.nom, new: data.nom }
      if (data.adresse !== undefined && data.adresse !== oldValues.adresse) changes.adresse = { old: oldValues.adresse, new: data.adresse }
      if (data.telephone !== undefined && data.telephone !== oldValues.telephone) changes.telephone = { old: oldValues.telephone, new: data.telephone }
      if (data.email !== undefined && data.email !== oldValues.email) changes.email = { old: oldValues.email, new: data.email }
      if (data.typeEtablissement !== undefined && data.typeEtablissement !== oldValues.typeEtablissement) changes.typeEtablissement = { old: oldValues.typeEtablissement, new: data.typeEtablissement }
      if (data.numeroAgrement !== undefined && data.numeroAgrement !== oldValues.numeroAgrement) changes.numeroAgrement = { old: oldValues.numeroAgrement, new: data.numeroAgrement }
      if (data.actif !== undefined && data.actif !== oldValues.actif) changes.actif = { old: oldValues.actif, new: data.actif }

      if (Object.keys(changes).length > 0) {
        await AuditService.logUpdate(
          { auth, request, response } as HttpContext,
          'etablissement',
          etablissement.id,
          etablissement.nom,
          changes
        )
      }

      const transformed = EtablissementTransformer.transform(etablissement)

      return response.json(
        ApiResponse.success(transformed, 'Établissement mis à jour avec succès')
      )
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Établissement introuvable')
      }
      logger.error({ err: error }, 'Erreur lors de la mise à jour de l\'établissement')
      throw error
    }
  }

  public async destroy({ params, response, auth }: HttpContext) {
    try {
      const etablissement = await Etablissement.findOrFail(params.id)
      const nom = etablissement.nom
      await etablissement.delete()
      
      // Log d'audit
      await AuditService.logDelete(
        { auth, request: {} as any, response } as HttpContext,
        'etablissement',
        params.id,
        nom
      )
      
      return response.json(
        ApiResponse.deleted('Établissement supprimé avec succès.')
      )
    } catch (error: any) {
      throw error
    }
  }

  public async stats({ response }: HttpContext) {
    try {
      const cacheKey = 'etablissements:stats'
      const cached = await CacheService.getAsync(cacheKey)
      if (cached !== undefined) {
        return response.json(ApiResponse.success(cached))
      }

      const total = await Etablissement.query().count('* as total')
      const actifs = await Etablissement.query().where('actif', true).count('* as total')
      const inactifs = await Etablissement.query().where('actif', false).count('* as total')
      
      const byType = await Etablissement.query()
        .select('type_etablissement')
        .count('* as count')
        .groupBy('type_etablissement')

      const data = {
        total: Number(total[0].$extras.total),
        actifs: Number(actifs[0].$extras.total),
        inactifs: Number(inactifs[0].$extras.total),
        byType: byType.map((item: any) => ({
          type: item.typeEtablissement,
          count: Number(item.$extras.count)
        }))
      }
      await CacheService.setAsync(cacheKey, data, 60)
      return response.json(ApiResponse.success(data))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques des établissements')
      throw AppException.internal('Erreur lors de la récupération des statistiques')
    }
  }
}
