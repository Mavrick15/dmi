import { BaseTransformer } from './BaseTransformer.js'
import type UserProfile from '#models/UserProfile'

/**
 * Transformer pour les données User
 * Structure et organise les données utilisateur de manière cohérente
 */
export class UserTransformer extends BaseTransformer {
  /**
   * Transforme un utilisateur
   */
  static transform(user: UserProfile, detailed = false): any {
    const transformer = new UserTransformer()
    return transformer.transformSingle(user, detailed)
  }

  /**
   * Transforme une collection d'utilisateurs
   */
  static transformMany(users: UserProfile[], detailed = false): any[] {
    const transformer = new UserTransformer()
    return users.map(u => transformer.transformSingle(u, detailed))
  }

  private transformSingle(u: UserProfile, detailed: boolean): any {
    const baseData = {
      id: u.id,
      nomComplet: u.nomComplet || 'Non renseigné',
      name: u.nomComplet || 'Non renseigné',
      email: u.email || null,
      telephone: u.telephone || null,
      phone: u.telephone || null,
      role: u.role || 'patient',
      actif: u.actif !== undefined ? u.actif : true,
      active: u.actif !== undefined ? u.actif : true,
      photoProfil: u.photoProfil || null,
      avatar: u.photoProfil || null,
      adresse: u.adresse || null,
      address: u.adresse || null,
      dateCreation: u.createdAt ? this.formatDate(u.createdAt) : null,
      createdAt: u.createdAt?.toISO() || null,
      updatedAt: u.updatedAt?.toISO() || null,
    }

    if (detailed) {
      return {
        ...baseData,
        nomEtablissement: (u as any).nom_etablissement || null,
        specialite: (u as any).specialite || null,
        // Ajouter d'autres champs détaillés si nécessaire
      }
    }

    return baseData
  }
}

