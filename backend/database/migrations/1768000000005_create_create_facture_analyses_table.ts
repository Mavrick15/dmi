import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'facture_analyses'

  public async up() {
    // Vérifier si la table existe déjà (créée par une migration précédente)
    const tableExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!tableExists.rows[0].exists) {
      this.schema.createTable(this.tableName, (table) => {
        table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
        table.uuid('facture_id').notNullable().references('id').inTable('factures').onDelete('CASCADE')
        table.uuid('analyse_id').notNullable().references('id').inTable('analyses').onDelete('CASCADE')
        table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
        
        // Index unique pour éviter les doublons
        table.unique(['facture_id', 'analyse_id'])
      })

      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_facture_id ON ${this.tableName}(facture_id)`)
      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_analyse_id ON ${this.tableName}(analyse_id)`)
    } else {
      // La table existe déjà, vérifier et ajouter les contraintes manquantes si nécessaire
      // Vérifier si la FK vers analyses existe
      const fkExists = await db.rawQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_name = 'facture_analyses_analyse_id_foreign'
          AND table_name = :tableName
        )
      `, { tableName: this.tableName })

      if (!fkExists.rows[0].exists) {
        // Ajouter la FK si elle n'existe pas
        await db.rawQuery(`
          ALTER TABLE ${this.tableName} 
          ADD CONSTRAINT facture_analyses_analyse_id_foreign 
          FOREIGN KEY (analyse_id) REFERENCES analyses(id) ON DELETE CASCADE;
        `)
      }

      // Créer les index s'ils n'existent pas
      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_facture_id ON ${this.tableName}(facture_id)`)
      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_analyse_id ON ${this.tableName}(analyse_id)`)
    }
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
