import vine from '@vinejs/vine'

/**
 * Validateur pour marquer une notification comme lue
 */
export const markNotificationReadValidator = vine.compile(
  vine.object({
    // Pas de champs requis, juste l'ID dans les params
  })
)

/**
 * Validateur pour archiver une notification
 */
export const archiveNotificationValidator = vine.compile(
  vine.object({
    // Pas de champs requis, juste l'ID dans les params
  })
)
