import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ApiToken from '#models/ApiToken'
import { DateTime } from 'luxon'

export default class CleanupTokens extends BaseCommand {
  static commandName = 'cleanup:tokens'
  static description = 'Nettoyer les tokens API expirés et révoqués'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ alias: 'd', description: 'Mode dry-run (simulation)' })
  declare dryRun: boolean

  async run() {
    this.logger.info('🧹 Nettoyage des tokens API...')

    const now = DateTime.now()

    // Trouver les tokens expirés ou révoqués
    const expiredTokens = await ApiToken.query()
      .where((query) => {
        query
          .where('is_revoked', true)
          .orWhere('expires_at', '<', now.toSQL())
      })

    const count = expiredTokens.length

    if (count === 0) {
      this.logger.success('✅ Aucun token à nettoyer')
      return
    }

    if (this.dryRun) {
      this.logger.info(`🔍 Mode dry-run: ${count} tokens seraient supprimés`)
      expiredTokens.forEach((token) => {
        this.logger.info(`  - Token ${token.id} (${token.name}) - Expire: ${token.expiresAt?.toFormat('dd/MM/yyyy HH:mm') || 'N/A'}`)
      })
      return
    }

    // Supprimer les tokens
    await ApiToken.query()
      .where((query) => {
        query
          .where('is_revoked', true)
          .orWhere('expires_at', '<', now.toSQL())
      })
      .delete()

    this.logger.success(`✅ ${count} tokens supprimés avec succès`)
  }
}

