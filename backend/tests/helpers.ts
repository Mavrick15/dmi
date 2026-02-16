import UserProfile from '#models/UserProfile'
import ApiToken from '#models/ApiToken'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

/**
 * Helpers pour faciliter les tests
 */
export class TestHelpers {
  /**
   * Créer un utilisateur de test
   */
  static async createUser(data: {
    email: string
    password?: string
    nomComplet: string
    role: 'admin' | 'docteur' | 'infirmiere' | 'pharmacien' | 'gestionnaire' | 'patient'
    actif?: boolean
  }) {
    return await UserProfile.create({
      email: data.email,
      password: data.password ? await hash.make(data.password) : await hash.make('Password123!'),
      nomComplet: data.nomComplet,
      role: data.role,
      actif: data.actif !== undefined ? data.actif : true,
    })
  }

  /**
   * Créer un token API pour un utilisateur
   */
  static async createAuthToken(userId: string, token?: string) {
    return await ApiToken.create({
      name: 'test_token',
      type: 'uuid',
      token: token || `test-token-${DateTime.now().toMillis()}`,
      userId: userId,
      isRevoked: false,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })
  }

  /**
   * Créer un utilisateur avec token (helper combiné)
   */
  static async createUserWithToken(data: {
    email: string
    password?: string
    nomComplet: string
    role: 'admin' | 'docteur' | 'infirmiere' | 'pharmacien' | 'gestionnaire' | 'patient'
    actif?: boolean
  }) {
    const user = await this.createUser(data)
    const token = await this.createAuthToken(user.id)
    return { user, token: token.token }
  }
}

