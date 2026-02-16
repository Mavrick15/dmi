import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ApiTokens extends BaseSchema {
  protected tableName = 'api_tokens'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('name', 255).notNullable()
      table.string('type', 255).notNullable()
      table.text('token').notNullable()
      table.uuid('user_id').notNullable()
        .references('id').inTable('user_profiles').onDelete('CASCADE')
      table.boolean('is_revoked').defaultTo(false)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('expires_at', { useTz: true }).nullable()

      table.index(['user_id'])
      table.index(['token'])
      table.unique(['user_id']) 
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
