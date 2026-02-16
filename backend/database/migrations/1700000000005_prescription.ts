import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'prescriptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('consultation_id').references('id').inTable('consultations').onDelete('CASCADE')
      table.uuid('medicament_id').references('id').inTable('medicaments').onDelete('CASCADE')
      table.string('posologie').notNullable()
      table.string('duree_traitement').nullable()
      table.integer('quantite').notNullable()
      table.text('instructions_speciales').nullable()
      table.boolean('delivre').defaultTo(false)
      table.timestamp('date_prescription').defaultTo(this.now())
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`CREATE INDEX idx_prescriptions_consultation_id ON ${this.tableName}(consultation_id)`)
    this.schema.raw(`CREATE INDEX idx_prescriptions_medicament_id ON ${this.tableName}(medicament_id)`)
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
