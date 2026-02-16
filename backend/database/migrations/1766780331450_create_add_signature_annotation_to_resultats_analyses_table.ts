import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'resultats_analyse'

  public async up() {
    // Vérifier si la table existe
    const tableExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!tableExists.rows[0].exists) {
      // La table n'existe pas, on ne fait rien
      return
    }

    // Vérifier si les colonnes existent déjà
    const columns = await db.rawQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :tableName 
      AND column_name IN ('signature', 'annotation')
    `, { tableName: this.tableName })

    const existingColumns = columns.rows.map((row: any) => row.column_name)

    // Si aucune colonne n'existe, on peut utiliser alterTable normalement
    if (existingColumns.length === 0) {
      this.schema.alterTable(this.tableName, (table) => {
        table.text('signature').nullable().comment('Signature électronique en base64')
        table.text('annotation').nullable().comment('Annotation technique (notes internes)')
      })
    } else {
      // Ajouter seulement les colonnes manquantes
      this.schema.alterTable(this.tableName, (table) => {
        if (!existingColumns.includes('signature')) {
          table.text('signature').nullable().comment('Signature électronique en base64')
        }
        if (!existingColumns.includes('annotation')) {
          table.text('annotation').nullable().comment('Annotation technique (notes internes)')
        }
      })
    }
  }

  public async down() {
    // Vérifier si la table existe
    const tableExists = await db.rawQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      )
    `, { tableName: this.tableName })

    if (!tableExists.rows[0].exists) {
      return
    }

    // Vérifier si les colonnes existent avant de les supprimer
    const columns = await db.rawQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = :tableName 
      AND column_name IN ('signature', 'annotation')
    `, { tableName: this.tableName })

    const existingColumns = columns.rows.map((row: any) => row.column_name)

    if (existingColumns.length > 0) {
      this.schema.alterTable(this.tableName, (table) => {
        if (existingColumns.includes('signature')) {
          table.dropColumn('signature')
        }
        if (existingColumns.includes('annotation')) {
          table.dropColumn('annotation')
        }
      })
    }
  }
}
