import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'analyses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('numero_analyse', 50).notNullable().unique()
      table.uuid('patient_id').notNullable().references('id').inTable('patients').onDelete('CASCADE')
      table.uuid('consultation_id').nullable().references('id').inTable('consultations').onDelete('SET NULL')
      table.uuid('medecin_id').notNullable().references('id').inTable('medecins').onDelete('CASCADE')
      table.enum('type_analyse', ['hematologie', 'biochimie', 'serologie', 'microbiologie', 'imagerie', 'autre']).notNullable()
      table.enum('statut', ['prescrite', 'en_cours', 'terminee', 'annulee', 'en_attente_validation']).defaultTo('prescrite')
      table.timestamp('date_prescription', { useTz: true }).defaultTo(this.now())
      table.timestamp('date_prelevement', { useTz: true }).nullable()
      table.timestamp('date_reception', { useTz: true }).nullable()
      table.timestamp('date_resultat', { useTz: true }).nullable()
      table.string('laboratoire').nullable()
      table.text('notes_prescription').nullable()
      table.enum('priorite', ['normale', 'urgente', 'critique']).defaultTo('normale')
      
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_analyses_numero ON ${this.tableName}(numero_analyse)`)
    this.schema.raw(`CREATE INDEX idx_analyses_patient ON ${this.tableName}(patient_id)`)
    this.schema.raw(`CREATE INDEX idx_analyses_consultation ON ${this.tableName}(consultation_id)`)
    this.schema.raw(`CREATE INDEX idx_analyses_medecin ON ${this.tableName}(medecin_id)`)
    this.schema.raw(`CREATE INDEX idx_analyses_statut ON ${this.tableName}(statut)`)
    this.schema.raw(`CREATE INDEX idx_analyses_type ON ${this.tableName}(type_analyse)`)
    this.schema.raw(`CREATE INDEX idx_analyses_date_prescription ON ${this.tableName}(date_prescription)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}

