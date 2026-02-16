import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_accesses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('user_profiles').onDelete('CASCADE')
      table.string('role').nullable() // Si accès par rôle
      table.string('permission').defaultTo('read') // read, write, delete
      table.timestamp('expires_at').nullable() // Expiration de l'accès
      table.timestamp('granted_at', { useTz: true }).notNullable()
      table.uuid('granted_by').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      
      table.index(['document_id'])
      table.index(['user_id'])
      table.index(['role'])
      table.unique(['document_id', 'user_id', 'role']) // Un accès unique par document/user/role
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
