import UserProfile from '#models/UserProfile'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

/**
 * Service de protection contre les attaques par force brute
 * Verrouille les comptes après plusieurs tentatives échouées
 */
export default class BruteForceProtection {
  // Configuration
  private static readonly MAX_ATTEMPTS = 5
  private static readonly LOCK_DURATION_MINUTES = 15
  private static readonly BASE_DELAY_SECONDS = 2 // Délai de base pour exponential backoff

  /**
   * Enregistre une tentative de connexion échouée
   * @param email - Email de l'utilisateur
   * @returns true si le compte est maintenant verrouillé
   */
  static async recordFailedAttempt(email: string): Promise<{ isLocked: boolean; lockUntil: DateTime | null; attemptsRemaining: number }> {
    const user = await UserProfile.findBy('email', email)
    
    if (!user) {
      // Ne pas révéler si l'email existe
      return { isLocked: false, lockUntil: null, attemptsRemaining: 0 }
    }

    // Initialiser les champs si nécessaire
    if (!user.failedLoginAttempts) {
      user.failedLoginAttempts = 0
    }

    user.failedLoginAttempts += 1
    const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - user.failedLoginAttempts)

    // Vérifier si le compte doit être verrouillé
    if (user.failedLoginAttempts >= this.MAX_ATTEMPTS) {
      user.lockedUntil = DateTime.now().plus({ minutes: this.LOCK_DURATION_MINUTES })
      await user.save()

      logger.warn({
        userId: user.id,
        email: user.email,
        attempts: user.failedLoginAttempts,
      }, 'Compte verrouillé après tentatives échouées')

      return {
        isLocked: true,
        lockUntil: user.lockedUntil,
        attemptsRemaining: 0,
      }
    }

    await user.save()

    logger.info({
      userId: user.id,
      email: user.email,
      attempts: user.failedLoginAttempts,
      remaining: attemptsRemaining,
    }, 'Tentative de connexion échouée enregistrée')

    return {
      isLocked: false,
      lockUntil: null,
      attemptsRemaining,
    }
  }

  /**
   * Réinitialise les tentatives échouées après une connexion réussie
   */
  static async resetFailedAttempts(userId: string): Promise<void> {
    const user = await UserProfile.findOrFail(userId)
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()
  }

  /**
   * Vérifie si un compte est verrouillé
   * @param email - Email de l'utilisateur
   * @returns true si verrouillé, false sinon
   */
  static async isAccountLocked(email: string): Promise<{ locked: boolean; lockUntil: DateTime | null; minutesRemaining: number | null }> {
    const user = await UserProfile.findBy('email', email)
    
    if (!user || !user.lockedUntil) {
      return { locked: false, lockUntil: null, minutesRemaining: null }
    }

    // Vérifier si le verrouillage a expiré
    if (user.lockedUntil < DateTime.now()) {
      user.lockedUntil = null
      user.failedLoginAttempts = 0
      await user.save()
      return { locked: false, lockUntil: null, minutesRemaining: null }
    }

    const minutesRemaining = Math.ceil(user.lockedUntil.diff(DateTime.now(), 'minutes').minutes)

    return {
      locked: true,
      lockUntil: user.lockedUntil,
      minutesRemaining,
    }
  }

  /**
   * Calcule le délai d'attente avant la prochaine tentative (exponential backoff)
   * @param failedAttempts - Nombre de tentatives échouées
   * @returns Délai en secondes
   */
  static calculateBackoffDelay(failedAttempts: number): number {
    return Math.min(
      this.BASE_DELAY_SECONDS * Math.pow(2, failedAttempts - 1),
      60 // Maximum 60 secondes
    )
  }

  /**
   * Déverrouille manuellement un compte (pour les admins)
   */
  static async unlockAccount(userId: string): Promise<boolean> {
    const user = await UserProfile.find(userId)
    if (!user) {
      return false
    }

    user.failedLoginAttempts = 0
    user.lockedUntil = null
    await user.save()

    logger.info({ userId }, 'Compte déverrouillé manuellement')

    return true
  }

  /**
   * Obtient le statut de sécurité d'un compte
   */
  static async getAccountSecurityStatus(email: string): Promise<{
    failedAttempts: number
    isLocked: boolean
    lockUntil: DateTime | null
    attemptsRemaining: number
  }> {
    const user = await UserProfile.findBy('email', email)
    
    if (!user) {
      return {
        failedAttempts: 0,
        isLocked: false,
        lockUntil: null,
        attemptsRemaining: 0,
      }
    }

    const lockStatus = await this.isAccountLocked(email)

    return {
      failedAttempts: user.failedLoginAttempts || 0,
      isLocked: lockStatus.locked,
      lockUntil: lockStatus.lockUntil,
      attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - (user.failedLoginAttempts || 0)),
    }
  }
}

