import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('signed_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
      table.timestamp('signed_at').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('signed_by')
      table.dropColumn('signed_at')
    })
  }
}
