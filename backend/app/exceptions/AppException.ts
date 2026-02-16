/**
 * Exception personnalisée pour l'application
 * Permet de lancer des erreurs avec un code et un message standardisés
 */
export class AppException extends Error {
  public status: number
  public code: string
  public details?: any

  constructor(
    message: string,
    status: number = 500,
    code: string = 'APPLICATION_ERROR',
    details?: any
  ) {
    super(message)
    this.name = 'AppException'
    this.status = status
    this.code = code
    this.details = details
    
    // Maintient la stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Erreur de validation
   */
  static validation(message: string, details?: any) {
    return new AppException(message, 422, 'VALIDATION_ERROR', details)
  }

  /**
   * Ressource introuvable
   */
  static notFound(resource: string = 'Ressource') {
    return new AppException(
      `${resource} introuvable ou supprimée.`,
      404,
      'NOT_FOUND'
    )
  }

  /**
   * Non autorisé
   */
  static unauthorized(message: string = 'Session expirée ou invalide. Veuillez vous reconnecter.') {
    return new AppException(message, 401, 'UNAUTHORIZED')
  }

  /**
   * Accès interdit
   */
  static forbidden(userName?: string) {
    const message = userName 
      ? `Vous n'avez pas le droit ${userName}, Veuillez contacter l'Administrateur Système.`
      : "Vous n'avez pas les droits nécessaires pour effectuer cette action."
    return new AppException(message, 403, 'FORBIDDEN')
  }

  /**
   * Donnée dupliquée
   */
  static duplicate(field: string = 'Cette donnée') {
    return new AppException(
      `${field} existe déjà dans le système.`,
      409,
      'DUPLICATE_ENTRY'
    )
  }

  /**
   * Erreur de dépendance
   */
  static dependency(message: string = "Impossible de supprimer cet élément car il est lié à d'autres données.") {
    return new AppException(message, 409, 'DEPENDENCY_ERROR')
  }

  /**
   * Erreur de requête
   */
  static badRequest(message: string, details?: any) {
    return new AppException(message, 400, 'BAD_REQUEST', details)
  }

  /**
   * Méthode non autorisée
   */
  static methodNotAllowed(message: string = 'Méthode HTTP non autorisée.') {
    return new AppException(message, 405, 'METHOD_NOT_ALLOWED')
  }

  /**
   * Erreur serveur
   */
  static internal(message: string = 'Une erreur technique inattendue est survenue.', details?: any) {
    return new AppException(message, 500, 'INTERNAL_SERVER_ERROR', details)
  }
}

