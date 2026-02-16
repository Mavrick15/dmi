import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'factures'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Champs financiers supplémentaires
      table.decimal('montant_ht', 12, 2).nullable() // Montant hors taxes
      table.decimal('taux_tva', 5, 2).defaultTo(0) // Taux de TVA (par défaut 0%)
      table.decimal('montant_tva', 12, 2).defaultTo(0) // Montant de la TVA
      table.decimal('remise', 12, 2).defaultTo(0) // Remise en montant
      table.decimal('taux_remise', 5, 2).defaultTo(0) // Taux de remise en pourcentage
      
      // Informations de facturation
      table.text('adresse_facturation').nullable() // Adresse de facturation (peut différer de l'adresse patient)
      table.string('mode_reglement', 50).nullable() // Mode de règlement préféré
      table.string('reference_client', 100).nullable() // Référence client externe
      
      // Champs de suivi
      table.dateTime('date_paiement_complet').nullable() // Date de paiement complet
      table.integer('nombre_relances').defaultTo(0) // Nombre de relances envoyées
      table.dateTime('derniere_relance').nullable() // Date de dernière relance
      table.text('motif_annulation').nullable() // Motif d'annulation si applicable
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('montant_ht')
      table.dropColumn('taux_tva')
      table.dropColumn('montant_tva')
      table.dropColumn('remise')
      table.dropColumn('taux_remise')
      table.dropColumn('adresse_facturation')
      table.dropColumn('mode_reglement')
      table.dropColumn('reference_client')
      table.dropColumn('date_paiement_complet')
      table.dropColumn('nombre_relances')
      table.dropColumn('derniere_relance')
      table.dropColumn('motif_annulation')
    })
  }
}
