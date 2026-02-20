import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_profiles'

  public async up() {
    // Migrer les comptes "docteur" vers "docteur_clinique" avant de modifier la contrainte
    await this.schema.raw(
      `UPDATE ${this.tableName} SET role = 'docteur_clinique' WHERE role = 'docteur'`
    )
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS user_profiles_role_check`
    )
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'docteur_clinique', 'docteur_labo', 'infirmiere', 'pharmacien', 'gestionnaire', 'patient'))`
    )
  }

  public async down() {
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS user_profiles_role_check`
    )
    // Restaurer une contrainte qui accepte tous les rôles (dont docteur_labo, patient) pour que le rollback ne viole pas les lignes existantes
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT user_profiles_role_check CHECK (role IN ('admin', 'docteur', 'docteur_clinique', 'docteur_labo', 'infirmiere', 'pharmacien', 'gestionnaire', 'patient'))`
    )
  }
}
