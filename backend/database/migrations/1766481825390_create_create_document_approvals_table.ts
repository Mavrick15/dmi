import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_approvals'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
      table.integer('step_number').notNullable() // Étape dans le workflow (1, 2, 3, ...)
      table.uuid('approver_id').notNullable().references('id').inTable('user_profiles').onDelete('CASCADE')
      table.string('status').defaultTo('pending') // pending, approved, rejected
      table.text('comment').nullable() // Commentaire de l'approbateur
      table.timestamp('approved_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      
      table.index(['document_id', 'step_number'])
      table.index(['approver_id'])
      table.index(['status'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
