// openclinic/backend/app/middleware/auth_middleware.ts

import ApiToken from '#models/ApiToken'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

export default class AuthMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    // 1. Chercher dans le Header
    let token = ctx.request.header('Authorization')?.replace('Bearer ', '')

    // 2. Si pas dans le header, chercher dans l'URL (pour les images/pdf)
    if (!token && ctx.request.method() === 'GET') {
      token = ctx.request.input('token')
    }

    if (!token) {
      const error: any = new Error('Non autorisé')
      error.code = 'E_UNAUTHORIZED_ACCESS'
      throw error
    }

    // Vérifier que le token existe, n'est pas révoqué et n'est pas expiré
    const apiToken = await ApiToken.query()
      .where('token', token)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!apiToken) {
      // Vérifier pourquoi le token n'a pas été trouvé pour un meilleur debugging
      const expiredToken = await ApiToken.query().where('token', token).first()

      let errorMessage = 'Token invalide ou expiré'

      if (expiredToken) {
        if (expiredToken.isRevoked) {
          errorMessage = 'Votre session a été déconnectée car une nouvelle connexion a été établie avec ce compte. Veuillez vous reconnecter.'
        } else if (expiredToken.expiresAt && expiredToken.expiresAt <= DateTime.now()) {
          errorMessage = 'Token expiré'
          // Vérifier si un refresh token existe pour ce token
          // Si oui, indiquer qu'un refresh est possible
          const hasRefreshToken = await ApiToken.query()
            .where('user_id', expiredToken.userId)
            .andWhere('is_revoked', false)
            .andWhere('expires_at', '>', DateTime.now())
            .andWhere('token', '!=', token)
            .first()
          
          if (hasRefreshToken) {
            // Le message indique que le token peut être rafraîchi
            // L'intercepteur axios détectera automatiquement le refresh token dans localStorage
          }
        }
      } else {
        errorMessage = 'Token introuvable'
      }

      const error: any = new Error(errorMessage)
      error.code = 'E_UNAUTHORIZED_ACCESS'
      throw error
    }

    ctx.auth = { user: apiToken.user } as any
    await next()
  }
}
