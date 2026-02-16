import { BaseTransformer } from './BaseTransformer.js'

/**
 * Transformer pour les statistiques
 * Structure et organise les données statistiques de manière cohérente
 */
export class StatsTransformer extends BaseTransformer {
  /**
   * Transforme les statistiques générales
   */
  static transformOverview(data: {
    totalPatients: any
    totalUsers: any
    totalMedications: any
    totalConsultations: any
    monthlyRevenue: any
    yearlyRevenue: any
    activeAppointments: any
    lowStockMedications: any
  }): any {
    const transformer = new StatsTransformer()
    
    return {
      patients: {
        total: transformer.extractCount(data.totalPatients),
      },
      users: {
        total: transformer.extractCount(data.totalUsers),
      },
      pharmacy: {
        totalMedications: transformer.extractCount(data.totalMedications),
        lowStock: transformer.extractCount(data.lowStockMedications),
      },
      consultations: {
        thisMonth: transformer.extractCount(data.totalConsultations),
      },
      appointments: {
        upcoming: transformer.extractCount(data.activeAppointments),
      },
      revenue: {
        thisMonth: transformer.extractSum(data.monthlyRevenue),
        thisYear: transformer.extractSum(data.yearlyRevenue),
      },
    }
  }

  /**
   * Extrait le count d'un résultat de query Lucid
   */
  private extractCount(result: any): number {
    if (!result) return 0
    if (Array.isArray(result) && result[0]) {
      if (result[0].$extras?.total !== undefined) {
        return parseInt(result[0].$extras.total, 10) || 0
      }
      if (result[0].total !== undefined) {
        return parseInt(result[0].total, 10) || 0
      }
    }
    if (typeof result === 'number') return result
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
    if (Array.isArray(result) && result[0]) {
      if (result[0].$extras?.total !== undefined) {
        return parseFloat(result[0].$extras.total) || 0
      }
      if (result[0].total !== undefined) {
        return parseFloat(result[0].total) || 0
      }
    }
    if (typeof result === 'number') return result
    if (result.total !== undefined) {
      return parseFloat(result.total) || 0
    }
    return 0
  }
}

