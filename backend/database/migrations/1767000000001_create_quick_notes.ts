import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quick_notes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.text('text').notNullable()
      table.string('category').notNullable() // Examen, Suivi, Traitement
      table.uuid('created_by').nullable() // user_id du créateur
      table.boolean('is_public').defaultTo(true) // Note partagée ou personnelle
      table.integer('usage_count').defaultTo(0) // Compteur d'utilisation
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_quick_notes_category ON ${this.tableName}(category)`)
    this.schema.raw(`CREATE INDEX idx_quick_notes_created_by ON ${this.tableName}(created_by)`)
    this.schema.raw(`CREATE INDEX idx_quick_notes_public ON ${this.tableName}(is_public)`)
    this.schema.raw(`CREATE INDEX idx_quick_notes_usage ON ${this.tableName}(usage_count DESC)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

