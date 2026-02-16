import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Department from '#models/department'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

export default class DepartmentsController {
  
  /**
   * Liste tous les départements
   * @route GET /api/v1/departments
   * @access Admin, Gestionnaire
   */
  public async index({ request, response }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 10, 100)
    const search = request.input('search')
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

    const query = Department.query()

    if (search) {
      const searchTerm = search.trim()
      query.where((q) => {
        q.where('nom', 'ilike', `%${searchTerm}%`)
         .orWhere('code', 'ilike', `%${searchTerm}%`)
         .orWhere('description', 'ilike', `%${searchTerm}%`)
      })
    }

    if (actif !== undefined) {
      query.where('actif', actif === 'true' || actif === true)
    }

    const departments = await query
      .orderBy('ordre_affichage', 'asc')
      .orderBy('nom', 'asc')
      .paginate(page, limit)

    return response.json(
      ApiResponse.paginated(
        departments.all(),
        departments.currentPage,
        departments.perPage,
        departments.total
      )
    )
  }

  /**
   * Affiche un département spécifique
   * @route GET /api/v1/departments/:id
   * @access Admin, Gestionnaire
   */
  public async show({ params, response }: HttpContext) {
    try {
      const department = await Department.findOrFail(params.id)
      await department.load('medecins', (query) => {
        query.preload('user')
      })
      return response.json(ApiResponse.success(department))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Département introuvable')
      }
      throw error
    }
  }

  /**
   * Crée un nouveau département
   * @route POST /api/v1/departments
   * @access Admin
   */
  public async store({ request, response, auth }: HttpContext) {
    const data = request.only(['nom', 'code', 'description', 'couleur', 'ordreAffichage'])

    if (!data.nom) {
      throw AppException.badRequest('Le nom du département est obligatoire.')
    }

    if (!data.code) {
      throw AppException.badRequest('Le code du département est obligatoire.')
    }

    // Vérifier l'unicité du nom
    const existingNom = await Department.findBy('nom', data.nom.trim())
    if (existingNom) {
      throw AppException.duplicate('Un département avec ce nom existe déjà')
    }

    // Vérifier l'unicité du code
    const existingCode = await Department.findBy('code', data.code.trim().toUpperCase())
    if (existingCode) {
      throw AppException.duplicate('Un département avec ce code existe déjà')
    }

    try {
      const department = await Department.create({
        nom: data.nom.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || null,
        couleur: data.couleur || '#3B82F6',
        ordreAffichage: data.ordreAffichage || 0,
        actif: true
      })

      // Log d'audit
      await AuditService.logCreate(
        { auth, request, response } as HttpContext,
        'department',
        department.id,
        { nom: department.nom, code: department.code }
      )

      return response.status(201).json(ApiResponse.success(department, 'Département créé avec succès'))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création du département')
      throw AppException.internal('Erreur lors de la création du département.')
    }
  }

  /**
   * Met à jour un département
   * @route PUT /api/v1/departments/:id
   * @access Admin
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const department = await Department.findOrFail(params.id)
      const data = request.only(['nom', 'code', 'description', 'couleur', 'actif', 'ordreAffichage'])

      // Vérifier l'unicité du nom si modifié
      if (data.nom && data.nom.trim() !== department.nom) {
        const existingNom = await Department.findBy('nom', data.nom.trim())
        if (existingNom && existingNom.id !== department.id) {
          throw AppException.duplicate('Un département avec ce nom existe déjà')
        }
      }

      // Vérifier l'unicité du code si modifié
      if (data.code && data.code.trim().toUpperCase() !== department.code) {
        const existingCode = await Department.findBy('code', data.code.trim().toUpperCase())
        if (existingCode && existingCode.id !== department.id) {
          throw AppException.duplicate('Un département avec ce code existe déjà')
        }
      }

      const oldData = department.serialize()

      department.merge({
        nom: data.nom?.trim() || department.nom,
        code: data.code?.trim().toUpperCase() || department.code,
        description: data.description?.trim() || department.description,
        couleur: data.couleur || department.couleur,
        actif: data.actif !== undefined ? data.actif : department.actif,
        ordreAffichage: data.ordreAffichage !== undefined ? data.ordreAffichage : department.ordreAffichage,
      })

      await department.save()

      // Log d'audit
      await AuditService.logUpdate(
        { auth, request, response } as HttpContext,
        'department',
        department.id,
        oldData,
        department.serialize()
      )

      return response.json(ApiResponse.success(department, 'Département mis à jour avec succès'))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Département introuvable')
      }
      if (error.status === 409) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la mise à jour du département')
      throw AppException.internal('Erreur lors de la mise à jour du département.')
    }
  }

  /**
   * Supprime un département
   * @route DELETE /api/v1/departments/:id
   * @access Admin
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      const department = await Department.findOrFail(params.id)

      // Vérifier s'il y a des médecins associés
      const medecinsCount = await department.related('medecins').query().count('* as total')
      if (medecinsCount[0].$extras.total > 0) {
        throw AppException.badRequest('Impossible de supprimer ce département car il contient des médecins. Veuillez d\'abord réassigner les médecins à un autre département.')
      }

      const oldData = department.serialize()
      await department.delete()

      // Log d'audit
      await AuditService.logDelete(
        { auth, request: { input: () => ({}) }, response } as HttpContext,
        'department',
        department.id,
        oldData
      )

      return response.json(ApiResponse.success(null, 'Département supprimé avec succès'))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Département introuvable')
      }
      if (error.status === 400) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la suppression du département')
      throw AppException.internal('Erreur lors de la suppression du département.')
    }
  }
}
