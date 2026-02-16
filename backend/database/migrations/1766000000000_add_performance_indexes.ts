import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'add_performance_indexes'

  async up() {
    // Index pour améliorer les performances des requêtes fréquentes
    
    // User Profiles - Recherche par email (login)
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
      ON user_profiles(email);
    `)

    // User Profiles - Recherche par rôle
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
      ON user_profiles(role);
    `)

    // Patients - Recherche par numéro patient
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_patients_numero_patient 
      ON patients(numero_patient);
    `)

    // Patients - Recherche par user_id
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_patients_user_id 
      ON patients(user_id);
    `)

    // Rendez-vous - Recherche par date et statut
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_date_statut 
      ON rendez_vous(date_heure, statut);
    `)

    // Rendez-vous - Recherche par patient
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_patient_id 
      ON rendez_vous(patient_id);
    `)

    // Rendez-vous - Recherche par médecin
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_medecin_id 
      ON rendez_vous(medecin_id);
    `)

    // Consultations - Recherche par patient et date
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_consultations_patient_date 
      ON consultations(patient_id, date_consultation);
    `)

    // Consultations - Recherche par médecin
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_consultations_medecin_id 
      ON consultations(medecin_id);
    `)

    // Factures - Recherche par statut et date
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_factures_statut_date 
      ON factures(statut, date_emission);
    `)

    // Factures - Recherche par patient
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_factures_patient_id 
      ON factures(patient_id);
    `)

    // Transactions - Recherche par date
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date 
      ON transactions_financieres(date_transaction);
    `)

    // Médicaments - Recherche par nom (pour la recherche)
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_medicaments_nom 
      ON medicaments USING gin(to_tsvector('french', nom));
    `)

    // Médicaments - Recherche par statut de stock
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_medicaments_statut_stock 
      ON medicaments(statut_stock);
    `)

    // ApiTokens - Recherche par token (authentification)
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_api_tokens_token 
      ON api_tokens(token);
    `)

    // ApiTokens - Recherche par user_id et statut
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_api_tokens_user_revoked 
      ON api_tokens(user_id, is_revoked);
    `)

    // Inventaire Mouvements - Recherche par médicament
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_inventaire_mouvements_medicament 
      ON inventaire_mouvements(medicament_id);
    `)

    // Inventaire Mouvements - Recherche par date
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_inventaire_mouvements_date 
      ON inventaire_mouvements(created_at);
    `)
  }

  async down() {
    // Suppression des index en ordre inverse
    this.schema.raw(`DROP INDEX IF EXISTS idx_inventaire_mouvements_date;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_inventaire_mouvements_medicament;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_api_tokens_user_revoked;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_api_tokens_token;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_medicaments_statut_stock;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_medicaments_nom;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_transactions_date;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_factures_patient_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_factures_statut_date;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_consultations_medecin_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_consultations_patient_date;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_medecin_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_patient_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_date_statut;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_patients_user_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_patients_numero_patient;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_user_profiles_role;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_user_profiles_email;`)
  }
}

