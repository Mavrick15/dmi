import { writeFile } from 'fs/promises'
import { join } from 'path'
import Patient from '#models/Patient'
import Consultation from '#models/Consultation'
import Facture from '#models/Facture'
import UserProfile from '#models/UserProfile'
import Etablissement from '#models/Etablissement'
import ActivityLog from '#models/ActivityLog'
import { DateTime } from 'luxon'

/**
 * Service pour exporter des données en différents formats
 */
export default class ExportService {
  /**
   * Exporter les patients en CSV
   */
  static async exportPatientsToCSV(options: {
    startDate?: DateTime
    endDate?: DateTime
  } = {}): Promise<string> {
    let query = Patient.query().preload('user')

    if (options.startDate) {
      const startSQL = options.startDate.toSQL()
      if (startSQL) {
        query = query.where('created_at', '>=', startSQL)
      }
    }

    if (options.endDate) {
      const endSQL = options.endDate.toSQL()
      if (endSQL) {
        query = query.where('created_at', '<=', endSQL)
      }
    }

    const patients = await query.exec()

    // En-têtes CSV
    const headers = [
      'ID',
      'Numéro Patient',
      'Nom Complet',
      'Email',
      'Téléphone',
      'Date de Naissance',
      'Sexe',
      'Groupe Sanguin',
      'Assurance',
      'Date de Création',
    ]

    // Lignes de données
    const rows = patients.map((patient) => [
      patient.id,
      patient.numeroPatient,
      patient.user?.nomComplet || '',
      patient.user?.email || '',
      patient.user?.telephone || '',
      patient.dateNaissance?.toFormat('dd/MM/yyyy') || '',
      patient.sexe || '',
      patient.groupeSanguin || '',
      patient.assuranceMaladie || '',
      patient.createdAt.toFormat('dd/MM/yyyy HH:mm'),
    ])

    // Générer le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Exporter les consultations en CSV
   */
  static async exportConsultationsToCSV(options: {
    startDate?: DateTime
    endDate?: DateTime
    medecinId?: string
  } = {}): Promise<string> {
    let query = Consultation.query()
      .preload('patient', (q) => q.preload('user'))
      .preload('medecin', (q) => q.preload('user'))

    if (options.startDate) {
      const startSQL = options.startDate.toSQL()
      if (startSQL) {
        query = query.where('date_consultation', '>=', startSQL)
      }
    }

    if (options.endDate) {
      const endSQL = options.endDate.toSQL()
      if (endSQL) {
        query = query.where('date_consultation', '<=', endSQL)
      }
    }

    if (options.medecinId) {
      query = query.where('medecin_id', options.medecinId)
    }

    const consultations = await query.exec()

    const headers = [
      'ID',
      'Date Consultation',
      'Patient',
      'Médecin',
      'Diagnostic',
      'Motif Principal',
    ]

    const rows = consultations.map((consultation) => [
      consultation.id,
      consultation.dateConsultation.toFormat('dd/MM/yyyy HH:mm'),
      consultation.patient?.user?.nomComplet || '',
      consultation.medecin?.user?.nomComplet || '',
      consultation.diagnosticPrincipal || '',
      consultation.motifPrincipal || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Exporter les factures en CSV
   */
  static async exportInvoicesToCSV(options: {
    startDate?: DateTime
    endDate?: DateTime
    statut?: string
  } = {}): Promise<string> {
    let query = Facture.query().preload('patient', (q) => q.preload('user'))

    if (options.startDate) {
      const startSQL = options.startDate.toSQL()
      if (startSQL) {
        query = query.where('date_emission', '>=', startSQL)
      }
    }

    if (options.endDate) {
      const endSQL = options.endDate.toSQL()
      if (endSQL) {
        query = query.where('date_emission', '<=', endSQL)
      }
    }

    if (options.statut) {
      query = query.where('statut', options.statut)
    }

    const factures = await query.exec()

    const headers = [
      'Numéro Facture',
      'Date Émission',
      'Patient',
      'Montant Total',
      'Montant Payé',
      'Reste à Payer',
      'Statut',
    ]

    const rows = factures.map((facture) => [
      facture.numeroFacture,
      facture.dateEmission.toFormat('dd/MM/yyyy'),
      facture.patient?.user?.nomComplet || '',
      facture.montantTotal.toString(),
      facture.montantPaye.toString(),
      (facture.montantTotal - facture.montantPaye).toString(),
      facture.statut,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Exporter les utilisateurs en CSV
   */
  static async exportUsersToCSV(): Promise<string> {
    const users = await UserProfile.query()
      .whereNotIn('role', ['patient'])
      .orderBy('date_creation', 'desc')
      .exec()

    const headers = [
      'ID',
      'Nom Complet',
      'Email',
      'Téléphone',
      'Rôle',
      'Département',
      'Actif',
      'Date de Création',
      'Dernière Connexion'
    ]

    const rows = users.map((user) => [
      user.id,
      user.nomComplet || '',
      user.email || '',
      user.telephone || '',
      user.role || '',
      '', // Département (à récupérer si disponible)
      user.actif ? 'Oui' : 'Non',
      user.createdAt.toFormat('dd/MM/yyyy HH:mm'),
      user.derniereConnexion?.toFormat('dd/MM/yyyy HH:mm') || 'Jamais'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Exporter les établissements en CSV
   */
  static async exportEstablishmentsToCSV(): Promise<string> {
    const establishments = await Etablissement.query()
      .orderBy('created_at', 'desc')
      .exec()

    const headers = [
      'ID',
      'Nom',
      'Type',
      'Adresse',
      'Téléphone',
      'Email',
      'N° Agrément',
      'Actif',
      'Date de Création'
    ]

    const rows = establishments.map((etab) => [
      etab.id,
      etab.nom || '',
      etab.typeEtablissement || '',
      etab.adresse || '',
      etab.telephone || '',
      etab.email || '',
      etab.numeroAgrement || '',
      etab.actif ? 'Oui' : 'Non',
      etab.createdAt.toFormat('dd/MM/yyyy HH:mm')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Exporter les logs d'audit en CSV
   */
  static async exportAuditLogsToCSV(options: {
    startDate?: DateTime
    endDate?: DateTime
    action?: string
    userId?: string
  } = {}): Promise<string> {
    let query = ActivityLog.query()
      .preload('user')
      .orderBy('created_at', 'desc')

    if (options.startDate) {
      const startSQL = options.startDate.toSQL()
      if (startSQL) {
        query = query.where('created_at', '>=', startSQL)
      }
    }

    if (options.endDate) {
      const endSQL = options.endDate.toSQL()
      if (endSQL) {
        query = query.where('created_at', '<=', endSQL)
      }
    }

    if (options.action) {
      query = query.where('type', options.action)
    }

    if (options.userId) {
      query = query.where('user_id', options.userId)
    }

    const logs = await query.limit(10000).exec() // Limite pour éviter les exports trop volumineux

    const headers = [
      'ID',
      'Date',
      'Utilisateur',
      'Type',
      'Description',
      'ID Cible'
    ]

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toFormat('dd/MM/yyyy HH:mm:ss'),
      log.user?.nomComplet || log.userId || 'Système',
      log.type || '',
      log.description || '',
      log.targetId || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
  }

  /**
   * Sauvegarder un export dans un fichier
   */
  static async saveExport(
    content: string,
    filename: string,
    format: 'csv' = 'csv'
  ): Promise<string> {
    const exportsDir = join(process.cwd(), 'storage', 'exports')
    const { mkdir } = await import('fs/promises')
    const { existsSync } = await import('fs')

    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true })
    }

    const filepath = join(exportsDir, `${filename}.${format}`)
    await writeFile(filepath, content, 'utf-8')

    return filepath
  }
}

