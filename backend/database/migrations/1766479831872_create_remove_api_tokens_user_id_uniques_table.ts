import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_tokens'

  async up() {
    // Supprimer la contrainte unique sur user_id pour permettre plusieurs tokens par utilisateur
    // (utile pour les connexions multiples, différents appareils, etc.)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['user_id'])
    })
  }

  async down() {
    // Rétablir la contrainte unique si nécessaire
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['user_id'])
    })
  }
}
