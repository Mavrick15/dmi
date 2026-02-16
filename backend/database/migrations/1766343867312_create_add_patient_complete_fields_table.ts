import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'patients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Informations de naissance
      table.string('lieu_naissance', 200).nullable()
      
      // Informations de contact détaillées
      table.string('ville', 100).nullable()
      table.string('code_postal', 10).nullable()
      table.string('pays', 100).nullable().defaultTo('France')
      table.string('contact_urgence_relation', 50).nullable()
      
      // Informations professionnelles
      table.string('profession', 100).nullable()
      table.string('situation_familiale', 50).nullable()
      table.string('langue', 10).nullable().defaultTo('li')
      
      // Informations médicales supplémentaires
      table.text('medicaments_actuels').nullable()
      table.text('antecedents_familiaux').nullable()
      table.text('vaccinations').nullable()
      table.text('handicaps').nullable()
      table.boolean('donneur_organes').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('lieu_naissance')
      table.dropColumn('ville')
      table.dropColumn('code_postal')
      table.dropColumn('pays')
      table.dropColumn('contact_urgence_relation')
      table.dropColumn('profession')
      table.dropColumn('situation_familiale')
      table.dropColumn('langue')
      table.dropColumn('medicaments_actuels')
      table.dropColumn('antecedents_familiaux')
      table.dropColumn('vaccinations')
      table.dropColumn('handicaps')
      table.dropColumn('donneur_organes')
    })
  }
}
