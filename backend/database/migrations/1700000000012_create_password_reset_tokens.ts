import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_reset_tokens'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email').notNullable().index()
      table.string('token').notNullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('expires_at').notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}