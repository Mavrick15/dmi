import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import RolePermission from '#models/RolePermission'
import AuditService from '#services/AuditService'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { AppException } from '../exceptions/AppException.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import * as PermissionManager from '../utils/PermissionManager.js'

export default class PermissionsController {
  
  /**
   * Obtenir toutes les permissions disponibles dans le système (depuis le fichier JSON)
   */
  public async availablePermissions({ response }: HttpContext) {
    try {
      const permissions = await PermissionManager.loadPermissions()
      
      // 'id' doit être le 'name' pour compatibilité avec RolePermissionMatrix
      const formattedPermissions = permissions.map(perm => ({
        id: perm.name, // Name utilisé comme id pour compatibilité avec RolePermission
        name: perm.name, // Name utilisé par RolePermission
        category: perm.category,
        description: perm.description
      }))

      return response.json(ApiResponse.success(formattedPermissions))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des permissions disponibles')
      throw AppException.internal('Erreur lors du chargement des permissions.')
    }
  }

  /**
   * Créer une nouvelle permission (Admin uniquement)
   */
  public async create({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as any
      if (!user || user.role !== 'admin') {
        throw AppException.forbidden('Seuls les administrateurs peuvent créer des permissions.')
      }

      const { name, category, description } = request.only(['name', 'category', 'description'])

      if (!name || !category) {
        throw AppException.badRequest('Le nom et la catégorie sont obligatoires.')
      }

      // Vérifier si une permission avec le même nom existe déjà
      const existingPermission = await PermissionManager.findPermissionByName(name)
      if (existingPermission) {
        throw AppException.badRequest('Une permission avec ce nom existe déjà.')
      }

      const permission = {
        name,
        category,
        description: description || '',
        isActive: true
      }

      await PermissionManager.addPermission(permission)

      // Log d'audit
      await AuditService.logAction(
        { auth, request, response } as HttpContext,
        'permission_created',
        `Permission créée: ${permission.name}`,
        permission.name,
        { permission }
      )

      return response.status(201).json(ApiResponse.created(permission, 'Permission créée avec succès.'))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création de la permission')
      if (error instanceof AppException) {
        throw error
      }
      if (error instanceof Error && error.message.includes('existe déjà')) {
        throw AppException.badRequest(error.message)
      }
      throw AppException.internal('Erreur lors de la création de la permission.')
    }
  }

  /**
   * Mettre à jour une permission (Admin uniquement)
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user as any
      if (!user || user.role !== 'admin') {
        throw AppException.forbidden('Seuls les administrateurs peuvent modifier des permissions.')
      }

      const { id } = params // id est le name de la permission
      const { category, description, isActive } = request.only(['category', 'description', 'isActive'])

      const oldPermission = await PermissionManager.findPermissionByName(id)
      if (!oldPermission) {
        throw AppException.notFound('Permission non trouvée.')
      }

      // Mettre à jour (le name ne peut pas être modifié)
      await PermissionManager.updatePermission(id, {
        category,
        description,
        isActive
      })

      const updatedPermission = await PermissionManager.findPermissionByName(id)

      // Log d'audit
      await AuditService.logAction(
        { auth, request, response } as HttpContext,
        'permission_updated',
        `Permission modifiée: ${id}`,
        id,
        {
          ancienne: oldPermission,
          nouvelle: updatedPermission
        }
      )

      return response.json(ApiResponse.updated(updatedPermission, 'Permission mise à jour avec succès.'))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la mise à jour de la permission')
      if (error instanceof AppException) {
        throw error
      }
      if (error instanceof Error && error.message.includes('non trouvée')) {
        throw AppException.notFound(error.message)
      }
      throw AppException.internal('Erreur lors de la mise à jour de la permission.')
    }
  }

  /**
   * Supprimer une permission (Admin uniquement)
   */
  public async delete({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user as any
      if (!user || user.role !== 'admin') {
        throw AppException.forbidden('Seuls les administrateurs peuvent supprimer des permissions.')
      }

      const { id } = params // id est le name de la permission
      const permission = await PermissionManager.findPermissionByName(id)
      if (!permission) {
        throw AppException.notFound('Permission non trouvée.')
      }

      // Vérifier si la permission est utilisée par des rôles
      const rolePermissions = await RolePermission.query()
        .where('permission', id)
        .first()

      const isUsed = !!rolePermissions

      await PermissionManager.deletePermission(id, isUsed)

      // Log d'audit
      await AuditService.logAction(
        { auth, request: { params } as any, response } as HttpContext,
        isUsed ? 'permission_deactivated' : 'permission_deleted',
        isUsed ? `Permission désactivée: ${id}` : `Permission supprimée: ${id}`,
        id,
        { permission }
      )

      return response.json(ApiResponse.success(
        null,
        isUsed
          ? 'Permission désactivée (elle est encore utilisée par des rôles).'
          : 'Permission supprimée avec succès.'
      ))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la suppression de la permission')
      if (error instanceof AppException) {
        throw error
      }
      if (error instanceof Error && error.message.includes('non trouvée')) {
        throw AppException.notFound(error.message)
      }
      throw AppException.internal('Erreur lors de la suppression de la permission.')
    }
  }

