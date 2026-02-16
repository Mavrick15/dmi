import { BaseTransformer } from './BaseTransformer.js'
import type Consultation from '#models/Consultation'
import { DateTime } from 'luxon'

/**
 * Transformer pour les données Consultation
 * Structure et organise les données de consultation de manière cohérente
 */
export class ConsultationTransformer extends BaseTransformer {
  /**
   * Transforme une seule consultation
   */
  static transform(consultation: Consultation, detailed = false): any {
    const transformer = new ConsultationTransformer()
    return transformer.transformSingle(consultation, detailed)
  }

  /**
   * Transforme une collection de consultations
   */
  static transformMany(consultations: Consultation[], detailed = false): any[] {
    const transformer = new ConsultationTransformer()
    return consultations.map(c => transformer.transformSingle(c, detailed))
  }

  private transformSingle(c: Consultation, detailed: boolean): any {
    const baseData = {
      id: c.id,
      patientId: c.patientId,
      medecinId: c.medecinId,
      rendezVousId: c.rendezVousId,
      dateConsultation: c.dateConsultation?.toISO() || null,
      date: this.formatDate(c.dateConsultation),
      dureeConsultation: c.dureeConsultation || null,
      duration: c.dureeConsultation || null,
      motifPrincipal: c.motifPrincipal || null,
      chiefComplaint: c.motifPrincipal || null,
      symptoms: this.parseJsonField(c.symptomesAssocies),
      symptomesAssocies: this.parseJsonField(c.symptomesAssocies),
      vitalSigns: this.parseJsonField(c.constantesVitales),
      constantesVitales: this.parseJsonField(c.constantesVitales),
      examination: c.examenPhysique || null,
      examenPhysique: c.examenPhysique || null,
      diagnosticPrincipal: c.diagnosticPrincipal || null,
      diagnosis: c.diagnosticPrincipal || c.diagnostic || null,
      diagnostic: c.diagnostic || c.diagnosticPrincipal || null,
      planTraitement: c.planTraitement || null,
      treatment: c.planTraitement || c.traitementPrescrit || null,
      traitementPrescrit: c.traitementPrescrit || null,
      requestedExams: this.parseJsonField(c.examensDemandes),
      examensDemandes: this.parseJsonField(c.examensDemandes),
      followUp: c.instructionsSuivi || null,
      instructionsSuivi: c.instructionsSuivi || null,
      notes: c.notesConsultation || null,
      notesConsultation: c.notesConsultation || null,
      symptomes: c.symptomes || null,
      medecinName: c.medecin?.user?.nomComplet || 'Médecin Inconnu',
      patientName: c.patient?.user?.nomComplet || 'Patient Inconnu',
      createdAt: c.createdAt?.toISO() || null,
      updatedAt: c.updatedAt?.toISO() || null,
    }

    if (detailed) {
      return {
        ...baseData,
        medecin: c.medecin ? {
          id: c.medecin.id,
          name: c.medecin.user?.nomComplet || 'Médecin Inconnu',
          email: c.medecin.user?.email || null,
        } : null,
        patient: c.patient ? {
          id: c.patient.id,
          name: c.patient.user?.nomComplet || 'Patient Inconnu',
          numeroPatient: c.patient.numeroPatient || null,
        } : null,
        rendezVous: c.rendezVous ? {
          id: c.rendezVous.id,
          dateHeure: c.rendezVous.dateHeure?.toISO() || null,
          statut: c.rendezVous.statut || null,
        } : null,
      }
    }

    return baseData
  }

  /**
   * Parse un champ JSON (peut être string ou object)
   */
  private parseJsonField(value: any): any {
    if (!value) return null
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    if (typeof value === 'object') {
      return value
    }
    return null
  }
}

