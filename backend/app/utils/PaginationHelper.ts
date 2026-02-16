/**
 * Utilitaires pour la validation et la normalisation de la pagination
 */
export class PaginationHelper {
  /**
   * Valider et normaliser les paramètres de pagination
   * @param page - Numéro de page (par défaut: 1)
   * @param limit - Nombre d'éléments par page (par défaut: 10, max: 100)
   * @returns Objet avec page et limit normalisés
   */
  static validateAndNormalize(page: any, limit: any, defaultLimit: number = 10, maxLimit: number = 100): { page: number; limit: number } {
    // Normaliser la page
    let normalizedPage = 1
    if (page !== undefined && page !== null) {
      const parsedPage = typeof page === 'string' ? parseInt(page, 10) : Number(page)
      if (!isNaN(parsedPage) && parsedPage > 0) {
        normalizedPage = parsedPage
      }
    }

    // Normaliser la limite avec une valeur maximale pour éviter les requêtes trop lourdes
    let normalizedLimit = defaultLimit
    if (limit !== undefined && limit !== null) {
      const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit)
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        // Limiter à maxLimit pour éviter les requêtes trop lourdes
        normalizedLimit = Math.min(parsedLimit, maxLimit)
      }
    }

    return {
      page: normalizedPage,
      limit: normalizedLimit,
    }
  }

  /**
   * Valider et normaliser les paramètres de pagination depuis request.input()
   * @param request - Objet request d'AdonisJS
   * @param defaultLimit - Limite par défaut (par défaut: 10)
   * @param maxLimit - Limite maximale (par défaut: 100)
   * @returns Objet avec page et limit normalisés
   */
  static fromRequest(
    request: any,
    defaultLimit: number = 10,
    maxLimit: number = 100
  ): { page: number; limit: number } {
    const page = request.input('page')
    const limit = request.input('limit')
    return this.validateAndNormalize(page, limit, defaultLimit, maxLimit)
  }

  /**
   * Valider et normaliser les paramètres de pagination depuis request.qs()
   * @param request - Objet request d'AdonisJS
   * @param defaultLimit - Limite par défaut (par défaut: 10)
   * @param maxLimit - Limite maximale (par défaut: 100)
   * @returns Objet avec page et limit normalisés
   */
  static fromQueryString(
    request: any,
    defaultLimit: number = 10,
    maxLimit: number = 100
  ): { page: number; limit: number } {
    const qs = request.qs()
    return this.validateAndNormalize(qs.page, qs.limit, defaultLimit, maxLimit)
  }
}

