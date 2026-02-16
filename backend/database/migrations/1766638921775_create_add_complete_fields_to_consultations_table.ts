import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'consultations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Données anthropométriques
      table.decimal('poids', 5, 2).nullable() // Poids en kg
      table.decimal('taille', 5, 2).nullable() // Taille en cm
      table.decimal('imc', 5, 2).nullable() // IMC calculé automatiquement
      table.decimal('temperature', 4, 2).nullable() // Température corporelle
      table.integer('pression_arterielle_systolique').nullable() // Tension systolique
      table.integer('pression_arterielle_diastolique').nullable() // Tension diastolique
      table.integer('frequence_cardiaque').nullable() // Fréquence cardiaque (bpm)
      table.integer('frequence_respiratoire').nullable() // Fréquence respiratoire
      table.decimal('saturation_o2', 4, 2).nullable() // Saturation en O2 (%)
      
      // Informations supplémentaires
      table.text('evolution_depuis_derniere_consultation').nullable() // Évolution depuis la dernière consultation
      table.text('observations_generales').nullable() // Observations générales du médecin
      table.boolean('consultation_urgente').defaultTo(false) // Consultation urgente
      table.text('contexte_urgence').nullable() // Contexte si consultation urgente
      
      // Suivi et rappels
      table.date('date_prochaine_consultation').nullable() // Date recommandée pour prochaine consultation
      table.text('raison_prochaine_consultation').nullable() // Raison de la prochaine consultation
      table.boolean('rappels_envoies').defaultTo(false) // Indique si des rappels ont été envoyés
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('poids')
      table.dropColumn('taille')
      table.dropColumn('imc')
      table.dropColumn('temperature')
      table.dropColumn('pression_arterielle_systolique')
      table.dropColumn('pression_arterielle_diastolique')
      table.dropColumn('frequence_cardiaque')
      table.dropColumn('frequence_respiratoire')
      table.dropColumn('saturation_o2')
      table.dropColumn('evolution_depuis_derniere_consultation')
      table.dropColumn('observations_generales')
      table.dropColumn('consultation_urgente')
      table.dropColumn('contexte_urgence')
      table.dropColumn('date_prochaine_consultation')
      table.dropColumn('raison_prochaine_consultation')
      table.dropColumn('rappels_envoies')
    })
  }
}
