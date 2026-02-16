import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'types_analyse'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('code', 50).notNullable().unique()
      table.string('nom').notNullable()
      table.enum('categorie', ['hematologie', 'biochimie', 'serologie', 'microbiologie', 'imagerie', 'autre']).notNullable()
      table.text('description').nullable()
      table.jsonb('parametres_par_defaut').nullable()
      table.integer('duree_moyenne').nullable() // en heures
      table.boolean('actif').defaultTo(true)
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_types_analyse_code ON ${this.tableName}(code)`)
    this.schema.raw(`CREATE INDEX idx_types_analyse_categorie ON ${this.tableName}(categorie)`)
    this.schema.raw(`CREATE INDEX idx_types_analyse_actif ON ${this.tableName}(actif)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

