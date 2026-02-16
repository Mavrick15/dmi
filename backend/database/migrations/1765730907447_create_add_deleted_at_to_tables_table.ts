import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Liste des tables concernées
  protected tables = [
    'user_profiles', 
    'patients', 
    'medecins', 
    'documents', 
    'rendez_vous', 
    'medicaments'
  ]

  public async up() {
    for (const tableName of this.tables) {
      // 1. On vérifie d'abord que la table existe
      if (await this.schema.hasTable(tableName)) {
        
        // 2. On vérifie si la colonne MANQUE avant de l'ajouter
        // Cela empêche l'erreur "column already exists"
        if (!await this.schema.hasColumn(tableName, 'deleted_at')) {
          this.schema.alterTable(tableName, (table) => {
            table.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null)
          })
        }
      }
    }
  }

  public async down() {
    for (const tableName of this.tables) {
      if (await this.schema.hasTable(tableName)) {
        if (await this.schema.hasColumn(tableName, 'deleted_at')) {
          this.schema.alterTable(tableName, (table) => {
            table.dropColumn('deleted_at')
          })
        }
      }
    }
  }
}