import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'consultations'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('diagnosis_code', 20).nullable() // Code CIM-10
      table.uuid('diagnosis_code_id').nullable() // Référence vers cim10_codes
    })

    this.schema.raw(`CREATE INDEX idx_consultations_diagnosis_code ON ${this.tableName}(diagnosis_code)`)
    this.schema.raw(`CREATE INDEX idx_consultations_diagnosis_code_id ON ${this.tableName}(diagnosis_code_id)`)
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('diagnosis_code')
      table.dropColumn('diagnosis_code_id')
    })
  }
}

