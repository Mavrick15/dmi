import ApiToken from '#models/ApiToken'
import Medecin from '#models/Medecin'
import UserProfile from '#models/UserProfile'
import AuditService from '#services/AuditService'
import BruteForceProtection from '#services/BruteForceProtection'
import TokenService from '#services/TokenService'
import { loginValidator, registerValidator, updateProfileValidator, changePasswordValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'; // <--- Nécessite npm install @adonisjs/mail
import { DateTime } from 'luxon'
import { randomBytes, randomUUID } from 'node:crypto'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import { AppException } from '../exceptions/AppException.js'
import { AuthTransformer } from '../transformers/AuthTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export default class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   * @route POST /api/v1/auth/register
   * @access Public
   * @param {HttpContext} ctx - Contexte HTTP avec request et response
   * @returns {Promise<Response>} Réponse avec les données de l'utilisateur créé
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const trx = await db.transaction()

    try {
      const user = await UserProfile.create(
        {
          email: payload.email,
          password: payload.password,
          nomComplet: payload.nomComplet,
          role: payload.role as any,
          telephone: payload.telephone || null,
          adresse: payload.adresse || null,
          actif: payload.actif !== undefined ? payload.actif : true,
        },
        { client: trx }
      )

      if (payload.role === 'docteur') {
        const uniqueOrdre =
          payload.numeroOrdre || `TEMP-${randomUUID().substring(0, 8).toUpperCase()}`
        await Medecin.create(
          {
            userId: user.id,
            numeroOrdre: uniqueOrdre,
            specialite: payload.specialite || 'Généraliste',
            etablissementId: payload.etablissementId || null,
            disponible: true,
          },
          { client: trx }
        )
      }

      await trx.commit()

      const transformedUser = AuthTransformer.transformRegister(user)

      return response.status(201).json(ApiResponse.created(transformedUser, 'Utilisateur créé'))
    } catch (error) {
      await trx.rollback()
      if (error instanceof AppException) {
        throw error
      }
      throw error
    }
  }

  /**
   * Connexion d'un utilisateur
   * @route POST /api/v1/auth/login
   * @access Public
   * @param {HttpContext} ctx - Contexte HTTP avec request
   * @returns {Promise<Object>} Token d'authentification et données utilisateur
   */
  async login({ request, auth, response }: HttpContext) {
    const { email, password, rememberMe = false } = await request.validateUsing(loginValidator)

    // 1. Vérifier si le compte est verrouillé AVANT de vérifier les credentials
    const lockStatus = await BruteForceProtection.isAccountLocked(email)
    if (lockStatus.locked) {
      const error: any = new Error(
        `Compte temporairement verrouillé après plusieurs tentatives échouées. Réessayez dans ${lockStatus.minutesRemaining} minute(s).`
      )
      error.code = 'E_ACCOUNT_LOCKED'
      error.status = 423 // HTTP 423 Locked
      throw error
    }

    const user = await UserProfile.findBy('email', email)

    // 2. Vérifier les credentials
    if (!user || !(await hash.verify(user.password, password))) {
      // Enregistrer la tentative échouée
      const bruteForceResult = await BruteForceProtection.recordFailedAttempt(email)

      // Log d'audit pour tentative échouée
      if (user) {
        await AuditService.logLogin(
          { auth, request, response: {} as any } as HttpContext,
          user.id,
          email,
          false
        )
      }

      // Si le compte vient d'être verrouillé
      if (bruteForceResult.isLocked) {
        // Log d'audit pour verrouillage de compte
        await AuditService.logAccountLocked(
          { auth, request, response: {} as any } as HttpContext,
          email,
          15,
          5 // Nombre maximum de tentatives
        )

        const error: any = new Error(
          `Trop de tentatives échouées. Compte verrouillé jusqu'à ${bruteForceResult.lockUntil?.toFormat('HH:mm')}. Réessayez dans 15 minutes.`
        )
        error.code = 'E_ACCOUNT_LOCKED'
        error.status = 423
        throw error
      }

      // Sinon, message avec tentatives restantes
      const error: any = new Error(
        `Identifiants incorrects. ${bruteForceResult.attemptsRemaining} tentative(s) restante(s) avant verrouillage.`
      )
      error.code = 'E_INVALID_CREDENTIALS'
      error.status = 401
      throw error
    }

    if (!user.actif) {
      const error: any = new Error(
        "Votre compte a été désactivé. Veuillez contacter l'administrateur système pour plus d'informations."
      )
      error.code = 'E_ACCOUNT_DISABLED'
      error.status = 401
      throw error
    }

    // 3. Réinitialiser les tentatives échouées (connexion réussie)
    await BruteForceProtection.resetFailedAttempts(user.id)

    // 4. Mettre à jour la dernière connexion
    user.derniereConnexion = DateTime.now()
    await user.save()

    // 5. Utiliser TokenService pour créer une paire de tokens (access + refresh)
    // Note: createTokenPair révoque automatiquement tous les autres tokens actifs
    // pour garantir qu'un seul utilisateur peut être connecté avec un compte à la fois
    const { accessToken, refreshToken, expiresAt, refreshExpiresAt } =
      await TokenService.createTokenPair(user, Boolean(rememberMe))

    // Log d'audit pour connexion réussie
    await AuditService.logLogin(
      { auth: { user }, request, response: {} as any } as HttpContext,
      user.id,
      user.email,
      true
    )

    const transformedLogin = AuthTransformer.transformLogin(user, accessToken)

    return response.ok({
      success: true,
      message:
        'Connexion réussie. Les autres sessions ont été déconnectées pour des raisons de sécurité.',
      ...transformedLogin,
      refreshToken, // ⚠️ En production, idéalement dans un cookie httpOnly
      expiresAt: expiresAt.toISO(),
      refreshExpiresAt: refreshExpiresAt.toISO(),
    })
  }

  /**
   * Demande de réinitialisation de mot de passe
   * @route POST /api/v1/auth/forgot-password
   * @access Public
   * @param {HttpContext} ctx - Contexte HTTP avec request et response
   * @returns {Promise<Response>} Confirmation d'envoi d'email (même si l'email n'existe pas pour sécurité)
   */
  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    const user = await UserProfile.findBy('email', email)

    // Log d'audit pour demande de réinitialisation (même si email n'existe pas)
    await AuditService.logPasswordResetRequest(
      { auth: {}, request, response: {} as any } as HttpContext,
      email,
      user?.id || undefined
    )

    // On ne révèle pas si l'email existe ou non pour sécurité
    if (!user) {
      return response.ok({ message: 'Si cet email existe, un lien a été envoyé.' })
    }

    // Génération du token de reset
    const token = randomBytes(32).toString('hex')
    const expiresAt = DateTime.now().plus({ minutes: 30 })

    // Stockage dans une table dédiée (nécessite migration password_reset_tokens)
    await db.table('password_reset_tokens').insert({
      email: user.email,
      token: token,
      expires_at: expiresAt.toSQL(),
      created_at: DateTime.now().toSQL(),
    })

    // Construction du lien frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${email}`

    // Envoi de l'email
    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .from(process.env.SMTP_FROM || 'no-reply@medicore.local')
          .subject('Réinitialisation de mot de passe - MediCore').html(`
              <h3>Bonjour ${user.nomComplet},</h3>
              <p>Une demande de réinitialisation de mot de passe a été effectuée.</p>
              <p>Cliquez ici : <a href="${resetLink}">Réinitialiser mon mot de passe</a></p>
              <p>Ce lien expire dans 30 minutes.</p>
            `)
      })
    } catch (error) {
      logger.error({ err: error }, "Erreur lors de l'envoi de l'email de réinitialisation")
      // En dev, on log le lien pour tester sans serveur SMTP
      if (process.env.NODE_ENV === 'production') {
        logger.info({ resetLink }, 'Lien de réinitialisation (mode développement)')
      }
    }

    return response.ok({ message: 'Si cet email existe, un lien a été envoyé.' })
  }

  /**
   * Réinitialisation du mot de passe avec token
   * @route POST /api/v1/auth/reset-password
   * @access Public
   * @param {HttpContext} ctx - Contexte HTTP avec request et response
   * @returns {Promise<Response>} Confirmation de changement de mot de passe
   */
  async resetPassword({ request, response }: HttpContext) {
    const { token, email, newPassword } = request.only(['token', 'email', 'newPassword'])

    if (!token || !email || !newPassword) {
      return response.badRequest({ message: 'Données incomplètes.' })
    }

    // Vérification du token en base
    const record = await db
      .query()
      .from('password_reset_tokens')
      .where('email', email)
      .where('token', token)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!record) {
      return response.badRequest({ message: 'Lien invalide ou expiré.' })
    }

    // Mise à jour de l'utilisateur
    const user = await UserProfile.findByOrFail('email', email)
    user.password = newPassword // @beforeSave va le hasher
    await user.save()

    // Suppression de tous les tokens pour cet email (sécurité)
    await db.from('password_reset_tokens').where('email', email).delete()

    return response.ok({
      success: true,
      message: 'Mot de passe modifié avec succès. Vous pouvez vous connecter.',
    })
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   * @route GET /api/v1/auth/me
   * @access Authentifié
   * @param {HttpContext} ctx - Contexte HTTP avec request
   * @returns {Promise<Object>} Données du profil utilisateur
   */
  async me({ request, response }: HttpContext) {
    // Logique standard...
    const token = request.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return response.unauthorized({
        success: false,
        error: {
          code: 'E_UNAUTHORIZED_ACCESS',
          message: 'Token manquant',
        },
      })
    }

    const apiToken = await ApiToken.query()
      .where('token', token)
      .andWhere('is_revoked', false)
      .andWhere('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!apiToken || !apiToken.user) {
      // Vérifier si le token existe mais est expiré ou révoqué
      const existingToken = await ApiToken.query().where('token', token).first()

      if (existingToken) {
        if (existingToken.isRevoked) {
          return response.unauthorized({
            success: false,
            error: {
              code: 'E_UNAUTHORIZED_ACCESS',
              message: 'Token révoqué',
            },
          })
        }
        if (existingToken.expiresAt && existingToken.expiresAt <= DateTime.now()) {
          return response.unauthorized({
            success: false,
            error: {
              code: 'E_TOKEN_EXPIRED',
              message: 'Token expiré',
              canRefresh: true, // Indiquer qu'un refresh est possible
            },
          })
        }
      }

      return response.unauthorized({
        success: false,
        error: {
          code: 'E_UNAUTHORIZED_ACCESS',
          message: 'Token invalide',
        },
      })
    }

    return response.ok({
      success: true,
      user: {
        id: apiToken.user.id,
        email: apiToken.user.email,
        nomComplet: apiToken.user.nomComplet,
        role: apiToken.user.role,
        photoProfil: apiToken.user.photoProfil,
      },
    })
  }

  /**
   * Rafraîchissement du token d'accès
   * @route POST /api/v1/auth/refresh
   * @access Public (mais nécessite un refresh token valide)
   * @param {HttpContext} ctx - Contexte HTTP avec request et response
   * @returns {Promise<Object>} Nouveau token d'accès
   */
  async refresh({ request, response }: HttpContext) {
    const { refreshToken } = request.only(['refreshToken'])

    if (!refreshToken) {
      return response.badRequest({
        success: false,
        message: 'Refresh token requis',
      })
    }

    const result = await TokenService.refreshAccessToken(refreshToken)

    if (!result) {
      return response.unauthorized({
        success: false,
        message: 'Refresh token invalide ou expiré',
      })
    }

    return response.ok({
      success: true,
      token: result.accessToken,
      expiresAt: result.expiresAt.toISO(),
    })
  }

  /**
   * Déconnexion (révocation du token)
   * @route POST /api/v1/auth/logout
   * @access Authentifié
   * @param {HttpContext} ctx - Contexte HTTP avec request
   * @returns {Promise<Object>} Confirmation de déconnexion
   */
  async logout({ request, auth }: HttpContext) {
    const token = request.header('Authorization')?.replace('Bearer ', '')
    let userId: string | null = null
    let userEmail: string | null = null

    if (token) {
      // Utiliser TokenService pour révoquer le token
      await TokenService.revokeToken(token)

      // Récupérer l'utilisateur pour le log
      const apiToken = await ApiToken.findBy('token', token)
      if (apiToken) {
        userId = apiToken.userId
        const user = await UserProfile.find(userId)
        userEmail = user?.email || null
      }
    }

    // Log d'audit pour déconnexion
    if (userId && userEmail) {
      await AuditService.logLogout(
        { auth, request, response: {} as any } as HttpContext,
        userId,
        userEmail
      )
    }

    return { success: true, message: 'Déconnexion réussie' }
  }

  /**
   * Déverrouiller un compte (pour les admins)
   * @route POST /api/v1/auth/unlock/:userId
   * @access Admin uniquement
   * @param {HttpContext} ctx - Contexte HTTP avec params
   * @returns {Promise<Object>} Confirmation de déverrouillage
   */
  async unlockAccount({ params, auth, request, response }: HttpContext) {
    // Vérifier que l'utilisateur est admin
    const currentUser = auth.user as UserProfile
    if (!currentUser || currentUser.role !== 'admin') {
      return response.forbidden({
        success: false,
        message: 'Seuls les administrateurs peuvent déverrouiller un compte.',
      })
    }

    const { userId } = params
    const success = await BruteForceProtection.unlockAccount(userId)

    if (!success) {
      return response.notFound({
        success: false,
        message: 'Utilisateur introuvable.',
      })
    }

    // Récupérer les informations de l'utilisateur déverrouillé pour l'audit
    const unlockedUser = await UserProfile.find(userId)
    if (unlockedUser) {
      // Log d'audit pour déverrouillage de compte
      await AuditService.logAccountUnlocked(
        { auth, request, response: {} as any } as HttpContext,
        unlockedUser.id,
        unlockedUser.email,
        currentUser.id
      )
    }

    logger.info(
      {
        adminId: currentUser.id,
        unlockedUserId: userId,
      },
      'Compte déverrouillé par un administrateur'
    )

    return response.ok({
      success: true,
      message: 'Compte déverrouillé avec succès.',
    })
  }

  /**
   * Obtenir le statut de sécurité d'un compte
   * @route GET /api/v1/auth/security-status/:email
   * @access Admin uniquement
   * @param {HttpContext} ctx - Contexte HTTP avec params
   * @returns {Promise<Object>} Statut de sécurité du compte
   */
  async getSecurityStatus({ params, auth, response }: HttpContext) {
    // Vérifier que l'utilisateur est admin
    const currentUser = auth.user as UserProfile
    if (!currentUser || currentUser.role !== 'admin') {
      return response.forbidden({
        success: false,
        message: 'Seuls les administrateurs peuvent consulter le statut de sécurité.',
      })
    }

    const { email } = params
    const status = await BruteForceProtection.getAccountSecurityStatus(email)

    return response.ok({
      success: true,
      ...status,
      lockUntil: status.lockUntil?.toISO() || null,
    })
  }

  /**
   * Mettre à jour le profil de l'utilisateur connecté (Mon compte)
   * @route PATCH /api/v1/auth/profile
   * @access Authentifié
   */
  async updateProfile({ auth, request, response }: HttpContext) {
    const currentUser = auth.user as UserProfile
    if (!currentUser) {
      return response.unauthorized({
        success: false,
        message: 'Non authentifié.',
      })
    }
    const payload = await request.validateUsing(updateProfileValidator)
    if (payload.nomComplet !== undefined) currentUser.nomComplet = payload.nomComplet
    if (payload.telephone !== undefined) currentUser.telephone = payload.telephone || null
    if (payload.adresse !== undefined) currentUser.adresse = payload.adresse || null
    if (payload.photoProfil !== undefined) currentUser.photoProfil = payload.photoProfil || null

    const avatarFile = request.file('avatar') || request.file('file')
    let oldAvatarPath: string | null = null
    if (avatarFile && avatarFile.isValid) {
      const key = `avatars/${cuid()}.${avatarFile.extname}`
      await avatarFile.moveToDisk(key)
      oldAvatarPath = currentUser.photoProfil
      currentUser.photoProfil = key
      if (oldAvatarPath) {
        try {
          await drive.use().delete(oldAvatarPath)
        } catch (err) {
          logger.warn({ err, path: oldAvatarPath }, 'Erreur lors de la suppression de l\'ancien avatar')
        }
      }
    }

    await currentUser.save()
    const transformedUser = AuthTransformer.transformRegister(currentUser)
    return response.ok(ApiResponse.success({ user: transformedUser }, 'Profil mis à jour.'))
  }

  /**
   * Changer le mot de passe de l'utilisateur connecté
   * @route POST /api/v1/auth/change-password
   * @access Authentifié
   */
  async changePassword({ auth, request, response }: HttpContext) {
    const currentUser = auth.user as UserProfile
    if (!currentUser) {
      return response.unauthorized({
        success: false,
        message: 'Non authentifié.',
      })
    }
    const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)
    const isValid = await hash.verify(currentUser.password, currentPassword)
    if (!isValid) {
      return response.badRequest({
        success: false,
        message: 'Mot de passe actuel incorrect.',
      })
    }
    currentUser.password = newPassword
    await currentUser.save()
    await AuditService.logPasswordChanged(
      { auth, request, response: {} as any } as HttpContext,
      currentUser.id,
      currentUser.nomComplet,
      undefined,
      false
    )
    return response.ok(ApiResponse.success(null, 'Mot de passe modifié avec succès.'))
  }
}
