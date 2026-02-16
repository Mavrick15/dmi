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
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('idx_refresh_token_expires')
      table.dropIndex('idx_refresh_token')
      table.dropColumn('refresh_expires_at')
      table.dropColumn('refresh_token')
    })
  }
}

