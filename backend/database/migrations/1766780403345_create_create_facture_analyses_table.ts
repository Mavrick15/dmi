import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'facture_analyses'

  public async up() {
    // Vérifier si la table existe déjà
    const tableExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!tableExists.rows[0].exists) {
      // Vérifier si la table 'analyses' existe (nécessaire pour la FK)
      const analysesExists = await db.rawQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'analyses'
        )
      `)

      this.schema.createTable(this.tableName, (table) => {
        table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
        table.uuid('facture_id').notNullable().references('id').inTable('factures').onDelete('CASCADE')
        
        // Ajouter analyse_id avec ou sans FK selon si la table analyses existe
        if (analysesExists.rows[0].exists) {
          table.uuid('analyse_id').notNullable().references('id').inTable('analyses').onDelete('CASCADE')
        } else {
          table.uuid('analyse_id').notNullable()
        }
        
        table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
        
        // Index unique pour éviter les doublons
        table.unique(['facture_id', 'analyse_id'])
      })

      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_facture_id ON ${this.tableName}(facture_id)`)
      this.schema.raw(`CREATE INDEX IF NOT EXISTS idx_facture_analyses_analyse_id ON ${this.tableName}(analyse_id)`)
      
      // Si la table analyses n'existait pas, ajouter la FK maintenant
      if (!analysesExists.rows[0].exists) {
        // La FK sera ajoutée par la migration ultérieure qui crée la table analyses
        // ou on peut l'ajouter manuellement ici après vérification
        await db.rawQuery(`
          DO $$
          BEGIN
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analyses') THEN
              ALTER TABLE ${this.tableName} 
              ADD CONSTRAINT facture_analyses_analyse_id_foreign 
              FOREIGN KEY (analyse_id) REFERENCES analyses(id) ON DELETE CASCADE;
            END IF;
          END $$;
        `)
      }
    }
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
