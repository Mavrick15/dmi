import { BaseSeeder } from '@adonisjs/lucid/seeders'
import RolePermission from '#models/RolePermission'
import * as PermissionManager from '../../app/utils/PermissionManager.js'

export default class PermissionsSeeder extends BaseSeeder {
  public async run() {
    console.log('🔐 Initialisation des permissions par rôle...')

    const availablePermissions = await PermissionManager.loadPermissions()
    const availableNames = new Set(availablePermissions.map((p) => p.name))

    // Permissions par défaut alignées avec la matrice actuelle des rôles.
    const defaultPermissions: Record<string, string[]> = {
      admin: [
        'dashboard_view',
        'patient_view',
        'patient_edit',
        'patient_create',
        'patient_delete',
        'clinical_view',
        'clinical_write',
        'prescription_create',
        'prescription_view',
        'consultation_create',
        'consultation_edit',
        'analyses_view',
        'analyses_create',
        'analyses_edit',
        'analyses_cancel',
        'analyses_delete',
        'resultats_view',
        'resultats_create',
        'resultats_edit',
        'resultats_validate',
        'appointment_view',
        'agenda_view',
        'appointment_create',
        'appointment_edit',
        'appointment_delete',
        'document_view',
        'document_upload',
        'document_delete',
        'document_sign',
        'billing_view',
        'billing_create',
        'payment_process',
        'finance_manage',
        'inventory_view',
        'inventory_manage',
        'medication_create',
        'medication_edit',
        'medication_delete',
        'order_create',
        'order_receive',
        'user_manage',
        'user_view',
        'user_create',
        'user_edit',
        'user_delete',
        'audit_view',
        'permission_manage',
        'settings_manage',
      ],
      docteur_clinique: [
        // Patients: view, edit
        'patient_view',
        'patient_edit',
        // Clinique: all
        'clinical_view',
        'clinical_write',
        'prescription_create',
        'prescription_view',
        'consultation_create',
        'consultation_edit',
        // Analyses: edit, create, view, resultat_valide
        'analyses_view',
        'analyses_create',
        'analyses_edit',
        'resultats_validate',
        // Rendez-vous: all sauf agenda_view
        'appointment_view',
        'appointment_create',
        'appointment_edit',
        'appointment_delete',
        // Documents: view, upload, sign
        'document_view',
        'document_upload',
        'document_sign',
      ],
      docteur_labo: [
        // Patients: view, edit
        'patient_view',
        'patient_edit',
        // Clinique: null
        // Analyses: all sauf delete
        'analyses_view',
        'analyses_create',
        'analyses_edit',
        'analyses_cancel',
        'resultats_view',
        'resultats_create',
        'resultats_edit',
        'resultats_validate',
        // Rendez-vous: null
        // Le reste: null
      ],
      infirmiere: [
        // Patients: all sauf delete
        'patient_view',
        'patient_edit',
        'patient_create',
        // Clinique: null
        // Analyses: null sauf view
        'analyses_view',
        'resultats_view',
        // Rendez-vous: all sauf delete
        'appointment_view',
        'agenda_view',
        'appointment_create',
        'appointment_edit',
        // Documents: view, upload
        'document_view',
        'document_upload',
      ],
      pharmacien: [
        'prescription_view',
        'inventory_view',
        'inventory_manage',
        'medication_create',
        'medication_edit',
        'medication_delete',
        'order_create',
        'order_receive',
      ],
      gestionnaire: [
        'dashboard_view',
        'patient_view',
        'patient_edit',
        'patient_create',
        'billing_view',
        'billing_create',
        'payment_process',
        'user_view',
        'appointment_view',
        'agenda_view',
        'appointment_create',
        'appointment_edit',
        'document_view',
        'audit_view',
      ],
      patient: [
        'patient_view',
        'appointment_view',
        'document_view',
      ],
    }

    // Initialiser les permissions pour chaque rôle
    for (const [role, permissions] of Object.entries(defaultPermissions)) {
      const normalized = [...new Set(permissions)].filter((permission) => availableNames.has(permission))
      await RolePermission.setRolePermissions(role, normalized)

      const dropped = permissions.filter((permission) => !availableNames.has(permission))
      if (dropped.length > 0) {
        console.warn(`⚠️ Permissions ignorées pour ${role}: ${dropped.join(', ')}`)
      }

      console.log(
        `✅ Permissions initialisées pour le rôle: ${role} (${normalized.length} permissions)`
      )
    }

    console.log('✅ Seeding des permissions terminé!')
  }
}
