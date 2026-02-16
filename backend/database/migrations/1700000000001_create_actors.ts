import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'etablissements'
  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nom').notNullable()
      table.string('adresse').notNullable()
      table.string('telephone').nullable()
      table.string('email').nullable()
      table.string('type_etablissement').defaultTo('hopital')
      table.string('numero_agrement').nullable()
      table.boolean('actif').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now()) 
    })
  }
  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}