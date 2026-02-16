import { BaseTransformer } from './BaseTransformer.js'
import type Etablissement from '#models/Etablissement'

/**
 * Transformer pour les données Etablissement
 * Structure et organise les données d'établissement de manière cohérente
 */
export class EtablissementTransformer extends BaseTransformer {
  /**
   * Transforme un établissement
   */
  static transform(etablissement: Etablissement): any {
    const transformer = new EtablissementTransformer()
    return transformer.transformSingle(etablissement)
  }

  /**
   * Transforme une collection d'établissements
   */
  static transformMany(etablissements: Etablissement[]): any[] {
    const transformer = new EtablissementTransformer()
    return etablissements.map(e => transformer.transformSingle(e))
  }

  private transformSingle(e: Etablissement): any {
    return {
      id: e.id,
      nom: e.nom,
      name: e.nom, // Alias pour compatibilité
      adresse: e.adresse || null,
      address: e.adresse || null,
      telephone: e.telephone || null,
      phone: e.telephone || null,
      email: e.email || null,
      typeEtablissement: e.typeEtablissement || null,
      type: e.typeEtablissement || null,
      numeroAgrement: e.numeroAgrement || null,
      actif: e.actif !== undefined ? e.actif : true,
      active: e.actif !== undefined ? e.actif : true,
      createdAt: e.createdAt?.toISO() || null,
      updatedAt: e.updatedAt?.toISO() || null,
    }
  }
}

