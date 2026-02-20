import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

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
    // Ne rétablir la contrainte unique que s'il n'y a pas de doublons (sinon le rollback échoue)
    const result = await db.rawQuery(
      `SELECT user_id FROM ${this.tableName} GROUP BY user_id HAVING count(*) > 1`
    )
    const hasDuplicates = result.rows && result.rows.length > 0
    if (!hasDuplicates) {
      this.schema.alterTable(this.tableName, (table) => {
        table.unique(['user_id'])
      })
    }
  }
}
