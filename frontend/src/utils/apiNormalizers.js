/**
 * Normalisateurs API
 * Standardisent les réponses API pour une utilisation cohérente dans le frontend
 */

/**
 * Normalise une réponse API standard
 */
export const normalizeApiResponse = (response) => {
  if (!response) {
    return {
      success: false,
      data: null,
      message: 'Aucune réponse du serveur',
      meta: null
    }
  }

  // Si c'est déjà normalisé
  if (response.success !== undefined) {
    return {
      success: response.success,
      data: response.data || null,
      message: response.message || null,
      meta: response.meta || null,
      error: response.error || null
    }
  }

  // Si c'est une réponse Axios directe
  if (response.data) {
    return normalizeApiResponse(response.data)
  }

  // Format par défaut
  return {
    success: true,
    data: response,
    message: null,
    meta: null
  }
}

/**
 * Extrait les données d'une réponse API
 */
export const extractData = (response) => {
  const normalized = normalizeApiResponse(response)
  return normalized.data
}

/**
 * Extrait les métadonnées de pagination
 */
export const extractPagination = (response) => {
  const normalized = normalizeApiResponse(response)
  return normalized.meta || {
    current_page: 1,
    per_page: 12,
    total: 0,
    last_page: 1
  }
}

/**
 * Vérifie si une réponse est un succès
 */
export const isSuccess = (response) => {
  const normalized = normalizeApiResponse(response)
  return normalized.success === true
}

/**
 * Extrait le message d'erreur d'une réponse
 */
export const extractError = (response) => {
  const normalized = normalizeApiResponse(response)
  
  if (normalized.error) {
    return normalized.error.message || normalized.error
  }
  
  if (!normalized.success && normalized.message) {
    return normalized.message
  }
  
  return 'Une erreur est survenue'
}

