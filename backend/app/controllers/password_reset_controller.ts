
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import UserProfile from '#models/UserProfile'
import { randomBytes } from 'crypto'
import { DateTime } from 'luxon'
// Note: Le hashage se fait automatiquement dans le modèle UserProfile via @beforeSave
// donc on n'a pas besoin de hasher manuellement ici, juste de sauvegarder.

export default class PasswordResetController {
  
  // 1. Demande de réinitialisation (Forgot Password)
  public async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    
    // On cherche l'utilisateur (sans Fail pour la sécurité)
    const user = await UserProfile.findBy('email', email)
    
    if (!user) {
        return response.ok({ success: true, message: 'Si cet email existe, un lien a été envoyé.' })
    }

    const token = randomBytes(32).toString('hex')
    
    await db.table('password_reset_tokens').insert({
        email: user.email,
        token: token,
        expires_at: DateTime.now().plus({ hours: 1 }).toSQL()
    })

    // En mode développement, logger le lien de reset pour faciliter les tests
    if (process.env.NODE_ENV === 'production') {
      const resetLink = `http://10.0.0.2:5040/reset-password?token=${token}`
      logger.info({ email, resetLink }, 'Lien de réinitialisation de mot de passe (mode développement)')
    }

    return response.ok({ success: true, message: 'Si cet email existe, un lien a été envoyé.' })
  }

  public async resetPassword({ request, response }: HttpContext) {
    const { token, password } = request.only(['token', 'password'])

    if (!token || !password) {
        return response.badRequest({ success: false, error: { message: "Données incomplètes." } })
    }

    const resetRecord = await db.query()
        .from('password_reset_tokens')
        .where('token', token)
        .andWhere('expires_at', '>', DateTime.now().toSQL())
        .first()

    if (!resetRecord) {
        return response.badRequest({ 
            success: false, 
            error: { message: "Ce lien est invalide ou a expiré." } 
        })
    }

    const user = await UserProfile.findByOrFail('email', resetRecord.email)
    
    user.password = password 
    await user.save()

    await db.from('password_reset_tokens').where('email', user.email).delete()

    return response.ok({ success: true, message: "Mot de passe modifié avec succès." })
  }
}
