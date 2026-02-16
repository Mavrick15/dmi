import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cim10_codes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('code', 20).notNullable().unique() // Code CIM-10 (ex: I10, E11)
      table.string('name').notNullable() // Libellé complet
      table.string('category').notNullable() // Cardiologie, Endocrinologie, etc.
      table.text('description').nullable()
      table.string('parent_code', 20).nullable() // Code parent pour hiérarchie
      table.integer('usage_count').defaultTo(0) // Compteur d'utilisation
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_cim10_code ON ${this.tableName}(code)`)
    this.schema.raw(`CREATE INDEX idx_cim10_category ON ${this.tableName}(category)`)
    this.schema.raw(`CREATE INDEX idx_cim10_parent ON ${this.tableName}(parent_code)`)
    this.schema.raw(`CREATE INDEX idx_cim10_name ON ${this.tableName} USING gin(to_tsvector('french', name))`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

