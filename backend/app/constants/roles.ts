export const DOCTOR_ROLES = ['docteur_clinique', 'docteur_labo'] as const
export type DoctorRole = (typeof DOCTOR_ROLES)[number]

/** Rôle médecin laboratoire uniquement (notifications analyses / résultats) */
export const LAB_DOCTOR_ROLE = 'docteur_labo' as const

/** Rôle médecin clinique uniquement (consultations, rendez-vous, alertes) */
export const CLINICAL_DOCTOR_ROLES = ['docteur_clinique'] as const

export function isDoctorRole(role: string | undefined): role is DoctorRole {
  return role !== undefined && (DOCTOR_ROLES as readonly string[]).includes(role)
}
