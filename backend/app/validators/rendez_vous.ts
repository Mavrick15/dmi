import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'un rendez-vous
 * Accepte date et time séparément, et type au lieu de motif
 */
export const createRendezVousValidator = vine.compile(
  vine.object({
    patientId: vine.string().uuid(),
    medecinId: vine.string().uuid(),
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Format YYYY-MM-DD
    time: vine.string().regex(/^\d{2}:\d{2}$/), // Format HH:mm
    duration: vine.number().min(15).max(240).optional(), // Accepte aussi "duration" du frontend
    dureeMinutes: vine.number().min(15).max(240).optional(), // Alias pour compatibilité
    type: vine.string().trim().minLength(1).maxLength(500), // Type/motif de consultation
    motif: vine.string().trim().minLength(1).maxLength(500).optional(), // Alias pour compatibilité
    priority: vine.enum(['normale', 'urgente', 'elevee', 'faible']).optional(), // Accepte aussi "priority" du frontend
    priorite: vine.enum(['normale', 'urgente', 'elevee', 'faible']).optional(), // Alias pour compatibilité
    notes: vine.string().trim().maxLength(1000).optional(),
  })
)

/**
 * Validateur pour la mise à jour du statut d'un rendez-vous
 * Accepte status (camelCase) ou statut (snake_case)
 */
export const updateRendezVousStatusValidator = vine.compile(
  vine.object({
    statut: vine.enum(['programme', 'en_cours', 'termine', 'annule']).optional(),
    status: vine.enum(['programme', 'en_cours', 'termine', 'annule']).optional(), // Alias camelCase
    notes: vine.string().trim().maxLength(1000).optional(),
  })
)

