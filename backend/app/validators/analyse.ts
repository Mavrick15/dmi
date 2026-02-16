import vine from '@vinejs/vine'

/** UUID v4 regex pour validation manuelle (chaîne vide → undefined) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function optionalUuid(fieldName: string) {
  return vine.any().optional().transform((value: unknown) => {
    if (value === '' || value == null || value === undefined) return undefined
    const s = String(value).trim()
    if (s === '') return undefined
    if (!UUID_REGEX.test(s)) {
      throw new Error(`The ${fieldName} field must be a valid UUID`)
    }
    return s
  })
}

/**
 * Validateur pour créer une analyse
 */
export const createAnalyseValidator = vine.compile(
  vine.object({
    patientId: vine.string().uuid(),
    consultationId: vine.string().uuid().optional(),
    typeAnalyse: vine.string().minLength(2).maxLength(100),
    statut: vine.enum(['prescrite', 'en_cours', 'terminee', 'annulee']).optional(),
    datePrescription: vine.date().optional(),
    notes: vine.string().maxLength(1000).optional(),
  })
)

/**
 * Validateur pour mettre à jour une analyse
 */
export const updateAnalyseValidator = vine.compile(
  vine.object({
    typeAnalyse: vine.string().minLength(2).maxLength(100).optional(),
    statut: vine.enum(['prescrite', 'en_cours', 'terminee', 'annulee']).optional(),
    datePrescription: vine.date().optional(),
    dateResultat: vine.date().optional(),
    notes: vine.string().maxLength(1000).optional(),
    laboratoire: vine.string().maxLength(200).optional(),
    priorite: vine.enum(['normale', 'urgente', 'critique']).optional(),
  })
)

/**
 * Validateur pour les paramètres de recherche d'analyses
 */
export const searchAnalysesValidator = vine.compile(
  vine.object({
    patientId: optionalUuid('patientId'),
    consultationId: optionalUuid('consultationId'),
    statut: vine.enum(['prescrite', 'en_cours', 'terminee', 'annulee']).optional(),
    typeAnalyse: vine.string().maxLength(100).optional(),
    search: vine.string().maxLength(200).optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
  })
)
