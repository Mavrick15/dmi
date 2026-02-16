import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'laboratoires'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nom').notNullable()
      table.text('adresse').notNullable()
      table.string('telephone').notNullable()
      table.string('email').nullable()
      table.string('contact_personne').nullable()
      table.boolean('actif').defaultTo(true)
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_laboratoires_nom ON ${this.tableName}(nom)`)
    this.schema.raw(`CREATE INDEX idx_laboratoires_actif ON ${this.tableName}(actif)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

