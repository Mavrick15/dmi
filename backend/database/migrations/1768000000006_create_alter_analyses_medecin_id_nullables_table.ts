import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'analyses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('medecin_id').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('medecin_id').notNullable().alter()
    })
  }
}