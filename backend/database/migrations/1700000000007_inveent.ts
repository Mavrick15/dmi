import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  public async up() {
    // Inventaire mouvements
    this.schema.createTable('inventaire_mouvements', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('medicament_id').references('id').inTable('medicaments').onDelete('CASCADE')
      table.enum('type_mouvement', ['entree', 'sortie', 'ajustement']).notNullable()
      table.integer('quantite').notNullable()
      table.decimal('prix_unitaire', 10, 2).nullable()
      table.string('raison').nullable()
      table.string('numero_lot').nullable()
      table.date('date_expiration').nullable()
      table.uuid('utilisateur_id').references('id').inTable('user_profiles').onDelete('SET NULL').nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })

    // Rapports compliance
    this.schema.createTable('rapports_compliance', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('titre').notNullable()
      table.string('type_rapport').nullable()
      table.text('contenu').nullable()
      table.string('statut').defaultTo('en_cours')
      table.date('date_debut').nullable()
      table.date('date_fin').nullable()
      table.uuid('responsable_id').references('id').inTable('user_profiles').onDelete('SET NULL').nullable()
      table.uuid('etablissement_id').references('id').inTable('etablissements').onDelete('SET NULL').nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTableIfExists('rapports_compliance')
    this.schema.dropTableIfExists('inventaire_mouvements')
  }
}
