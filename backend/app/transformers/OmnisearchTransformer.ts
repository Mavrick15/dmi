import { BaseTransformer } from './BaseTransformer.js'
import type Patient from '#models/Patient'
import type Medicament from '#models/Medicament'
import type UserProfile from '#models/UserProfile'
import type Facture from '#models/Facture'
import type Analyse from '#models/Analyse'

/**
 * Transformer pour les résultats de recherche globale
 * Structure et organise les résultats de recherche de manière cohérente
 */
export class OmnisearchTransformer extends BaseTransformer {
  /**
   * Transforme les résultats de recherche globale
   */
  static transformGlobalSearch(results: {
    patients: Patient[]
    medicaments: Medicament[]
    users: UserProfile[]
    factures: Facture[]
    analyses?: Analyse[]
  }): any[] {
    const transformer = new OmnisearchTransformer()
    const formattedResults: any[] = []

    // Patients
    formattedResults.push(
      ...results.patients.map(p => transformer.transformPatientResult(p))
    )

    // Médicaments
    formattedResults.push(
      ...results.medicaments.map(m => transformer.transformMedicamentResult(m))
    )

    // Utilisateurs Staff
    formattedResults.push(
      ...results.users.map(u => transformer.transformUserResult(u))
    )

    // Factures
    formattedResults.push(
      ...results.factures.map(f => transformer.transformFactureResult(f))
    )

    // Analyses
    if (results.analyses) {
      formattedResults.push(
        ...results.analyses.map(a => transformer.transformAnalyseResult(a))
      )
    }

    return formattedResults
  }

  /**
   * Transforme les suggestions d'auto-complétion
   */
  static transformAutocomplete(results: {
    patients: Patient[]
    medicaments: Medicament[]
    users: UserProfile[]
    factures: Facture[]
    analyses?: Analyse[]
  }): string[] {
    const suggestions: string[] = []

    // Patients
    suggestions.push(
      ...results.patients.map(p => 
        p.user?.nomComplet || `Patient ${p.numeroPatient}`
      )
    )

    // Médicaments
    suggestions.push(
      ...results.medicaments.map(m => m.nom)
    )

    // Utilisateurs Staff
    suggestions.push(
      ...results.users.map(u => u.nomComplet)
    )

    // Factures
    suggestions.push(
      ...results.factures.map(f => `Facture ${f.numeroFacture}`)
    )

    // Analyses
    if (results.analyses) {
      suggestions.push(
        ...results.analyses.map(a => 
          a.typeAnalyse?.nom || `Analyse ${a.id.substring(0, 8)}`
        )
      )
    }

    // Supprimer les doublons et limiter à 5
    return Array.from(new Set(suggestions)).slice(0, 5)
  }

  private transformPatientResult(p: Patient): any {
    return {
      id: p.id,
      type: 'Patient',
      title: p.user?.nomComplet || 'Patient sans nom',
      subtitle: `ID: ${p.numeroPatient} • ${p.user?.email || 'N/A'}`,
      icon: 'User',
      route: `/gestion-patients?view=details&id=${p.id}`,
    }
  }

  private transformMedicamentResult(m: Medicament): any {
    const stockStatus = m.stockActuel <= m.stockMinimum ? 'stock_faible' : 'en_stock'
    return {
      id: m.id,
      type: 'Médicament',
      title: m.nom,
      subtitle: `${m.dosage || ''} • Stock: ${m.stockActuel}`,
      icon: 'Pill',
      status: stockStatus,
      route: `/operations-pharmacie`,
    }
  }

  private transformUserResult(u: UserProfile): any {
    return {
      id: u.id,
      type: 'Staff',
      title: u.nomComplet,
      subtitle: `${u.role.charAt(0).toUpperCase() + u.role.slice(1)} • ${u.email}`,
      icon: 'BadgeCheck',
      route: `/administration-utilisateurs`,
    }
  }

  private transformFactureResult(f: Facture): any {
    const patientName = f.patient?.user?.nomComplet || f.patient?.numeroPatient || 'Patient inconnu'
    const statutLabels: Record<string, string> = {
      'en_attente': 'En attente',
      'payee': 'Payée',
      'en_retard': 'En retard',
      'annulee': 'Annulée'
    }
    const statut = statutLabels[f.statut] || f.statut

    return {
      id: f.id,
      type: 'Facture',
      title: `Facture ${f.numeroFacture}`,
      subtitle: `${patientName} • ${statut} • €${Number(f.montantTotal).toFixed(2)}`,
      icon: 'FileText',
      route: `/operations-financieres?invoice=${f.id}`,
    }
  }

  private transformAnalyseResult(a: Analyse): any {
    const patientName = a.patient?.user?.nomComplet || a.patient?.numeroPatient || 'Patient inconnu'
    const typeAnalyse = a.typeAnalyse?.nom || 'Analyse'
    const statutLabels: Record<string, string> = {
      'prescrite': 'Prescrite',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    }
    const statut = statutLabels[a.statut] || a.statut

    return {
      id: a.id,
      type: 'Analyse',
      title: `${typeAnalyse}`,
      subtitle: `${patientName} • ${statut}`,
      icon: 'TestTube',
      route: `/analyses-laboratoire?analyseId=${a.id}`,
    }
  }
}

