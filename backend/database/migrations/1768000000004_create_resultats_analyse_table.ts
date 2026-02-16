import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'resultats_analyse'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('analyse_id').notNullable().references('id').inTable('analyses').onDelete('CASCADE')
      table.string('parametre').notNullable()
      table.string('valeur').notNullable()
      table.string('unite', 20).nullable()
      table.decimal('valeur_normale_min', 10, 2).nullable()
      table.decimal('valeur_normale_max', 10, 2).nullable()
      table.enum('interpretation', ['normal', 'anormal_bas', 'anormal_haut', 'critique']).defaultTo('normal')
      table.text('commentaire').nullable()
      table.text('signature').nullable().comment('Signature électronique en base64')
      table.text('annotation').nullable().comment('Annotation technique (notes internes)')
      table.uuid('valide_par').nullable().references('id').inTable('user_profiles').onDelete('SET NULL')
      table.timestamp('date_validation', { useTz: true }).nullable()
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_resultats_analyse_id ON ${this.tableName}(analyse_id)`)
    this.schema.raw(`CREATE INDEX idx_resultats_interpretation ON ${this.tableName}(interpretation)`)
    this.schema.raw(`CREATE INDEX idx_resultats_valide_par ON ${this.tableName}(valide_par)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

