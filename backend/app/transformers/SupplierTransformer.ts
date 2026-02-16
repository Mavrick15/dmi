import { BaseTransformer } from './BaseTransformer.js'
import type Fournisseur from '#models/Fournisseur'
import { DateTime } from 'luxon'

/**
 * Transformer pour les données Fournisseur
 * Structure et organise les données de fournisseur de manière cohérente
 */
export class SupplierTransformer extends BaseTransformer {
  /**
   * Transforme un fournisseur
   */
  static transform(fournisseur: Fournisseur, detailed = false): any {
    const transformer = new SupplierTransformer()
    return transformer.transformSingle(fournisseur, detailed)
  }

  /**
   * Transforme une collection de fournisseurs
   */
  static transformMany(fournisseurs: Fournisseur[], detailed = false): any[] {
    const transformer = new SupplierTransformer()
    return fournisseurs.map(f => transformer.transformSingle(f, detailed))
  }

  private transformSingle(f: Fournisseur, detailed: boolean): any {
    const totalOrders = Number((f as any).$extras?.total_commandes) || 0

    const baseData = {
      id: f.id,
      nom: f.nom,
      name: f.nom, // Alias pour compatibilité
      contactNom: f.contactNom || null,
      contactName: f.contactNom || null,
      email: f.email || null,
      telephone: f.telephone || null,
      phone: f.telephone || null,
      adresse: f.adresse || null,
      address: f.adresse || null,
      delaiLivraisonMoyen: f.delaiLivraisonMoyen || 2,
      averageDeliveryDays: f.delaiLivraisonMoyen || 2,
      actif: f.actif !== undefined ? f.actif : true,
      active: f.actif !== undefined ? f.actif : true,
      createdAt: f.createdAt?.toISO() || null,
      updatedAt: f.updatedAt?.toISO() || null,
    }

    if (detailed) {
      return {
        ...baseData,
        totalOrders: totalOrders,
        totalCommandes: totalOrders, // Alias pour compatibilité
        nextDelivery: DateTime.now().plus({ days: f.delaiLivraisonMoyen || 2 }).toISODate(),
        rating: 4.5, // Mock pour le frontend
        averageDeliveryTime: `${f.delaiLivraisonMoyen || 2} jours`,
      }
    }

    return baseData
  }
}

