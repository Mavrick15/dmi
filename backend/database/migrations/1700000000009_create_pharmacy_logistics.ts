import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    
    // 1. Table des Fournisseurs
    this.schema.createTable('fournisseurs', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nom').notNullable()
      table.string('contact_nom').nullable()
      table.string('email').nullable()
      table.string('telephone').nullable()
      table.string('adresse').nullable()
      table.integer('delai_livraison_moyen').defaultTo(2) // en jours
      table.boolean('actif').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // 2. Table des Commandes Fournisseurs
    this.schema.createTable('commandes_fournisseurs', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('numero_commande').notNullable().unique() // Ex: CMD-2024-001
      table.uuid('fournisseur_id').references('id').inTable('fournisseurs').onDelete('CASCADE')
      table.enum('statut', ['brouillon', 'commandee', 'partiellement_recue', 'recue', 'annulee']).defaultTo('brouillon')
      table.date('date_commande').defaultTo(this.now())
      table.date('date_livraison_estimee').nullable()
      table.decimal('montant_total', 12, 2).defaultTo(0)
      table.uuid('cree_par').references('id').inTable('user_profiles').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // 3. Lignes de la commande (Quel médicament, combien ?)
    this.schema.createTable('lignes_commande_fournisseur', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('commande_id').references('id').inTable('commandes_fournisseurs').onDelete('CASCADE')
      table.uuid('medicament_id').references('id').inTable('medicaments').onDelete('CASCADE')
      table.integer('quantite_commandee').notNullable()
      table.integer('quantite_recue').defaultTo(0)
      table.decimal('prix_unitaire_achat', 10, 2).notNullable() // Prix d'achat à l'instant T
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
    })

    // 4. Sessions d'Inventaire (Pour le bouton "Inventaire Physique")
    this.schema.createTable('sessions_inventaire', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('titre').notNullable() // Ex: "Inventaire Annuel 2024"
      table.enum('statut', ['en_cours', 'valide', 'annule']).defaultTo('en_cours')
      table.date('date_debut').defaultTo(this.now())
      table.date('date_fin').nullable()
      table.uuid('responsable_id').references('id').inTable('user_profiles').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
    
    // Modification de la table existante 'inventaire_mouvements' pour lier aux commandes
    this.schema.alterTable('inventaire_mouvements', (table) => {
        // Lien optionnel : si c'est une entrée de stock, elle peut venir d'une commande
        table.uuid('commande_fournisseur_id').references('id').inTable('commandes_fournisseurs').onDelete('SET NULL').nullable()
        // Lien optionnel : si c'est un ajustement, il peut venir d'une session d'inventaire
        table.uuid('session_inventaire_id').references('id').inTable('sessions_inventaire').onDelete('SET NULL').nullable()
    })
  }

  public async down() {
    this.schema.alterTable('inventaire_mouvements', (table) => {
        table.dropColumn('commande_fournisseur_id')
        table.dropColumn('session_inventaire_id')
    })
    this.schema.dropTable('sessions_inventaire')
    this.schema.dropTable('lignes_commande_fournisseur')
    this.schema.dropTable('commandes_fournisseurs')
    this.schema.dropTable('fournisseurs')
  }
}
