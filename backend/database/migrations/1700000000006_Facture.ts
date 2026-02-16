import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    // Factures
    this.schema.createTable('factures', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE')
      table.uuid('consultation_id').references('id').inTable('consultations').onDelete('SET NULL').nullable()
      table.string('numero_facture').notNullable().unique()
      table.decimal('montant_total', 12, 2).notNullable()
      table.decimal('montant_paye', 12, 2).defaultTo(0)
      table.enum('statut', ['en_attente', 'payee', 'en_retard', 'annulee']).defaultTo('en_attente')
      table.date('date_emission').defaultTo(this.now())
      table.date('date_echeance').nullable()
      table.text('notes').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_factures_patient_id ON factures(patient_id)`)
    this.schema.raw(`CREATE INDEX idx_factures_statut ON factures(statut)`)

    // Transactions financières
    this.schema.createTable('transactions_financieres', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('facture_id').references('id').inTable('factures').onDelete('CASCADE')
      table.enum('type_transaction', ['consultation', 'traitement', 'medicament', 'analyse']).notNullable()
      table.decimal('montant', 12, 2).notNullable()
      table.string('methode_paiement').nullable() // especes, carte, cheque, virement
      table.string('numero_transaction').nullable()
      table.timestamp('date_transaction').defaultTo(this.now())
      table.text('notes').nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_transactions_facture_id ON transactions_financieres(facture_id)`)
  }

  public async down() {
    this.schema.dropTableIfExists('transactions_financieres')
    this.schema.dropTableIfExists('factures')
  }
}
