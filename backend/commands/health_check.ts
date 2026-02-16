import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class HealthCheck extends BaseCommand {
  static commandName = 'health:check'
  static description = 'Vérifier la santé de l\'application et de la base de données'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ alias: 'v', description: 'Mode verbeux' })
  declare verbose: boolean

  async run() {
    this.logger.info('🏥 Vérification de la santé de l\'application...\n')

    const checks = {
      database: false,
      migrations: false,
      timestamp: DateTime.now().toISO(),
    }

    // Vérifier la connexion à la base de données
    try {
      await db.rawQuery('SELECT 1')
      checks.database = true
      this.logger.success('✅ Base de données: Connectée')
    } catch (error) {
      this.logger.error('❌ Base de données: Erreur de connexion')
      if (this.verbose) {
        this.logger.error(`   ${error.message}`)
      }
    }

    // Vérifier les migrations
    try {
      const migrations = await db.rawQuery(`
        SELECT COUNT(*) as total 
        FROM adonis_schema 
        WHERE name LIKE 'database/migrations/%'
      `)
      checks.migrations = true
      if (this.verbose) {
        this.logger.info(`   Migrations exécutées: ${migrations.rows[0].total}`)
      }
      this.logger.success('✅ Migrations: OK')
    } catch (error) {
      this.logger.warning('⚠️  Migrations: Impossible de vérifier')
      if (this.verbose) {
        this.logger.warning(`   ${error.message}`)
      }
    }

    // Résumé
    const allOk = Object.values(checks).every((check) => check === true || typeof check === 'string')
    
    if (allOk) {
      this.logger.success('\n✅ Tous les contrôles sont passés avec succès')
      process.exit(0)
    } else {
      this.logger.error('\n❌ Certains contrôles ont échoué')
      process.exit(1)
    }
  }
}