  /**
   * Obtenir les permissions de l'utilisateur connecté
   */
  public async getMyPermissions({ auth, response }: HttpContext) {
    try {
      const user = auth.user as any
      if (!user || !user.role) {
        throw AppException.unauthorized('Utilisateur non authentifié.')
      }
      
      const permissions = await RolePermission.getRolePermissions(user.role as string)
      
      return response.json(ApiResponse.success(permissions))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des permissions de l\'utilisateur')
      throw AppException.internal('Erreur lors du chargement des permissions.')
    }
  }

  /**
   * Obtenir les permissions d'un rôle spécifique (Admin uniquement)
   */
  public async getRolePermissions({ params, response }: HttpContext) {
    try {
      const { role } = params
      
      const permissions = await RolePermission.getRolePermissions(role)
      
      return response.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des permissions du rôle')
      throw AppException.internal('Erreur lors du chargement des permissions.')
    }
  }

  /**
   * Mettre à jour les permissions d'un rôle
   */
  public async updateRolePermissions({ params, request, response, auth }: HttpContext) {
    try {
      const { role } = params
      const { permissions } = request.only(['permissions'])

      if (!Array.isArray(permissions)) {
        throw AppException.badRequest('Les permissions doivent être un tableau.')
      }

      // Vérifier que l'utilisateur est admin
      const user = auth.user as any
      if (!user || user.role !== 'admin') {
        const userName = user?.nomComplet || user?.email || 'Utilisateur'
        throw AppException.forbidden(userName)
      }

      // Sauvegarder les anciennes permissions pour le log
      const oldPermissions = await RolePermission.getRolePermissions(role)

      // Mettre à jour les permissions
      await RolePermission.setRolePermissions(role, permissions)

      // Log d'audit
      await AuditService.logAction(
        { auth, request, response } as HttpContext,
        'permissions_updated',
        `Permissions mises à jour pour le rôle ${role}`,
        null,
        {
          role,
          anciennesPermissions: oldPermissions,
          nouvellesPermissions: permissions
        }
      )

      return response.json(ApiResponse.updated({
        role,
        permissions
      }, 'Permissions mises à jour avec succès.'))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la mise à jour des permissions')
      throw AppException.internal('Erreur lors de la mise à jour des permissions.')
    }
  }

  /**
   * Obtenir toutes les permissions de tous les rôles
   */
  public async getAllRolePermissions({ response }: HttpContext) {
    try {
      const roles = ['admin', 'docteur', 'infirmiere', 'pharmacien', 'gestionnaire', 'patient', 'it_specialist']
      
      const rolePermissions: Record<string, string[]> = {}
      
      for (const role of roles) {
        rolePermissions[role] = await RolePermission.getRolePermissions(role)
      }

      return response.json(ApiResponse.success(rolePermissions))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération de toutes les permissions')
      throw AppException.internal('Erreur lors du chargement des permissions.')
    }
  }
}

