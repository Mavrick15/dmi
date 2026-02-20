import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

/**
 * Complément facture_analyses : uniquement FK et index si la table existe déjà.
 * La création de la table est faite par 1766780403345_create_create_facture_analyses_table.
 */
export default class extends BaseSchema {
  protected tableName = 'facture_analyses'

  public async up() {
    const tableExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!tableExists.rows[0].exists) return

    const fkExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'facture_analyses_analyse_id_foreign' AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!fkExists.rows[0].exists) {
      await db.rawQuery(`
        ALTER TABLE ${this.tableName} 
        ADD CONSTRAINT facture_analyses_analyse_id_foreign 
        FOREIGN KEY (analyse_id) REFERENCES analyses(id) ON DELETE CASCADE;
      `)
    }

    this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_facture_id ON ${this.tableName}(facture_id)`)
    this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_analyse_id ON ${this.tableName}(analyse_id)`)
  }

  public async down() {
    // Supprimer la table pour permettre le rollback de 1768000000003 (analyses) qui dépend de l'ordre
    this.schema.dropTableIfExists(this.tableName)
  }
}
