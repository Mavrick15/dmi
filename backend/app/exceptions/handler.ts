import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { HttpError } from '@adonisjs/core/types/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as lucidErrors } from '@adonisjs/lucid'
import { errors as vineErrors } from '@vinejs/vine'
import ErrorLogger from '#services/ErrorLogger'
import { AppException } from './AppException.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = process.env.NODE_ENV !== 'production'

  async report(error: any, ctx: HttpContext) {
    if (this.shouldReport(error)) {
      // Utiliser le service de logging structuré
      ErrorLogger.logError(error, {
        url: ctx.request.url(),
        method: ctx.request.method(),
        ip: ctx.request.ip(),
        userId: (ctx.auth?.user as any)?.id,
      })
    }
  }

  async handle(error: any, ctx: HttpContext) {
    
    // --- 1. EXCEPTION PERSONNALISÉE DE L'APPLICATION ---
    if (error instanceof AppException) {
      return ctx.response.status(error.status).json(
        ApiResponse.error(error.message, error.code, error.details)
      )
    }

    // --- 2. ERREURS DE VALIDATION (Formulaire mal rempli) ---
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json(
        ApiResponse.error(
          'Veuillez vérifier les champs du formulaire.',
          'VALIDATION_ERROR',
          error.messages
        )
      )
    }

    // --- 3. RESSOURCE INTROUVABLE (404) ---
    if (error instanceof lucidErrors.E_ROW_NOT_FOUND || error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
      return ctx.response.status(404).json(
        ApiResponse.error(
          "La ressource demandée est introuvable ou a été supprimée.",
          'NOT_FOUND'
        )
      )
    }

    // --- 4. AUTHENTIFICATION & SÉCURITÉ ---
    
    // Token invalide ou absent
    if (error.code === 'E_UNAUTHORIZED_ACCESS') {
      return ctx.response.status(401).json(
        ApiResponse.error(
          "Session expirée ou invalide. Veuillez vous reconnecter.",
          'UNAUTHORIZED'
        )
      )
    }

    // Mauvais mot de passe / Email inconnu
    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return ctx.response.status(401).json(
        ApiResponse.error(
          "Email ou mot de passe incorrect.",
          'INVALID_CREDENTIALS'
        )
      )
    }
    
    // Accès interdit (Rôle insuffisant)
    if (error.status === 403) {
      return ctx.response.status(403).json(
        ApiResponse.error(
          error.message || "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
          'FORBIDDEN'
        )
      )
    }

    // --- 5. ERREURS DE BASE DE DONNÉES (POSTGRESQL) ---

    // Code 23505 : Violation de contrainte UNIQUE (Doublon)
    if (error.code === '23505') {
      let message = "Cette donnée existe déjà dans le système."
      
      if (error.message?.includes('email')) message = "Cette adresse email est déjà utilisée."
      if (error.message?.includes('numero_patient')) message = "Ce numéro de patient existe déjà."
      if (error.message?.includes('numero_ordre')) message = "Ce numéro d'ordre est déjà attribué."

      return ctx.response.status(409).json(
        ApiResponse.error(message, 'DUPLICATE_ENTRY')
      )
    }

    // Code 23503 : Violation de contrainte de clé étrangère
    if (error.code === '23503') {
      return ctx.response.status(409).json(
        ApiResponse.error(
          "Impossible de supprimer cet élément car il est lié à d'autres données (ex: Consultations, Rendez-vous, Commandes).",
          'DEPENDENCY_ERROR',
          "Veuillez supprimer ou archiver les éléments liés avant de réessayer."
        )
      )
    }

    // Code 22001 : Valeur trop longue pour le type
    if (error.code === '22001') {
      return ctx.response.status(400).json(
        ApiResponse.error(
          "Une valeur dépasse la limite autorisée.",
          'VALUE_TOO_LONG'
        )
      )
    }

    // Compte désactivé
    if (error.code === 'E_ACCOUNT_DISABLED' || (error.status === 401 && error.message?.toLowerCase().includes('désactivé'))) {
      return ctx.response.status(401).json(
        ApiResponse.error(
          error.message || 'Votre compte a été désactivé. Veuillez contacter l\'administrateur système.',
          'E_ACCOUNT_DISABLED'
        )
      )
    }

    // --- 6. ERREURS MÉTIER PERSONNALISÉES ---
    // Erreurs avec un status code défini
    if (error.status && error.status >= 400 && error.status < 500) {
      return ctx.response.status(error.status).json(
        ApiResponse.error(
          error.message || 'Erreur de requête',
          error.code || 'BAD_REQUEST',
          error.details
        )
      )
    }

    // --- 7. RATE LIMITING (429) ---
    if (error.code === 'RATE_LIMIT_EXCEEDED' || error.status === 429) {
      return ctx.response.status(429).json(
        ApiResponse.error(
          error.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
          'RATE_LIMIT_EXCEEDED',
          {
            retryAfter: error.retryAfter,
            limit: error.limit,
          }
        )
      )
    }

    // --- 8. ERREUR SERVEUR GÉNÉRALE (500) ---
    // Logger l'erreur complète pour le debugging
    if (this.debug) {
      console.error('Erreur serveur:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      })
    }

    return ctx.response.status(500).json(
      ApiResponse.error(
        "Une erreur technique inattendue est survenue.",
        'INTERNAL_SERVER_ERROR',
        this.debug ? {
          message: error.message,
          name: error.name,
          ...(error.stack && { stack: error.stack }),
        } : undefined
      )
    )
  }

  /**
   * Détermine si l'erreur doit être reportée (loggée)
   * Surcharge de la méthode de base pour un contrôle plus fin
   */
  protected shouldReport(error: HttpError): boolean {
    // Ne pas logger les cas attendus (évite le bruit en prod)
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('token expiré') || msg.includes('token expired')) return false
    if (msg.includes('request aborted')) return false

    // Ne pas logger les erreurs client (4xx) sauf exceptions
    if (error.status >= 400 && error.status < 500) {
      return error.status === 429 || error.status === 401
    }

    // Toujours logger les erreurs serveur (5xx)
    return true
  }
}