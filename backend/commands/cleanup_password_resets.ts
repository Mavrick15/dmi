import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class CleanupPasswordResets extends BaseCommand {
  static commandName = 'cleanup:password-resets'
  static description = 'Nettoyer les tokens de réinitialisation de mot de passe expirés'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ alias: 'd', description: 'Mode dry-run (simulation)' })
  declare dryRun: boolean

  async run() {
    this.logger.info('🧹 Nettoyage des tokens de réinitialisation...')

    const now = DateTime.now().toSQL()

    // Compter les tokens expirés
    const countResult = await db
      .from('password_reset_tokens')
      .where('expires_at', '<', now)
      .count('* as total')

    const count = Number(countResult[0].total)

    if (count === 0) {
      this.logger.success('✅ Aucun token à nettoyer')
      return
    }

    if (this.dryRun) {
      this.logger.info(`🔍 Mode dry-run: ${count} tokens seraient supprimés`)
      return
    }

    // Supprimer les tokens expirés
    await db
      .from('password_reset_tokens')
      .where('expires_at', '<', now)
      .delete()

    this.logger.success(`✅ ${count} tokens supprimés avec succès`)
  }
}

