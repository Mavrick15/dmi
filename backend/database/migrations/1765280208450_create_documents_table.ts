import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE')

      table.uuid('uploaded_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')

      table.string('title').notNullable()
      table.string('category').defaultTo('general')
      table.string('file_path').notNullable()
      table.string('original_name').notNullable()
      table.string('mime_type').notNullable()
      table.bigInteger('size').notNullable()
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}