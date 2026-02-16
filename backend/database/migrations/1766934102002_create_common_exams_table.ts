import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'common_exams'

  async up() {
    if (!(await this.schema.hasTable(this.tableName))) {
      this.schema.createTable(this.tableName, (table) => {
        table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
        table.string('name').notNullable().unique() // Nom de l'examen
        table.string('code').nullable() // Code optionnel
        table.string('category').nullable() // Catégorie (Biologie, Imagerie, Fonctionnel, etc.)
        table.text('description').nullable()
        table.string('type').nullable() // Type (Sang, Urine, Radio, etc.)
        table.decimal('prix', 10, 2).nullable() // Prix de l'examen
        table.boolean('actif').defaultTo(true)
        table.integer('ordre_affichage').defaultTo(0)
        table.integer('frequence_utilisation').defaultTo(0) // Compteur d'utilisation
        table.timestamp('created_at', { useTz: true }).notNullable()
        table.timestamp('updated_at', { useTz: true }).notNullable()
      })

      // Index
      this.schema.raw(`CREATE INDEX idx_common_exams_name ON ${this.tableName}(name)`)
      this.schema.raw(`CREATE INDEX idx_common_exams_category ON ${this.tableName}(category)`)
      this.schema.raw(`CREATE INDEX idx_common_exams_actif ON ${this.tableName}(actif)`)
    }
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

