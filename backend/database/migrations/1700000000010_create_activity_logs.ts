// openclinic/backend/database/migrations/1700000000010_create_activity_logs.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'activity_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('type').notNullable()
      table.string('description').notNullable()
      table.uuid('user_id').references('id').inTable('user_profiles').onDelete('SET NULL').nullable()
      table.uuid('target_id').nullable() // ID de la ressource (patient, rdv, etc.)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })
    
    this.schema.raw(`CREATE INDEX idx_activity_logs_created_at ON ${this.tableName}(created_at)`)
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
