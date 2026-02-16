import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_comments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable('user_profiles').onDelete('CASCADE')
      table.text('content').notNullable() // Contenu du commentaire
      table.integer('parent_comment_id').nullable().references('id').inTable('document_comments').onDelete('CASCADE') // Pour les réponses
      table.text('annotations').nullable() // JSON: [{ page: 1, x: 100, y: 200, type: 'highlight', ... }]
      table.boolean('is_resolved').defaultTo(false) // Commentaire résolu
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      
      table.index(['document_id'])
      table.index(['user_id'])
      table.index(['parent_comment_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
