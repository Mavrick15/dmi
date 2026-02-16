import logger from '@adonisjs/core/services/logger'

/**
 * Service pour logger les erreurs de manière structurée
 */
export default class ErrorLogger {
  /**
   * Logger une erreur avec contexte
   */
  static logError(error: any, context?: Record<string, any>) {
    logger.error(
      {
        error: {
          message: error.message,
          code: error.code,
          status: error.status,
          stack: error.stack,
        },
        context,
      },
      `Erreur: ${error.message}`
    )
  }

  /**
   * Logger une erreur de validation
   */
  static logValidationError(errors: any, context?: Record<string, any>) {
    logger.warn(
      {
        type: 'validation_error',
        errors,
        context,
      },
      'Erreur de validation'
    )
  }

  /**
   * Logger une erreur de base de données
   */
  static logDatabaseError(error: any, query?: string, context?: Record<string, any>) {
    logger.error(
      {
        type: 'database_error',
        error: {
          message: error.message,
          code: error.code,
        },
        query,
        context,
      },
      'Erreur de base de données'
    )
  }

  /**
   * Logger une erreur d'authentification
   */
  static logAuthError(error: any, userId?: string, context?: Record<string, any>) {
    logger.warn(
      {
        type: 'auth_error',
        error: {
          message: error.message,
          code: error.code,
        },
        userId,
        context,
      },
      'Erreur d\'authentification'
    )
  }
}

