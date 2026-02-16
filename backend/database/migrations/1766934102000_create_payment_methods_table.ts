import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_methods'

  async up() {
    if (!(await this.schema.hasTable(this.tableName))) {
      this.schema.createTable(this.tableName, (table) => {
        table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
        table.string('name').notNullable().unique() // Nom de la méthode (Assurance, Carte, Espèces, Virement)
        table.string('code').notNullable().unique() // Code unique (ASSURANCE, CARTE, CASH, TRANSFER)
        table.string('color').defaultTo('#3B82F6') // Couleur pour les graphiques
        table.string('icon').nullable() // Nom de l'icône
        table.text('description').nullable()
        table.boolean('actif').defaultTo(true)
        table.integer('ordre_affichage').defaultTo(0)
        table.timestamp('created_at', { useTz: true }).notNullable()
        table.timestamp('updated_at', { useTz: true }).notNullable()
      })

      // Index
      this.schema.raw(`CREATE INDEX idx_payment_methods_code ON ${this.tableName}(code)`)
      this.schema.raw(`CREATE INDEX idx_payment_methods_actif ON ${this.tableName}(actif)`)
    }
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

