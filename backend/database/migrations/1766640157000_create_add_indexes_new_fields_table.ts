import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Index pour les nouvelles colonnes de factures
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_factures_date_paiement_complet 
      ON factures(date_paiement_complet) 
      WHERE date_paiement_complet IS NOT NULL;
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_factures_derniere_relance 
      ON factures(derniere_relance) 
      WHERE derniere_relance IS NOT NULL;
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_factures_consultation_id 
      ON factures(consultation_id) 
      WHERE consultation_id IS NOT NULL;
    `)

    // Index pour les nouvelles colonnes de rendez-vous
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_date_annulation 
      ON rendez_vous(date_annulation) 
      WHERE date_annulation IS NOT NULL;
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_confirme_patient 
      ON rendez_vous(confirme_par_patient, date_confirmation_patient);
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_rendez_vous_rappel_24h 
      ON rendez_vous(rappel_envoye_24h, date_dernier_rappel) 
      WHERE rappel_envoye_24h = false;
    `)

    // Index pour les nouvelles colonnes de consultations
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_consultations_imc 
      ON consultations(imc) 
      WHERE imc IS NOT NULL;
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_consultations_date_prochaine 
      ON consultations(date_prochaine_consultation) 
      WHERE date_prochaine_consultation IS NOT NULL;
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_consultations_urgente 
      ON consultations(consultation_urgente) 
      WHERE consultation_urgente = true;
    `)

    // Note: Les index pour diagnosis_code et diagnosis_code_id sont créés 
    // dans la migration 1767000000003_add_diagnosis_code_to_consultations

    // Index pour les documents (si pas déjà présents)
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_documents_category_status 
      ON documents(category, status);
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_documents_patient_category 
      ON documents(patient_id, category) 
      WHERE patient_id IS NOT NULL;
    `)

    // Index pour les prescriptions
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id 
      ON prescriptions(consultation_id);
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_medicament_id 
      ON prescriptions(medicament_id);
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_prescriptions_delivre 
      ON prescriptions(delivre) 
      WHERE delivre = false;
    `)

    // Index pour les notifications (si pas déjà présents)
    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
      ON notifications(user_id, is_read, created_at DESC);
    `)

    this.schema.raw(`
      CREATE INDEX IF NOT EXISTS idx_notifications_category_type 
      ON notifications(category, type, created_at DESC);
    `)
  }

  async down() {
    // Suppression des index en ordre inverse
    this.schema.raw(`DROP INDEX IF EXISTS idx_notifications_category_type;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_notifications_user_read;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_prescriptions_delivre;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_prescriptions_medicament_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_prescriptions_consultation_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_documents_patient_category;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_documents_category_status;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_consultations_urgente;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_consultations_date_prochaine;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_consultations_imc;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_rappel_24h;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_confirme_patient;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_rendez_vous_date_annulation;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_factures_consultation_id;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_factures_derniere_relance;`)
    this.schema.raw(`DROP INDEX IF EXISTS idx_factures_date_paiement_complet;`)
  }
}
