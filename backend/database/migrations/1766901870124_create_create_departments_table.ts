import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'departments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nom').notNullable().unique()
      table.string('code').notNullable().unique() // Code unique pour le département (ex: CARDIO, NEURO)
      table.text('description').nullable()
      table.string('couleur').defaultTo('#3B82F6') // Couleur pour les graphiques
      table.boolean('actif').defaultTo(true)
      table.integer('ordre_affichage').defaultTo(0) // Pour ordonner l'affichage
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    // Index pour les recherches
    this.schema.raw(`CREATE INDEX idx_departments_nom ON ${this.tableName}(nom)`)
    this.schema.raw(`CREATE INDEX idx_departments_code ON ${this.tableName}(code)`)
    this.schema.raw(`CREATE INDEX idx_departments_actif ON ${this.tableName}(actif)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
