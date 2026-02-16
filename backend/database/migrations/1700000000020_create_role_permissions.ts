import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('role').notNullable()
      table.string('permission').notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      
      // Index unique pour éviter les doublons
      table.unique(['role', 'permission'])
      
      // Index pour les recherches rapides
      table.index('role')
      table.index('permission')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

