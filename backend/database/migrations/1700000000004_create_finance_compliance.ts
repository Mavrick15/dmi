// openclinic/backend/database/migrations/1700000000004_create_finance_compliance.ts

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    // Rendez-vous (inchangée)
    this.schema.createTable('rendez_vous', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE')
      table.uuid('medecin_id').references('id').inTable('medecins').onDelete('CASCADE')
      table.timestamp('date_heure').notNullable()
      table.integer('duree_minutes').defaultTo(30)
      table.enum('statut', ['programme', 'en_cours', 'termine', 'annule']).defaultTo('programme')
      table.string('motif').nullable()
      table.text('notes').nullable()
      table.string('salle').nullable()
      table.enum('priorite', ['faible', 'normale', 'elevee', 'urgente']).defaultTo('normale')
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_rendez_vous_patient_id ON rendez_vous(patient_id)`)
    this.schema.raw(`CREATE INDEX idx_rendez_vous_medecin_id ON rendez_vous(medecin_id)`)
    this.schema.raw(`CREATE INDEX idx_rendez_vous_date ON rendez_vous(date_heure)`)
    this.schema.raw(`CREATE INDEX idx_rendez_vous_statut ON rendez_vous(statut)`)

    // Consultations (MISE À JOUR AVEC NOUVEAUX CHAMPS)
    this.schema.createTable('consultations', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('rendez_vous_id').references('id').inTable('rendez_vous').onDelete('CASCADE').nullable()
      table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE')
      table.uuid('medecin_id').references('id').inTable('medecins').onDelete('CASCADE')
      
      // ANCIENS CHAMPS (pour compatibilité avec les autres modèles/migrations)
      table.text('diagnostic').nullable() 
      table.text('symptomes').nullable() 
      table.text('traitement_prescrit').nullable()
      table.json('examens_demandes').nullable()
      table.text('notes_consultation').nullable() // Renommable en 'examen_physique'
      
      // NOUVEAUX CHAMPS DÉDIÉS AU WORKFLOW FRONTEND
      table.text('motif_principal').nullable() 
      table.json('symptomes_associes').nullable() 
      table.json('constantes_vitales').nullable() 
      table.text('examen_physique').nullable() // Du workflow
      table.text('diagnostic_principal').nullable()
      table.text('plan_traitement').nullable()
      table.text('instructions_suivi').nullable()

      table.timestamp('date_consultation').defaultTo(this.now())
      table.integer('duree_consultation').nullable() // en minutes
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_consultations_patient_id ON consultations(patient_id)`)
    this.schema.raw(`CREATE INDEX idx_consultations_medecin_id ON consultations(medecin_id)`)
  }

  public async down() {
    this.schema.dropTableIfExists('consultations')
    this.schema.dropTableIfExists('rendez_vous')
  }
}