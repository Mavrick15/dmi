import { randomUUID, randomBytes } from 'crypto'
import { DateTime } from 'luxon'
import ApiToken from '#models/ApiToken'
import type UserProfile from '#models/UserProfile'

/**
 * Service centralisé pour la gestion des tokens d'authentification
 * Supporte les access tokens et refresh tokens
 */
export default class TokenService {
  /**
   * Génère un nouveau token d'accès (courte durée)
   */
  static generateAccessToken(): string {
    return randomUUID()
  }

  /**
   * Génère un nouveau refresh token (longue durée, sécurisé)
   */
  static generateRefreshToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Crée une paire de tokens (access + refresh) pour un utilisateur
   * @param user - L'utilisateur pour lequel créer les tokens
   * @param rememberMe - Si true, tokens valides 30 jours, sinon 1 jour
   * @returns Les tokens créés
   */
  static async createTokenPair(
    user: UserProfile,
    rememberMe: boolean = false
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: DateTime; refreshExpiresAt: DateTime }> {
    const accessToken = this.generateAccessToken()
    const refreshToken = this.generateRefreshToken()

    // Durée selon "Se souvenir de moi"
    const accessTokenDuration = { minutes: 15 } // Access token toujours court
    const refreshTokenDuration = rememberMe 
      ? { days: 30 } 
      : { days: 1 }

    const expiresAt = DateTime.now().plus(accessTokenDuration)
    const refreshExpiresAt = DateTime.now().plus(refreshTokenDuration)

    // Nettoyage des anciens tokens expirés
    await this.cleanupExpiredTokens(user.id)

    // SÉCURITÉ : Révoquer TOUS les autres tokens actifs de cet utilisateur
    // Cela garantit qu'un seul utilisateur peut être connecté avec un compte à la fois
    await this.revokeAllUserTokens(user.id)

    // Création du nouveau token
    await ApiToken.create({
      name: 'auth_token',
      type: 'access',
      token: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
      isRevoked: false,
      expiresAt,
      refreshExpiresAt,
    })

    return {
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    }
  }

  /**
   * Rafraîchit un access token en utilisant un refresh token
   * @param refreshToken - Le refresh token à utiliser
   * @returns Nouveau access token ou null si invalide
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: DateTime } | null> {
    const apiToken = await ApiToken.query()
      .where('refresh_token', refreshToken)
      .andWhere('is_revoked', false)
      .andWhere('refresh_expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!apiToken || !apiToken.user) {
      return null
    }

    // Générer nouveau access token
    const newAccessToken = this.generateAccessToken()
    const expiresAt = DateTime.now().plus({ minutes: 15 })

    // Mettre à jour le token existant
    apiToken.token = newAccessToken
    apiToken.expiresAt = expiresAt
    await apiToken.save()

    return {
      accessToken: newAccessToken,
      expiresAt,
    }
  }

  /**
   * Révoke un token (et son refresh token associé)
   */
  static async revokeToken(token: string): Promise<boolean> {
    const apiToken = await ApiToken.findBy('token', token)
    if (apiToken) {
      apiToken.isRevoked = true
      await apiToken.save()
      return true
    }
    return false
  }

  /**
   * Révoke tous les tokens d'un utilisateur (sauf celui en cours si spécifié)
   * Utilisé pour garantir qu'un seul utilisateur peut être connecté avec un compte à la fois
   */
  static async revokeAllUserTokens(userId: string, exceptToken?: string): Promise<number> {
    const query = ApiToken.query()
      .where('user_id', userId)
      .andWhere('is_revoked', false)
      // Ne révoquer que les tokens non expirés
      .andWhere('expires_at', '>', DateTime.now().toSQL())

    if (exceptToken) {
      query.andWhere('token', '!=', exceptToken)
    }

    const tokens = await query
    const count = tokens.length

    if (count > 0) {
      await Promise.all(tokens.map(token => {
        token.isRevoked = true
        return token.save()
      }))
    }

    return count
  }

  /**
   * Nettoie les tokens expirés pour un utilisateur
   */
  static async cleanupExpiredTokens(userId: string): Promise<number> {
    const deleted = await ApiToken.query()
      .where('user_id', userId)
      .andWhere(q => 
        q.where('is_revoked', true)
          .orWhere('expires_at', '<', DateTime.now().toSQL())
          .orWhere('refresh_expires_at', '<', DateTime.now().toSQL())
      )
      .delete()

    return deleted[0] || 0
  }

  /**
   * Vérifie si un token est valide
   */
  static async validateToken(token: string): Promise<ApiToken | null> {
    return await ApiToken.query()
      .where('token', token)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()
  }
}

