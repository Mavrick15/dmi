import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_versions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
      table.integer('version_number').notNullable() // 1, 2, 3, ...
      table.string('file_path').notNullable() // Chemin vers cette version
      table.string('change_summary').nullable() // Résumé des changements
      table.uuid('created_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
      table.text('metadata').nullable() // Métadonnées JSON
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      
      // Index pour performance
      table.index(['document_id', 'version_number'])
      table.unique(['document_id', 'version_number'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
