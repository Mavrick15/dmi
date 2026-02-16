import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    // Patients
    this.schema.createTable('patients', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').references('id').inTable('user_profiles').onDelete('CASCADE')
      table.string('numero_patient').notNullable().unique()
      table.date('date_naissance').nullable()
      table.enum('sexe', ['masculin', 'feminin', 'autre']).nullable()
      table.string('groupe_sanguin').nullable()
      table.json('allergies').nullable()
      table.text('antecedents_medicaux').nullable()
      table.string('contact_urgence_nom').nullable()
      table.string('contact_urgence_telephone').nullable()
      table.string('assurance_maladie').nullable()
      table.string('numero_assurance').nullable()
      table.uuid('etablissement_id').references('id').inTable('etablissements').onDelete('SET NULL').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_patients_user_id ON patients(user_id)`)
    this.schema.raw(`CREATE INDEX idx_patients_numero ON patients(numero_patient)`)

    // Medecins
    this.schema.createTable('medecins', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').references('id').inTable('user_profiles').onDelete('CASCADE')
      table.string('numero_ordre').notNullable().unique()
      table.string('specialite').notNullable()
      table.uuid('etablissement_id').references('id').inTable('etablissements').onDelete('SET NULL').nullable()
      table.boolean('disponible').defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_medecins_user_id ON medecins(user_id)`)
    this.schema.raw(`CREATE INDEX idx_medecins_specialite ON medecins(specialite)`)
  }

  public async down() {
    this.schema.dropTableIfExists('medecins')
    this.schema.dropTableIfExists('patients')
  }
}
