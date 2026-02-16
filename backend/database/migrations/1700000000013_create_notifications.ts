import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').nullable().references('id').inTable('user_profiles').onDelete('CASCADE')
      table.string('type', 50).notNullable() // 'info', 'success', 'warning', 'error', 'critical'
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.string('category', 50).nullable() // 'patient', 'appointment', 'pharmacy', 'finance', 'system', etc.
      table.uuid('target_id').nullable() // ID de l'entité concernée (patient, appointment, etc.)
      table.string('target_type', 50).nullable() // Type d'entité ('patient', 'appointment', etc.)
      table.string('action_url', 500).nullable() // URL pour action
      table.boolean('is_read').defaultTo(false)
      table.boolean('is_archived').defaultTo(false)
      table.jsonb('metadata').nullable() // Données supplémentaires
      table.timestamp('read_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      
      // Index pour performances
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'is_archived'])
      table.index(['category', 'type'])
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

