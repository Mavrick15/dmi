import { BaseTransformer } from './BaseTransformer.js'
import type RendezVous from '#models/RendezVous'
import type Patient from '#models/Patient'
import type Document from '#models/Document'
import type Medicament from '#models/Medicament'
import type Analyse from '#models/Analyse'

/**
 * Transformer pour les données du Dashboard
 * Structure et organise les données du dashboard de manière cohérente
 */
export class DashboardTransformer extends BaseTransformer {
  /**
   * Transforme les données brutes du dashboard en structure organisée
   */
  static transform(data: {
    totalPatients: any
    activePatients?: any
    appointmentsToday: any
    monthlyRevenue: any
    urgentAlerts: any
    todaysAppointmentsList: RendezVous[]
    revenueChart: any
    recentPatients: Patient[]
    pendingDocuments: Document[]
    consultationsToday: any
    lowStockMedications: Medicament[]
    totalUsers?: any
    activeUsers?: any
    criticalPatients?: any
    analysesPending?: any
    analysesToday?: any
    analysesCritical?: any
    recentAnalyses?: Analyse[]
  }): any {
    const transformer = new DashboardTransformer()
    
    return {
      success: true,
      metrics: transformer.transformMetrics(data),
      appointments: transformer.transformAppointments(data.todaysAppointmentsList),
      charts: transformer.transformCharts(data.revenueChart),
      widgets: {
        recentPatients: transformer.transformRecentPatients(data.recentPatients),
        pendingTasks: {
          documents: transformer.transformPendingDocuments(data.pendingDocuments),
          count: Array.isArray(data.pendingDocuments) ? data.pendingDocuments.length : 0
        },
        systemAlerts: {
          lowStock: transformer.transformLowStock(data.lowStockMedications),
          count: Array.isArray(data.lowStockMedications) ? data.lowStockMedications.length : 0
        },
        analyses: {
          recent: transformer.transformRecentAnalyses(data.recentAnalyses || []),
          count: Array.isArray(data.recentAnalyses) ? data.recentAnalyses.length : 0
        }
      },
      // Compatibilité avec l'ancien format
      recentPatients: transformer.transformRecentPatients(data.recentPatients),
      pendingTasks: {
        documents: transformer.transformPendingDocuments(data.pendingDocuments),
        count: Array.isArray(data.pendingDocuments) ? data.pendingDocuments.length : 0
      },
      alerts: {
        lowStock: transformer.transformLowStock(data.lowStockMedications),
        count: Array.isArray(data.lowStockMedications) ? data.lowStockMedications.length : 0
      },
      revenueChart: transformer.transformCharts(data.revenueChart).revenue,
      medicalStats: {
        consultationsToday: transformer.extractCount(data.consultationsToday),
        patientsWaiting: transformer.extractCount(data.appointmentsToday),
        urgentCases: transformer.extractCount(data.urgentAlerts),
        criticalPatients: transformer.extractCount(data.criticalPatients || {})
      },
      statistics: {
        consultationsToday: transformer.extractCount(data.consultationsToday),
        totalUsers: transformer.extractCount(data.totalUsers || {}),
        activeUsers: transformer.extractCount(data.activeUsers || {}),
        criticalPatients: transformer.extractCount(data.criticalPatients || {}),
        analysesPending: transformer.extractCount(data.analysesPending || {}),
        analysesToday: transformer.extractCount(data.analysesToday || {}),
        analysesCritical: transformer.extractCount(data.analysesCritical || {})
      }
    }
  }

  /**
   * Transforme les métriques principales
   */
  private transformMetrics(data: any): any {
    const metrics = {
      patients: this.extractCount(data.activePatients || data.totalPatients), // Patients actifs par défaut (pour compatibilité)
      activePatients: this.extractCount(data.activePatients || data.totalPatients), // Patients actifs
      totalPatients: this.extractCount(data.totalPatients), // Total patients
      appointments: this.extractCount(data.appointmentsToday),
      appointmentsToday: this.extractCount(data.appointmentsToday), // Alias pour compatibilité
      revenue: this.extractSum(data.monthlyRevenue),
      monthlyRevenue: this.extractSum(data.monthlyRevenue), // Alias pour compatibilité
      alerts: this.extractCount(data.urgentAlerts),
      urgentAlerts: this.extractCount(data.urgentAlerts), // Alias pour compatibilité
      consultationsToday: this.extractCount(data.consultationsToday),
      totalUsers: this.extractCount(data.totalUsers || {}),
      activeUsers: this.extractCount(data.activeUsers || {}),
      criticalPatients: this.extractCount(data.criticalPatients || {}),
      analysesPending: this.extractCount(data.analysesPending || {}),
      analysesToday: this.extractCount(data.analysesToday || {}),
      analysesCritical: this.extractCount(data.analysesCritical || {})
    }
    
    return metrics
  }

