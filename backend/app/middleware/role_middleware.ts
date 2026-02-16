import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  /**
   * @param ctx - Le contexte de la requête
   * @param next - La fonction pour continuer l'exécution
   * @param allowedRoles - La liste des rôles autorisés (ex: ['admin', 'pharmacien'])
   */
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: string[]) {
    // 1. Vérifier si l'utilisateur est bien connecté (au cas où le middleware Auth a été oublié avant)
    if (!ctx.auth.user) {
      return ctx.response.unauthorized({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Vous devez être connecté pour accéder à cette ressource.'
        }
      })
    }

    const user = ctx.auth.user as any
    const userRole = user.role

    // 2. Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    // Note: Si allowedRoles est vide, on bloque par sécurité (ou on laisse passer tout le monde, ici je bloque)
    if (!allowedRoles.includes(userRole)) {
      const userName = user.nomComplet || user.email || 'Utilisateur'
      return ctx.response.forbidden({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Vous n'avez pas le droit ${userName}, Veuillez contacter l'Administrateur Système.`,
          required_roles: allowedRoles
        }
      })
    }

    // 3. Tout est bon, on continue
    await next()
  }
}