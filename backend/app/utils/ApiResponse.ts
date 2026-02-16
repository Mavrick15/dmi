/**
 * Utilitaires pour standardiser les réponses API
 */
export class ApiResponse {
  /**
   * Réponse de succès standardisée
   */
  static success<T>(data: T, message?: string, meta?: any) {
    return {
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta })
    }
  }

  /**
   * Réponse d'erreur standardisée
   */
  static error(message: string, code?: string, details?: any) {
    return {
      success: false,
      error: {
        message,
        ...(code && { code }),
        ...(details && { details })
      }
    }
  }

  /**
   * Réponse paginée standardisée
   */
  static paginated<T>(data: T[], page: number, limit: number, total: number, extraMeta?: any) {
    const lastPage = Math.ceil(total / limit)
    
    return {
      success: true,
      data,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: lastPage,
        from: (page - 1) * limit + 1,
        to: Math.min(page * limit, total),
        ...(extraMeta && extraMeta)
      }
    }
  }

  /**
   * Réponse de création standardisée (HTTP 201)
   */
  static created<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message })
    }
  }

  /**
   * Réponse de mise à jour standardisée (HTTP 200)
   */
  static updated<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message })
    }
  }

  /**
   * Réponse de suppression standardisée (HTTP 200)
   */
  static deleted(message: string = 'Ressource supprimée avec succès.') {
    return {
      success: true,
      message
    }
  }

  /**
   * Réponse sans contenu (HTTP 204)
   */
  static noContent() {
    return {
      success: true,
      message: 'Opération réussie.'
    }
  }
}

