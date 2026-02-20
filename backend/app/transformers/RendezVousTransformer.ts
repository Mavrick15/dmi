import { BaseTransformer } from './BaseTransformer.js'
import type RendezVous from '#models/RendezVous'
import { BUSINESS_TIMEZONE } from '../utils/timezone.js'

/**
 * Transformer pour les données RendezVous
 * Structure et organise les données de rendez-vous de manière cohérente
 */
export class RendezVousTransformer extends BaseTransformer {
  /**
   * Transforme un seul rendez-vous
   */
  static transform(rendezVous: RendezVous, detailed = false): any {
    const transformer = new RendezVousTransformer()
    return transformer.transformSingle(rendezVous, detailed)
  }

  /**
   * Transforme une collection de rendez-vous
   */
  static transformMany(rendezVous: RendezVous[], detailed = false): any[] {
    const transformer = new RendezVousTransformer()
    return rendezVous.map(r => transformer.transformSingle(r, detailed))
  }

  private transformSingle(r: RendezVous, detailed: boolean): any {
    const hasConsultation = (r as any).hasConsultation || false
    const baseStatus = r.statut === 'programme' ? 'pending' : 
                      r.statut === 'en_cours' ? 'confirmed' :
                      r.statut === 'termine' ? 'completed' : 'cancelled'
    const zonedDateHeure = r.dateHeure?.setZone(BUSINESS_TIMEZONE)

    // Convertir la date en format ISO avec décalage de fuseau horaire local
    // pour éviter les problèmes de conversion UTC
    let dateHeureISO: string | null = null
    if (zonedDateHeure) {
      dateHeureISO = zonedDateHeure.toISO()
    }

    const baseData = {
      id: r.id,
      patientId: r.patientId,
      medecinId: r.medecinId,
      dateHeure: dateHeureISO,
      date: zonedDateHeure?.toISODate() || null,
      time: zonedDateHeure?.toFormat('HH:mm') || null,
      dureeMinutes: r.dureeMinutes || 30,
      duration: r.dureeMinutes || 30,
      statut: r.statut,
      status: hasConsultation ? 'consulted' : baseStatus,
      motif: r.motif || 'Consultation',
      type: r.motif || 'Consultation',
      priorite: r.priorite || 'normale',
      priority: r.priorite || 'normale',
      notes: r.notes || null,
      salle: r.salle || 'Non assignée',
      room: r.salle || 'Non assignée',
      hasConsultation: hasConsultation,
      patientName: r.patient?.user?.nomComplet || 'Patient Inconnu',
      medecinName: r.medecin?.user?.nomComplet || 'Médecin Inconnu',
      createdAt: r.createdAt?.toISO() || null,
      updatedAt: r.updatedAt?.toISO() || null,
      // Toujours inclure les informations de base du patient
      patient: r.patient ? {
        id: r.patient.id,
        name: r.patient.user?.nomComplet || 'Patient Inconnu',
        nomComplet: r.patient.user?.nomComplet || 'Patient Inconnu',
        numeroPatient: r.patient.numeroPatient || null,
      } : null,
      // Toujours inclure les informations de base du médecin
      medecin: r.medecin ? {
        id: r.medecin.id,
        name: r.medecin.user?.nomComplet || 'Médecin Inconnu',
        nomComplet: r.medecin.user?.nomComplet || 'Médecin Inconnu',
        userId: r.medecin.userId || null,
        user: r.medecin.user ? {
          id: r.medecin.user.id,
          nomComplet: r.medecin.user.nomComplet || 'Médecin Inconnu',
        } : null,
      } : null,
    }

    if (detailed) {
      return {
        ...baseData,
        patient: r.patient ? {
          id: r.patient.id,
          name: r.patient.user?.nomComplet || 'Patient Inconnu',
          numeroPatient: r.patient.numeroPatient || null,
          email: r.patient.user?.email || null,
          phone: r.patient.user?.telephone || null,
          avatar: r.patient.user?.photoProfil || null,
        } : null,
        medecin: r.medecin ? {
          id: r.medecin.id,
          name: r.medecin.user?.nomComplet || 'Médecin Inconnu',
          email: r.medecin.user?.email || null,
        } : null,
      }
    }

    return baseData
  }
}

