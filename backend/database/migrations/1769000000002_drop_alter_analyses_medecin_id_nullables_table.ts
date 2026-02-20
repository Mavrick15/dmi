import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Nettoyage : supprime la table créée par erreur par la migration
 * 1766824853359 (qui devait "alter" analyses.medecin_id mais créait une table inutile).
 * La vraie modification medecin_id nullable est faite par 1768000000006.
 */
export default class extends BaseSchema {
  public async up() {
    this.schema.dropTableIfExists('alter_analyses_medecin_id_nullables')
  }

  public async down() {
    // Ne pas recréer cette table : elle n'a jamais eu de rôle métier
  }
}