  /**
   * Transforme la liste des rendez-vous
   */
  private transformAppointments(appointments: RendezVous[]): any[] {
    if (!Array.isArray(appointments)) return []
    
    return appointments.map(apt => {
      const hasConsultation = (apt as any).hasConsultation || false
      const baseStatus = apt.statut === 'programme' ? 'pending' : 
                        apt.statut === 'en_cours' ? 'confirmed' :
                        apt.statut === 'termine' ? 'completed' : 'cancelled'
      
      return {
        id: apt.id,
        patientId: apt.patientId,
        patientName: apt.patient?.user?.nomComplet || 'Patient inconnu',
        patient: {
          id: apt.patient?.id,
          name: apt.patient?.user?.nomComplet || 'Inconnu'
        },
        medecinId: apt.medecinId,
        medecinName: apt.medecin?.user?.nomComplet || 'Médecin inconnu',
        medecin: {
          id: apt.medecin?.id,
          name: apt.medecin?.user?.nomComplet || 'N/A'
        },
        dateHeure: apt.dateHeure?.toISO(),
        time: apt.dateHeure?.toFormat('HH:mm'),
        date: apt.dateHeure?.toISODate(),
        motif: apt.motif || 'Consultation',
        type: apt.motif || 'Consultation',
        statut: apt.statut,
        status: hasConsultation ? 'consulted' : baseStatus,
        priorite: apt.priorite || 'normale',
        priority: apt.priorite || 'normale',
        duration: apt.dureeMinutes || 30,
        dureeMinutes: apt.dureeMinutes || 30,
        hasConsultation: hasConsultation,
        notes: apt.notes || null,
        room: apt.salle || 'Non assignée'
      }
    })
  }

  /**
   * Transforme les données du graphique de revenus
   */
  private transformCharts(revenueChart: any): any {
    if (!revenueChart || !revenueChart.rows) return { revenue: [] }
    
    return {
      revenue: revenueChart.rows.map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue || 0)
      }))
    }
  }

  /**
   * Transforme les patients récents
   */
  private transformRecentPatients(patients: Patient[]): any[] {
    if (!Array.isArray(patients)) return []
    
    return patients.map(p => ({
      id: p.id,
      name: p.user?.nomComplet || 'Patient inconnu',
      numeroPatient: p.numeroPatient,
      createdAt: p.createdAt?.toISO() || this.formatDate(p.createdAt),
      avatar: p.user?.photoProfil || null
    }))
  }

  /**
   * Transforme les documents en attente
   */
  private transformPendingDocuments(documents: Document[]): any[] {
    if (!Array.isArray(documents)) return []
    
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      patientId: doc.patientId,
      patientName: doc.patient?.user?.nomComplet || 'Patient inconnu',
      createdAt: doc.createdAt?.toISO() || this.formatDate(doc.createdAt),
      status: 'pending' // Les documents en attente n'ont pas de statut dans le modèle
    }))
  }

  /**
   * Transforme les alertes de stock faible
   */
  private transformLowStock(medications: Medicament[]): any[] {
    if (!Array.isArray(medications)) return []
    
    return medications.map(med => ({
      id: med.id,
      name: med.nom,
      stockActuel: med.stockActuel,
      stockMinimum: med.stockMinimum,
      unite: 'unité' // Valeur par défaut car le modèle n'a pas cette propriété
    }))
  }

  /**
   * Transforme les analyses récentes
   */
  private transformRecentAnalyses(analyses: Analyse[]): any[] {
    if (!Array.isArray(analyses)) return []
    
    return analyses.map(analyse => ({
      id: analyse.id,
      numeroAnalyse: analyse.numeroAnalyse,
      typeAnalyse: analyse.typeAnalyse,
      statut: analyse.statut,
      priorite: analyse.priorite || 'normale',
      datePrescription: analyse.datePrescription?.toISO() || this.formatDate(analyse.datePrescription),
      patient: {
        id: analyse.patient?.id,
        name: analyse.patient?.user?.nomComplet || 'Patient inconnu'
      },
      medecin: {
        id: analyse.medecin?.id,
        name: analyse.medecin?.user?.nomComplet || 'Médecin inconnu'
      }
    }))
  }

  /**
   * Extrait le count d'un résultat de query Lucid
   */
  private extractCount(result: any): number {
    if (!result) return 0
    
    // Si c'est un tableau vide
    if (Array.isArray(result) && result.length === 0) return 0
    
    // Si c'est un tableau avec des résultats Lucid
    if (Array.isArray(result) && result[0]) {
      // Lucid stocke les résultats de count/sum dans $extras
      if (result[0].$extras?.total !== undefined) {
        return parseInt(result[0].$extras.total, 10) || 0
      }
      // Fallback pour d'autres formats
      if (result[0].total !== undefined) {
        return parseInt(result[0].total, 10) || 0
      }
      if (result[0].count !== undefined) {
        return parseInt(result[0].count, 10) || 0
      }
    }
    
    // Si c'est directement un nombre
    if (typeof result === 'number') return result
    
    // Si c'est un objet avec total
    if (result.total !== undefined) {
      return parseInt(result.total, 10) || 0
    }
    
    return 0
  }

  /**
   * Extrait la somme d'un résultat de query Lucid
   */
  private extractSum(result: any): number {
    if (!result) return 0
    
    // Si c'est un tableau vide
    if (Array.isArray(result) && result.length === 0) return 0
    
    // Si c'est un tableau avec des résultats Lucid
    if (Array.isArray(result) && result[0]) {
      // Lucid stocke les résultats de count/sum dans $extras
      if (result[0].$extras?.total !== undefined) {
        return parseFloat(result[0].$extras.total) || 0
      }
      // Fallback pour d'autres formats
      if (result[0].total !== undefined) {
        return parseFloat(result[0].total) || 0
      }
      if (result[0].sum !== undefined) {
        return parseFloat(result[0].sum) || 0
      }
    }
    
    // Si c'est directement un nombre
    if (typeof result === 'number') return result
    
    // Si c'est un objet avec total
    if (result.total !== undefined) {
      return parseFloat(result.total) || 0
    }
    
    return 0
  }
}

