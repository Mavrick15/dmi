import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  public async up() {
    const r = await db.rawQuery(
      "SELECT data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'"
    )
    const row = r.rows?.[0] as { data_type?: string; udt_name?: string } | undefined
    if (!row) return
    // Si la colonne est en text/varchar, aucune modification de type : les nouvelles valeurs sont déjà acceptées
    if (row.data_type === 'text' || row.data_type === 'character varying') return
    // Sinon c'est un enum PostgreSQL : ajouter les nouvelles valeurs
    if (row.data_type !== 'USER-DEFINED' || !row.udt_name) return
    const typeName = row.udt_name
    await db.rawQuery(`ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS 'docteur_clinique'`)
    await db.rawQuery(`ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS 'docteur_labo'`)
  }

  public async down() {}
}
