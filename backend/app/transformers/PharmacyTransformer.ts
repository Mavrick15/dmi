import { BaseTransformer } from './BaseTransformer.js'
import type Medicament from '#models/Medicament'
import type CommandeFournisseur from '#models/CommandeFournisseur'
import { DateTime } from 'luxon'

/**
 * Transformer pour les données Pharmacy (Médicaments, Commandes, etc.)
 * Structure et organise les données de pharmacie de manière cohérente
 */
export class PharmacyTransformer extends BaseTransformer {
  /**
   * Transforme un médicament
   */
  static transformMedication(medicament: Medicament, detailed = false): any {
    const transformer = new PharmacyTransformer()
    return transformer.transformMedicament(medicament, detailed)
  }

  /**
   * Transforme une collection de médicaments
   */
  static transformMedications(medicaments: Medicament[], detailed = false): any[] {
    const transformer = new PharmacyTransformer()
    return medicaments.map(m => transformer.transformMedicament(m, detailed))
  }

  /**
   * Transforme une commande fournisseur
   */
  static transformOrder(commande: CommandeFournisseur, detailed = false): any {
    const transformer = new PharmacyTransformer()
    return transformer.transformCommande(commande, detailed)
  }

  /**
   * Transforme une collection de commandes
   */
  static transformOrders(commandes: CommandeFournisseur[], detailed = false): any[] {
    const transformer = new PharmacyTransformer()
    return commandes.map(c => transformer.transformCommande(c, detailed))
  }

  private transformMedicament(m: Medicament, detailed: boolean): any {
    // Calcul du statut du stock
    let status = 'normal'
    if (m.stockActuel <= 0) {
      status = 'rupture_stock'
    } else if (m.stockActuel <= m.stockMinimum) {
      status = 'stock_faible'
    }
    
    // Détection expiration proche (30 jours)
    const daysUntilExpiry = m.dateExpiration 
      ? Math.ceil(m.dateExpiration.diff(DateTime.now(), 'days').days)
      : 999
    
    if (daysUntilExpiry <= 30 && m.stockActuel > 0) {
      status = 'expiring'
    }

    const baseData = {
      id: m.id,
      name: m.nom,
      nom: m.nom, // Alias pour compatibilité
      category: m.forme || 'Divers',
      forme: m.forme || 'Divers',
      currentStock: m.stockActuel,
      stockActuel: m.stockActuel,
      minStock: m.stockMinimum,
      stockMinimum: m.stockMinimum,
      maxStock: m.stockMinimum * 10,
      expiryDate: m.dateExpiration?.toISODate() || null,
      dateExpiration: m.dateExpiration ? this.formatDate(m.dateExpiration) : null,
      batchNumber: 'LOT-' + m.id.substring(0, 6).toUpperCase(),
      supplier: m.fabricant || 'Inconnu',
      fabricant: m.fabricant || 'Inconnu',
      unitCost: Number(m.prixUnitaire) || 0,
      prixUnitaire: Number(m.prixUnitaire) || 0,
      totalValue: (Number(m.prixUnitaire) || 0) * m.stockActuel,
      status: status,
      statutStock: status, // Alias pour compatibilité
      principeActif: m.principeActif || null,
      dosage: m.dosage || null,
      codeBarre: m.codeBarre || null,
      prescriptionRequise: m.prescriptionRequise || false,
      createdAt: m.createdAt?.toISO() || null,
      updatedAt: m.updatedAt?.toISO() || null,
    }

    if (detailed) {
      return {
        ...baseData,
        daysUntilExpiry: daysUntilExpiry < 999 ? daysUntilExpiry : null,
        isExpiring: daysUntilExpiry <= 30 && m.stockActuel > 0,
        isLowStock: m.stockActuel <= m.stockMinimum,
        isOutOfStock: m.stockActuel <= 0,
      }
    }

    return baseData
  }

  private transformCommande(c: CommandeFournisseur, detailed: boolean): any {
    const baseData = {
      id: c.id,
      numeroCommande: c.numeroCommande || null,
      fournisseurId: c.fournisseurId || null,
      dateCommande: c.dateCommande ? this.formatDate(c.dateCommande) : null,
      dateLivraisonEstimee: c.dateLivraisonEstimee ? this.formatDate(c.dateLivraisonEstimee) : null,
      statut: c.statut || 'en_attente',
      status: c.statut || 'en_attente',
      montantTotal: Number(c.montantTotal) || 0,
      totalAmount: Number(c.montantTotal) || 0,
      creePar: c.creePar || null,
      createdAt: c.createdAt?.toISO() || null,
      updatedAt: c.updatedAt?.toISO() || null,
    }

    if (detailed) {
      return {
        ...baseData,
        fournisseur: c.fournisseur ? {
          id: c.fournisseur.id,
          nom: c.fournisseur.nom,
          name: c.fournisseur.nom,
          email: c.fournisseur.email || null,
          telephone: c.fournisseur.telephone || null,
        } : null,
        createur: c.createur ? {
          id: c.createur.id,
          nomComplet: c.createur.nomComplet,
          email: c.createur.email || null,
        } : null,
        lignes: Array.isArray(c.lignes) ? c.lignes.map((ligne: any) => ({
          id: ligne.id,
          medicamentId: ligne.medicamentId,
          medicament: ligne.medicament ? {
            id: ligne.medicament.id,
            nom: ligne.medicament.nom,
            name: ligne.medicament.nom,
          } : null,
          quantiteCommandee: ligne.quantiteCommandee || 0,
          quantity: ligne.quantiteCommandee || 0,
          quantiteRecue: ligne.quantiteRecue || 0,
          quantityReceived: ligne.quantiteRecue || 0,
          prixUnitaireAchat: Number(ligne.prixUnitaireAchat) || 0,
          unitPrice: Number(ligne.prixUnitaireAchat) || 0,
          total: (ligne.quantiteCommandee || 0) * (Number(ligne.prixUnitaireAchat) || 0),
        })) : [],
      }
    }

    return baseData
  }
}

