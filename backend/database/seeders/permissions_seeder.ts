import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RolePermission from '#models/RolePermission'

export default class PermissionsSeeder extends BaseSeeder {
  public async run() {
    console.log('🔐 Initialisation des permissions par rôle...')

    // Permissions par défaut pour chaque rôle (permissions strictes)
    const defaultPermissions: Record<string, string[]> = {
      admin: [
        // Accès complet - Toutes les permissions du système
        // Un administrateur peut : tout faire dans le système (super-utilisateur)
        // Gestion complète : patients, consultations, prescriptions, analyses, facturation,
        // inventaire, utilisateurs, permissions, paramètres, audits
        'dashboard_view', // Accès au dashboard pour la vue d'ensemble
        'patient_view', 'patient_edit', 'patient_create', 'patient_delete', // Gestion complète des patients
        'clinical_view', 'clinical_write', 'prescription_create', 'prescription_view', // Accès complet à la console clinique
        'consultation_create', 'consultation_edit', // Gestion complète des consultations
        'analyses_view', 'analyses_create', 'analyses_edit', 'analyses_cancel', 'analyses_delete', // Gestion complète des analyses
        'resultats_view', 'resultats_create', 'resultats_edit', 'resultats_validate', // Gestion complète des résultats
        'appointment_view', 'agenda_view', 'appointment_create', 'appointment_edit', 'appointment_delete', // Gestion complète des rendez-vous + page Agenda
        'document_view', 'document_upload', 'document_delete', 'document_sign', // Gestion complète des documents
        'billing_view', 'billing_create', 'payment_process', 'finance_manage', // Gestion complète de la facturation
        'inventory_view', 'inventory_manage', 'medication_create', 'medication_edit', 'medication_delete', // Gestion complète de la pharmacie
        'order_create', 'order_receive', // Gestion complète des commandes
        'user_manage', 'user_view', 'user_create', 'user_edit', 'user_delete', // Gestion complète des utilisateurs
        'audit_view', 'permission_manage', 'settings_manage' // Gestion des audits, permissions et paramètres système
      ],
      docteur: [
        // Permissions médicales complètes - Pas d'accès au dashboard ni à la gestion des patients
        // Un docteur peut : diagnostiquer, prescrire, demander des analyses, valider les résultats,
        // gérer les consultations, gérer les rendez-vous, voir/uploader des documents médicaux
        // Un docteur NE PEUT PAS : créer/modifier/supprimer des patients, gérer les stocks,
        // gérer la facturation, accéder au dashboard, gérer les utilisateurs
        'clinical_view', 'clinical_write', // Accès complet à la console clinique
        'prescription_create', 'prescription_view', // Prescrire et voir les prescriptions
        'consultation_create', 'consultation_edit', // Créer et modifier les consultations (diagnostic, traitement)
        'analyses_view', 'analyses_create', 'analyses_edit', 'analyses_cancel', // Gérer les demandes d'analyses
        'resultats_view', 'resultats_create', 'resultats_edit', 'resultats_validate', // Voir, créer, modifier et valider les résultats
        'appointment_view', 'appointment_create', 'appointment_edit', 'appointment_delete', // Gérer les rendez-vous
        'document_view', 'document_upload', 'document_sign' // Voir, uploader et signer des documents médicaux
      ],
      infirmiere: [
        // Permissions de soins - Pas d'accès au dashboard
        // Un infirmier peut : voir/modifier les patients, prendre les constantes vitales,
        // créer des consultations de soins, faire des prélèvements, voir les résultats,
        // gérer les rendez-vous, gérer les documents
        // Un infirmier NE PEUT PAS : prescrire, diagnostiquer, valider des résultats,
        // modifier des consultations médicales, créer/supprimer des patients
        'patient_view', 'patient_edit', // Voir et modifier les informations des patients
        'clinical_view', 'clinical_write', // Accès à la console clinique pour les soins
        'consultation_create', // Créer des consultations de soins (pas de modification)
        'prescription_view', // Voir les prescriptions pour administrer les médicaments
        'analyses_view', 'analyses_create', // Voir et créer des demandes d'analyses (prélèvements)
        'resultats_view', 'resultats_create', // Voir et enregistrer les résultats (pas de validation)
        'appointment_view', 'agenda_view', 'appointment_create', 'appointment_edit', // Gérer les rendez-vous + page Agenda
        'document_view', 'document_upload' // Voir et uploader des documents
      ],
      pharmacien: [
        // Permissions de pharmacie uniquement - Pas d'accès au dashboard
        // Un pharmacien peut : voir les prescriptions pour les délivrer, gérer l'inventaire,
        // gérer les médicaments (créer, modifier, supprimer), créer et recevoir les commandes
        // Un pharmacien NE PEUT PAS : prescrire, diagnostiquer, gérer les consultations,
        // accéder au dashboard, gérer les analyses, gérer la facturation, gérer les patients
        'prescription_view', // Voir les prescriptions pour les délivrer et réduire les stocks
        'inventory_view', 'inventory_manage', // Voir et gérer l'inventaire (ajustements de stock)
        'medication_create', 'medication_edit', 'medication_delete', // Gérer le catalogue des médicaments
        'order_create', 'order_receive' // Créer des commandes auprès des fournisseurs et valider les réceptions
      ],
      gestionnaire: [
        // Permissions administratives et financières - Accès au dashboard
        // Un gestionnaire peut : gérer les patients (créer, voir, modifier), gérer la facturation,
        // voir les statistiques (dashboard), gérer les rendez-vous, voir les documents et audits
        // Un gestionnaire NE PEUT PAS : prescrire, diagnostiquer, gérer les stocks, gérer les analyses,
        // modifier les consultations médicales, supprimer des patients, gérer les utilisateurs
        'dashboard_view', // Accès au dashboard pour voir les statistiques et la vue d'ensemble
        'patient_view', 'patient_edit', 'patient_create', // Gérer les patients (création, modification, consultation)
        'billing_view', 'billing_create', 'payment_process', // Gérer la facturation et les paiements
        'user_view', // Voir les utilisateurs (pas de modification - réservé à l'admin)
        'appointment_view', 'agenda_view', 'appointment_create', 'appointment_edit', // Gérer les rendez-vous + page Agenda (pas docteur : ils ont l'agenda dans la console clinique)
        'document_view', // Voir les documents médicaux
        'audit_view' // Voir les audits pour le suivi des activités
      ],
      patient: [
        // Permissions limitées - Pas d'accès au dashboard
        'patient_view', // Seulement leur propre dossier
        'consultation_create', // Consultation de leur propre dossier
        'appointment_view', // Leurs propres rendez-vous
        'document_view' // Leurs propres documents
      ],
      it_specialist: [
        // Permissions techniques - Pas d'accès au dashboard
        'user_view',
        'audit_view',
        'settings_manage'
      ]
    }

    // Initialiser les permissions pour chaque rôle
    for (const [role, permissions] of Object.entries(defaultPermissions)) {
      await RolePermission.setRolePermissions(role, permissions)
      console.log(`✅ Permissions initialisées pour le rôle: ${role} (${permissions.length} permissions)`)
    }

    console.log('✅ Seeding des permissions terminé!')
  }
}

