/**
 * Utilitaires pour valider les UUID
 */
import { AppException } from '../exceptions/AppException.js'

/**
 * Valide un UUID et lance une exception si invalide
 * @param id - L'UUID à valider
 * @param resourceName - Le nom de la ressource pour le message d'erreur (ex: "médicament", "utilisateur")
 * @throws AppException si l'UUID est invalide
 */
export function validateUuid(id: string, resourceName: string = 'Ressource'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw AppException.badRequest(`Format UUID invalide pour l'ID du ${resourceName}`)
  }
}

