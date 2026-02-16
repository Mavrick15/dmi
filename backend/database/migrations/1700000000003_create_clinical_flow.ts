import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'medicaments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nom').notNullable()
      table.string('principe_actif').nullable()
      table.string('dosage').nullable()
      table.string('forme').nullable() // comprime, sirop, injection
      table.string('fabricant').nullable()
      table.string('code_barre').nullable().unique()
      table.decimal('prix_unitaire', 10, 2).nullable()
      table.integer('stock_actuel').defaultTo(0)
      table.integer('stock_minimum').defaultTo(10)
      table.enum('statut_stock', ['en_stock', 'stock_faible', 'rupture_stock']).defaultTo('en_stock')
      table.date('date_expiration').nullable()
      table.boolean('prescription_requise').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_medicaments_nom ON ${this.tableName}(nom)`)
    this.schema.raw(`CREATE INDEX idx_medicaments_statut_stock ON ${this.tableName}(statut_stock)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
