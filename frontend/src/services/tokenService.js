/**
 * Service centralisé pour la gestion des tokens d'authentification
 * Gère le stockage, la récupération et le rafraîchissement des tokens
 */

import api from '../lib/axios'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'medicore_user'
const REMEMBER_ME_KEY = 'remember_me'

class TokenService {
  /**
   * Récupère le token d'accès depuis le stockage
   */
  getAccessToken() {
    return localStorage.getItem(TOKEN_KEY)
  }

  /**
   * Récupère le refresh token depuis le cookie (via API)
   * Note: Le refresh token devrait être dans un cookie httpOnly côté serveur
   */
  async getRefreshToken() {
    try {
      const response = await api.get('/auth/refresh-token-info')
      return response.data.refreshToken
    } catch (error) {
      return null
    }
  }

  /**
   * Stocke les tokens d'authentification
   * @param {string} accessToken - Token d'accès
   * @param {boolean} rememberMe - Si true, stocke pour 30 jours
   */
  setTokens(accessToken, rememberMe = false) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString())
    
    // Si rememberMe, on peut aussi stocker dans sessionStorage pour sécurité supplémentaire
    if (rememberMe) {
      sessionStorage.setItem(TOKEN_KEY, accessToken)
    }
  }

  /**
   * Stocke les données utilisateur
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  /**
   * Récupère les données utilisateur
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY)
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch (e) {
      this.clearTokens()
      return null
    }
  }

  /**
   * Vérifie si "Se souvenir de moi" est activé
   */
  isRememberMe() {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true'
  }

  /**
   * Nettoie tous les tokens et données utilisateur
   */
  clearTokens() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  /**
   * Vérifie si un token est présent
   */
  hasToken() {
    return !!this.getAccessToken()
  }

  /**
   * Rafraîchit le token d'accès en utilisant le refresh token
   * @returns {Promise<string|null>} Nouveau token ou null si échec
   */
  async refreshAccessToken() {
    try {
      // Récupérer le refresh token depuis localStorage (stocké lors du login)
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[TokenService] Aucun refresh token disponible')
        }
        return null
      }
      
      const response = await api.post('/auth/refresh', { refreshToken })
      
      if (response.data && response.data.success && response.data.token) {
        const newToken = response.data.token
        this.setTokens(newToken, this.isRememberMe())
        
        // Mettre à jour le refresh token si fourni
        if (response.data.refreshToken) {
          localStorage.setItem('refresh_token', response.data.refreshToken)
        }
        
        return newToken
      }
      
      return null
    } catch (error) {
      // Si le refresh échoue, on nettoie tout
      if (process.env.NODE_ENV === 'development') {
        console.error('[TokenService] Échec du refresh token:', error)
      }
      this.clearTokens()
      localStorage.removeItem('refresh_token')
      return null
    }
  }

  /**
   * Vérifie si le token est expiré (approximatif côté client)
   * Note: La vérification réelle se fait côté serveur
   */
  isTokenExpired() {
    // On peut stocker un timestamp d'expiration si nécessaire
    const expiresAt = localStorage.getItem('token_expires_at')
    if (!expiresAt) return false
    
    return new Date(expiresAt) < new Date()
  }
  
  /**
   * Vérifie si un refresh token est disponible
   */
  hasRefreshToken() {
    return !!localStorage.getItem('refresh_token')
  }
  
  /**
   * Détermine si le token devrait être rafraîchi
   * Pour l'instant, on retourne false car on ne peut pas vérifier l'expiration exacte
   * sans décoder le token. Cette méthode peut être améliorée si on stocke l'expiration.
   */
  async shouldRefreshToken() {
    // Pour l'instant, on ne fait pas de refresh proactif
    // car on ne peut pas vérifier l'expiration exacte sans décoder le token
    // Le refresh se fera automatiquement lors d'une erreur 401
    return false;
  }
}

// Export d'une instance singleton
export default new TokenService()

