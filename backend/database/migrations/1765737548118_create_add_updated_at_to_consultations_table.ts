import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'consultations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajoute la colonne updated_at
      table.timestamp('updated_at', { useTz: true }).nullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('updated_at')
    })
  }
}