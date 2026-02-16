import { BaseTransformer } from './BaseTransformer.js'
import type Facture from '#models/Facture'
import type Transaction from '#models/Transaction'

/**
 * Transformer pour les données Finance (Factures et Transactions)
 * Structure et organise les données financières de manière cohérente
 */
export class FinanceTransformer extends BaseTransformer {
  /**
   * Transforme une facture
   */
  static transformInvoice(facture: Facture, detailed = false): any {
    const transformer = new FinanceTransformer()
    return transformer.transformFacture(facture, detailed)
  }

  /**
   * Transforme une collection de factures
   */
  static transformInvoices(factures: Facture[], detailed = false): any[] {
    const transformer = new FinanceTransformer()
    return factures.map(f => transformer.transformFacture(f, detailed))
  }

  /**
   * Transforme une transaction
   */
  static transformTransaction(transaction: Transaction, detailed = false): any {
    const transformer = new FinanceTransformer()
    return transformer.transformTransactionSingle(transaction, detailed)
  }

  /**
   * Transforme une collection de transactions
   */
  static transformTransactions(transactions: Transaction[], detailed = false): any[] {
    const transformer = new FinanceTransformer()
    return transactions.map(t => transformer.transformTransactionSingle(t, detailed))
  }

  /**
   * Transforme les données d'overview financier
   */
  static transformOverview(data: {
    monthlyRevenue: number
    outstandingAmount: number
    invoicesCount: number
    netProfit?: number
  }): any {
    return {
      monthlyRevenue: data.monthlyRevenue || 0,
      outstandingAmount: data.outstandingAmount || 0,
      invoicesCount: data.invoicesCount || 0,
      netProfit: data.netProfit || 0,
      remainingBalance: (data.monthlyRevenue || 0) - (data.outstandingAmount || 0)
    }
  }

  private transformFacture(f: Facture, detailed: boolean): any {
    const baseData = {
      id: f.id,
      patientId: f.patientId,
      consultationId: f.consultationId,
      numeroFacture: f.numeroFacture,
      montantTotal: Number(f.montantTotal) || 0,
      montantPaye: Number(f.montantPaye) || 0,
      montantRestant: Number(f.montantTotal) - Number(f.montantPaye || 0),
      statut: f.statut,
      status: f.statut,
      dateEmission: f.dateEmission?.toISO() || null,
      dateEcheance: f.dateEcheance?.toISO() || null,
      notes: f.notes || null,
      // Nouveaux champs financiers
      montantHt: f.montantHt ? Number(f.montantHt) : null,
      tauxTva: f.tauxTva ? Number(f.tauxTva) : 0,
      montantTva: f.montantTva ? Number(f.montantTva) : 0,
      remise: f.remise ? Number(f.remise) : 0,
      tauxRemise: f.tauxRemise ? Number(f.tauxRemise) : 0,
      adresseFacturation: f.adresseFacturation || null,
      modeReglement: f.modeReglement || null,
      referenceClient: f.referenceClient || null,
      datePaiementComplet: f.datePaiementComplet?.toISO() || null,
      nombreRelances: f.nombreRelances || 0,
      derniereRelance: f.derniereRelance?.toISO() || null,
      motifAnnulation: f.motifAnnulation || null,
      createdAt: f.createdAt?.toISO() || null,
      updatedAt: f.updatedAt?.toISO() || null,
    }

    if (detailed && f.patient) {
      return {
        ...baseData,
        patient: {
          id: f.patient.id,
          numeroPatient: f.patient.numeroPatient,
          name: f.patient.user?.nomComplet || 'Patient Inconnu',
          email: f.patient.user?.email || null,
          phone: f.patient.user?.telephone || null,
          avatar: f.patient.user?.photoProfil || null,
        },
        consultation: f.consultation ? {
          id: f.consultation.id,
          dateConsultation: f.consultation.dateConsultation?.toISO() || null,
        } : null
      }
    }

    return baseData
  }

  private transformTransactionSingle(t: Transaction, detailed: boolean): any {
    const baseData = {
      id: t.id,
      factureId: t.factureId,
      typeTransaction: t.typeTransaction,
      service: t.typeTransaction,
      montant: Number(t.montant) || 0,
      amount: Number(t.montant) || 0,
      methodePaiement: t.methodePaiement || null,
      method: t.methodePaiement || null,
      numeroTransaction: t.numeroTransaction || null,
      dateTransaction: t.dateTransaction?.toISO() || null,
      date: t.dateTransaction ? this.formatDate(t.dateTransaction) : null,
      time: t.dateTransaction ? t.dateTransaction.toFormat('HH:mm') : null,
      notes: t.notes || null,
      status: 'Payé', // Une transaction enregistrée est par définition payée
      createdAt: t.createdAt?.toISO() || null,
      // Par défaut, ajouter patientName et patientAvatar même si detailed est false
      patientName: null,
      patientAvatar: null,
    }

    if (detailed && t.facture?.patient) {
      const patientName = t.facture.patient.user?.nomComplet || 'Client Comptoir'
      const patientAvatar = t.facture.patient.user?.photoProfil || null
      
      return {
        ...baseData,
        patientName, // Ajout au niveau racine pour compatibilité avec le frontend
        patientAvatar, // Ajout au niveau racine pour compatibilité avec le frontend
        patient: {
          id: t.facture.patient.id,
          numeroPatient: t.facture.patient.numeroPatient,
          name: patientName,
          avatar: patientAvatar,
        },
        facture: {
          id: t.facture.id,
          numeroFacture: t.facture.numeroFacture,
          montantTotal: Number(t.facture.montantTotal) || 0,
        }
      }
    }

    // Si detailed est false ou patient n'est pas disponible, retourner avec patientName null
    return {
      ...baseData,
      patientName: t.facture?.patient?.user?.nomComplet || null,
      patientAvatar: t.facture?.patient?.user?.photoProfil || null,
    }
  }
}

