import { BaseTransformer } from './BaseTransformer.js'
import type UserProfile from '#models/UserProfile'

/**
 * Transformer pour les données d'authentification
 * Structure et organise les données d'auth de manière cohérente
 */
export class AuthTransformer extends BaseTransformer {
  /**
   * Transforme les données de connexion
   */
  static transformLogin(user: UserProfile, token: string): any {
    return {
      user: {
        id: user.id,
        email: user.email,
        nomComplet: user.nomComplet,
        name: user.nomComplet,
        role: user.role,
        avatar: user.photoProfil || null,
        actif: user.actif,
        active: user.actif,
      },
      token,
      tokenType: 'Bearer',
    }
  }

  /**
   * Transforme les données d'inscription
   */
  static transformRegister(user: UserProfile): any {
    return {
      id: user.id,
      email: user.email,
      nomComplet: user.nomComplet,
      name: user.nomComplet,
      role: user.role,
      photoProfil: user.photoProfil || null,
      telephone: user.telephone || null,
      adresse: user.adresse || null,
      actif: user.actif,
      createdAt: user.createdAt?.toISO() || null,
    }
  }
}

