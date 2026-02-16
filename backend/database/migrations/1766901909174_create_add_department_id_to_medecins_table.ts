import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'medecins'

  public async up() {
    // Vérifier si la colonne existe déjà
    const columns = await db.rawQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :tableName 
      AND column_name = 'department_id'
    `, { tableName: this.tableName })

    if (columns.rows.length === 0) {
      this.schema.alterTable(this.tableName, (table) => {
        table.uuid('department_id').references('id').inTable('departments').onDelete('SET NULL').nullable().after('specialite')
      })

      // Index pour améliorer les performances
      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_medecins_department_id ON ${this.tableName}(department_id)`)
    }
  }

  public async down() {
    // Vérifier si la colonne existe avant de la supprimer
    const columns = await db.rawQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :tableName 
      AND column_name = 'department_id'
    `, { tableName: this.tableName })

    if (columns.rows.length > 0) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropForeign(['department_id'])
        table.dropColumn('department_id')
      })
    }
  }
}
