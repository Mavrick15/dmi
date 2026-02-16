import vine from '@vinejs/vine'

/**
 * Validateur pour enregistrer un paiement
 */
export const recordPaymentValidator = vine.compile(
  vine.object({
    montant: vine.number().positive().min(0.01),
    methodePaiement: vine.enum(['especes', 'carte', 'cheque', 'virement', 'assurance', 'autre']).optional(),
    numeroTransaction: vine.string().trim().maxLength(100).optional(),
    notes: vine.string().trim().maxLength(500).optional(),
    typeTransaction: vine.enum(['consultation', 'traitement', 'medicament', 'analyse']).optional(),
  })
)

/**
 * Validateur pour la mise à jour d'une facture
 */
export const updateInvoiceValidator = vine.compile(
  vine.object({
    montantTotal: vine.number().positive().min(0.01).optional(),
    montantPaye: vine.number().min(0).optional(),
    statut: vine.enum(['en_attente', 'payee', 'en_retard', 'annulee']).optional(),
    dateEcheance: vine.date({ formats: ['YYYY-MM-DD'] }).optional(),
    notes: vine.string().trim().maxLength(1000).optional(),
    // Nouveaux champs financiers
    montantHt: vine.number().min(0).optional(),
    tauxTva: vine.number().min(0).max(100).optional(),
    remise: vine.number().min(0).optional(),
    tauxRemise: vine.number().min(0).max(100).optional(),
    adresseFacturation: vine.string().trim().maxLength(500).optional(),
    modeReglement: vine.string().trim().maxLength(50).optional(),
    referenceClient: vine.string().trim().maxLength(100).optional(),
    motifAnnulation: vine.string().trim().maxLength(500).optional(),
  })
)
