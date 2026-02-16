import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware de permissions avancé
 * Permet de vérifier des permissions spécifiques en plus des rôles
 */
export default class PermissionMiddleware {
  /**
   * @param ctx - Le contexte de la requête
   * @param next - La fonction pour continuer l'exécution
   * @param permissions - Liste des permissions requises (ex: ['patients:read', 'patients:write'])
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    permissions: string[] = []
  ) {
    // 1. Vérifier si l'utilisateur est connecté
    if (!ctx.auth.user) {
      return ctx.response.unauthorized({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Vous devez être connecté pour accéder à cette ressource.',
        },
      })
    }

    const user = ctx.auth.user as any

    // 2. Vérifier les permissions spécifiques (même pour les admins)
    if (permissions.length > 0) {
      const userPermissions = await this.getUserPermissions(user.role)
      
      // Si l'utilisateur a la permission "*", il a tous les droits
      if (userPermissions.includes('*')) {
        await next()
        return
      }

      // Vérifier que l'utilisateur a au moins une des permissions requises (OU logique)
      // Cela permet par exemple à un médecin avec 'consultation_create' d'accéder à la recherche
      // de médicaments, même s'il n'a pas 'inventory_view'
      const hasAtLeastOnePermission = permissions.some((perm) =>
        userPermissions.includes(perm)
      )

      if (!hasAtLeastOnePermission) {
        const userName = user.nomComplet || user.email || 'Utilisateur'
        return ctx.response.forbidden({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Vous n'avez pas le droit ${userName}, Veuillez contacter l'Administrateur Système.`,
            required: permissions,
            userPermissions: userPermissions,
          },
        })
      }
    }

    // 4. Tout est bon, continuer
    await next()
  }

  /**
   * Obtenir les permissions d'un rôle depuis la base de données
   * Les permissions doivent être explicitement définies en base de données, même pour les admins
   */
  private async getUserPermissions(role: string): Promise<string[]> {
    try {
      const RolePermission = (await import('#models/RolePermission')).default
      return await RolePermission.getRolePermissions(role)
    } catch (error) {
      // En cas d'erreur, retourner un tableau vide (pas de permissions)
      return []
    }
  }
}

