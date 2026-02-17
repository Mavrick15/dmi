import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Refresh token (stocké en base, mais devrait idéalement être dans un cookie httpOnly)
      table.string('refresh_token', 255).nullable()

      // Date d'expiration du refresh token
      table.timestamp('refresh_expires_at').nullable()

      // Index pour améliorer les performances
      table.index('refresh_token', 'idx_refresh_token')
      table.index(['refresh_token', 'refresh_expires_at'], 'idx_refresh_token_expires')
    })
  }

  async down() {
    // Idempotent: IF EXISTS évite l'échec si index/colonnes déjà absents
    await this.schema.raw('DROP INDEX IF EXISTS api_tokens_idx_refresh_token_expires_index')
    await this.schema.raw('DROP INDEX IF EXISTS api_tokens_idx_refresh_token_index')
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP COLUMN IF EXISTS refresh_expires_at, DROP COLUMN IF EXISTS refresh_token`
    )
  }
}
