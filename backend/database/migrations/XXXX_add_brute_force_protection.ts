import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_profiles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Compteur de tentatives échouées
      table.integer('failed_login_attempts').defaultTo(0).notNullable()
      
      // Date de verrouillage (null si non verrouillé)
      table.timestamp('locked_until').nullable()
      
      // Index pour améliorer les performances
      table.index(['email', 'failed_login_attempts'], 'idx_email_failed_attempts')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('idx_email_failed_attempts')
      table.dropColumn('failed_login_attempts')
      table.dropColumn('locked_until')
    })
  }
}

