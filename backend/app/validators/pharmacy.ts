import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'un médicament
 */
export const createMedicamentValidator = vine.compile(
  vine.object({
    nom: vine.string().trim().minLength(2).maxLength(200),
    principeActif: vine.string().trim().maxLength(200).optional(),
    dosage: vine.string().trim().maxLength(100).optional(),
    forme: vine.string().trim().maxLength(50).optional(),
    fabricant: vine.string().trim().maxLength(200).optional(),
    codeBarre: vine.string().trim().maxLength(50).optional(),
    prixUnitaire: vine.number().min(0).optional(),
    stockActuel: vine.number().min(0),
    stockMinimum: vine.number().min(0),
    dateExpiration: vine.date({ formats: ['YYYY-MM-DD', 'x'] }).optional(),
    prescriptionRequise: vine.boolean().optional(),
  })
)

/**
 * Validateur pour la mise à jour d'un médicament
 */
export const updateMedicamentValidator = vine.compile(
  vine.object({
    nom: vine.string().trim().minLength(2).maxLength(200).optional(),
    principeActif: vine.string().trim().maxLength(200).optional(),
    dosage: vine.string().trim().maxLength(100).optional(),
    forme: vine.string().trim().maxLength(50).optional(),
    fabricant: vine.string().trim().maxLength(200).optional(),
    codeBarre: vine.string().trim().maxLength(50).optional(),
    prixUnitaire: vine.number().min(0).optional(),
    stockActuel: vine.number().min(0).optional(),
    stockMinimum: vine.number().min(0).optional(),
    dateExpiration: vine.date({ formats: ['YYYY-MM-DD', 'x'] }).optional(),
    prescriptionRequise: vine.boolean().optional(),
  })
)

/**
 * Validateur pour la création d'une commande fournisseur
 */
export const createOrderValidator = vine.compile(
  vine.object({
    fournisseurId: vine.string().uuid(),
    items: vine.array(
      vine.object({
        medicamentId: vine.string().uuid(),
        quantity: vine.number().min(1).max(10000),
        price: vine.number().min(0),
      })
    ).minLength(1),
  })
)

/**
 * Validateur pour l'ajustement de stock
 */
export const adjustStockValidator = vine.compile(
  vine.object({
    medicamentId: vine.string().uuid(),
    realQuantity: vine.number().min(0),
    reason: vine.string().trim().minLength(3).maxLength(500),
  })
)

