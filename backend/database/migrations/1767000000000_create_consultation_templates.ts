import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'consultation_templates'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.string('category').notNullable() // Généraliste, Pédiatrie, Urgence, etc.
      table.text('description').nullable()
      table.uuid('created_by').nullable() // user_id du créateur
      table.boolean('is_public').defaultTo(true) // Template partagé ou personnel
      
      // Données du template (JSON)
      table.jsonb('template_data').notNullable() // { symptoms: [], exams: [], etc. }
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_templates_category ON ${this.tableName}(category)`)
    this.schema.raw(`CREATE INDEX idx_templates_created_by ON ${this.tableName}(created_by)`)
    this.schema.raw(`CREATE INDEX idx_templates_public ON ${this.tableName}(is_public)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

