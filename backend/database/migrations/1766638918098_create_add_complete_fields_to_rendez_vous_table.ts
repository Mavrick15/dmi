import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rendez_vous'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Informations supplémentaires
      table.text('motif_annulation').nullable() // Motif d'annulation si le RDV est annulé
      table.string('annule_par', 36).nullable() // ID de l'utilisateur qui a annulé
      table.dateTime('date_annulation').nullable() // Date d'annulation
      
      // Gestion des rappels
      table.boolean('rappel_envoye_24h').defaultTo(false) // Rappel 24h avant envoyé
      table.boolean('rappel_envoye_1h').defaultTo(false) // Rappel 1h avant envoyé
      table.dateTime('date_dernier_rappel').nullable() // Date du dernier rappel envoyé
      
      // Suivi des modifications
      table.integer('nombre_modifications').defaultTo(0) // Nombre de fois que le RDV a été modifié
      table.dateTime('date_derniere_modification').nullable() // Date de dernière modification
      
      // Informations pratiques
      table.text('notes_personnelles_medecin').nullable() // Notes privées du médecin (non visibles par le patient)
      table.boolean('confirme_par_patient').defaultTo(false) // Confirmation explicite par le patient
      table.dateTime('date_confirmation_patient').nullable() // Date de confirmation par le patient
    })
    
    // Index pour optimiser les requêtes
    this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_rendez_vous_date_annulation ON ${this.tableName}(date_annulation)`)
    this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_rendez_vous_confirme ON ${this.tableName}(confirme_par_patient)`)
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('motif_annulation')
      table.dropColumn('annule_par')
      table.dropColumn('date_annulation')
      table.dropColumn('rappel_envoye_24h')
      table.dropColumn('rappel_envoye_1h')
      table.dropColumn('date_dernier_rappel')
      table.dropColumn('nombre_modifications')
      table.dropColumn('date_derniere_modification')
      table.dropColumn('notes_personnelles_medecin')
      table.dropColumn('confirme_par_patient')
      table.dropColumn('date_confirmation_patient')
    })
    
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_date_annulation`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_confirme`)
  }
}
