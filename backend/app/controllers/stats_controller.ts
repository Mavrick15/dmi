import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Patient from '#models/Patient'
import RendezVous from '#models/RendezVous'
import Consultation from '#models/Consultation'
import Facture from '#models/Facture'
import Medicament from '#models/Medicament'
import UserProfile from '#models/UserProfile'
import Department from '#models/department'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { StatsTransformer } from '../transformers/StatsTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

/**
 * Contrôleur pour les statistiques avancées (Centre analytique).
 * Pas de cache Redis : données toujours fraîches.
 */
export default class StatsController {
  /**
   * Statistiques générales de l'application
   * @route GET /api/v1/stats/overview
   * @access Admin, Gestionnaire
   */
  async overview({ response }: HttpContext) {
    try {
      const today = DateTime.now()
      const startOfMonth = today.startOf('month')
      const startOfYear = today.startOf('year')

      const [
        totalPatients,
        totalUsers,
        totalMedications,
        totalConsultations,
        monthlyRevenue,
        yearlyRevenue,
        activeAppointments,
        lowStockMedications,
      ] = await Promise.all([
      Patient.query().count('* as total'),
      UserProfile.query().where('actif', true).count('* as total'),
      Medicament.query().count('* as total'),
      Consultation.query()
        .where('date_consultation', '>=', startOfMonth.toSQL())
        .count('* as total'),
      Facture.query()
        .where('created_at', '>=', startOfMonth.toSQL())
        .sum('montant_total as total'),
      Facture.query()
        .where('created_at', '>=', startOfYear.toSQL())
        .sum('montant_total as total'),
      RendezVous.query()
        .where('statut', 'programme')
        .where('date_heure', '>=', today.toSQL())
        .count('* as total'),
      Medicament.query()
        .whereRaw('stock_actuel <= stock_minimum')
        .count('* as total'),
    ])

      const transformedStats = StatsTransformer.transformOverview({
        totalPatients,
        totalUsers,
        totalMedications,
        totalConsultations,
        monthlyRevenue,
        yearlyRevenue,
        activeAppointments,
        lowStockMedications,
      })
      return response.json(ApiResponse.success(transformedStats))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques générales')
      throw AppException.internal('Erreur lors du chargement des statistiques générales.')
    }
  }

  /**
   * Statistiques par période
   * @route GET /api/v1/stats/period
   * @access Admin, Gestionnaire
   */
  async period({ request, response }: HttpContext) {
    try {
      const { start, end, type = 'daily' } = request.only(['start', 'end', 'type'])

      if (!start || !end) {
        return response.badRequest({
          success: false,
          message: 'Les dates de début et de fin sont requises',
        })
      }

      const startDate = DateTime.fromISO(start)
      const endDate = DateTime.fromISO(end)

      if (!startDate.isValid || !endDate.isValid) {
        return response.badRequest({
          success: false,
          message: 'Format de date invalide',
        })
      }

      let dateFormat = 'YYYY-MM-DD'
      if (type === 'monthly') dateFormat = 'YYYY-MM'
      if (type === 'yearly') dateFormat = 'YYYY'

      const stats = await db.rawQuery(`
        WITH period_data AS (
          SELECT 
            TO_CHAR(date_consultation, :format) as period,
            patient_id
          FROM consultations
          WHERE date_consultation >= :start AND date_consultation <= :end
        )
        SELECT 
          period,
          COUNT(*) as consultations,
          COUNT(DISTINCT patient_id) as unique_patients
        FROM period_data
        GROUP BY period
        ORDER BY period ASC
      `, {
        format: dateFormat,
        start: startDate.toSQL(),
        end: endDate.toSQL(),
      })

      return response.json({
        success: true,
        data: stats.rows,
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques par période')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des statistiques par période.'
      })
    }
  }

  /**
   * Top médecins par nombre de consultations
   * @route GET /api/v1/stats/top-doctors
   * @access Admin, Gestionnaire
   */
  async topDoctors({ request, response }: HttpContext) {
    try {
      const { limit } = PaginationHelper.validateAndNormalize(undefined, request.input('limit'), 10, 50)
      const startDate = request.input('start')
      const endDate = request.input('end')

    let query = db.rawQuery(`
      SELECT 
        m.id,
        up.nom_complet as name,
        COUNT(c.id) as consultations_count,
        COUNT(DISTINCT c.patient_id) as patients_count
      FROM consultations c
      JOIN medecins m ON c.medecin_id = m.id
      JOIN user_profiles up ON m.user_id = up.id
    `)

    const conditions: string[] = []
    const params: any = { limit }

    if (startDate) {
      conditions.push('c.date_consultation >= :start')
      params.start = DateTime.fromISO(startDate).toSQL()
    }

    if (endDate) {
      conditions.push('c.date_consultation <= :end')
      params.end = DateTime.fromISO(endDate).toSQL()
    }

    if (conditions.length > 0) {
      query = db.rawQuery(`
        SELECT 
          m.id,
          up.nom_complet as name,
          COUNT(c.id) as consultations_count,
          COUNT(DISTINCT c.patient_id) as patients_count
        FROM consultations c
        JOIN medecins m ON c.medecin_id = m.id
        JOIN user_profiles up ON m.user_id = up.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY m.id, up.nom_complet
        ORDER BY consultations_count DESC
        LIMIT :limit
      `, params)
    } else {
      query = db.rawQuery(`
        SELECT 
          m.id,
          up.nom_complet as name,
          COUNT(c.id) as consultations_count,
          COUNT(DISTINCT c.patient_id) as patients_count
        FROM consultations c
        JOIN medecins m ON c.medecin_id = m.id
        JOIN user_profiles up ON m.user_id = up.id
        GROUP BY m.id, up.nom_complet
        ORDER BY consultations_count DESC
        LIMIT :limit
      `, params)
    }

      const result = await query

      return response.json({
        success: true,
        data: result.rows,
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques des top médecins')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des statistiques des médecins.'
      })
    }
  }

  /**
   * Statistiques de revenus par période
   * @route GET /api/v1/stats/revenue
   * @access Admin, Gestionnaire
   */
  async revenue({ request, response }: HttpContext) {
    try {
      const { period = 'monthly', start, end } = request.only(['period', 'start', 'end'])

      let dateFormat = 'YYYY-MM'
      if (period === 'daily') dateFormat = 'YYYY-MM-DD'
      if (period === 'yearly') dateFormat = 'YYYY'

      // Construire la requête avec GROUP BY correct
      // PostgreSQL exige que toutes les colonnes non agrégées soient dans le GROUP BY
      // On doit utiliser l'expression complète dans GROUP BY et ORDER BY, pas l'alias
      const periodExpr = `TO_CHAR(date_emission, '${dateFormat}')`
      
      let query = `
        SELECT 
          ${periodExpr} as period,
          SUM(montant_total) as total_revenue,
          SUM(montant_paye) as paid_amount,
          COUNT(*) as invoices_count
        FROM factures
      `

      const conditions: string[] = []
      const params: any = {}

      if (start) {
        const startDate = DateTime.fromISO(start)
        if (!startDate.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de début invalide',
          })
        }
        conditions.push('date_emission >= :start')
        params.start = startDate.toSQL()
      }

      if (end) {
        const endDate = DateTime.fromISO(end)
        if (!endDate.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de fin invalide',
          })
        }
        conditions.push('date_emission <= :end')
        params.end = endDate.toSQL()
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      // Utiliser l'expression complète dans GROUP BY et ORDER BY (pas l'alias)
      query += `
        GROUP BY ${periodExpr}
        ORDER BY ${periodExpr} ASC
      `

      const result = await db.rawQuery(query, params)

      return response.json({
        success: true,
        data: result.rows.map((row: any) => ({
          period: row.period,
          totalRevenue: parseFloat(row.total_revenue) || 0,
          paidAmount: parseFloat(row.paid_amount) || 0,
          pendingAmount: parseFloat(row.total_revenue) - parseFloat(row.paid_amount),
          invoicesCount: parseInt(row.invoices_count) || 0,
        })),
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques de revenus')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des statistiques de revenus.'
      })
    }
  }

  /**
   * Statistiques par département
   * @route GET /api/v1/stats/departments
   * @access Admin, Gestionnaire
   */
  async departments({ request, response }: HttpContext) {
    try {
      const { start, end } = request.only(['start', 'end', 'startDate', 'endDate'])
      
      // Utiliser start/end ou startDate/endDate pour compatibilité
      const startDate = start || request.input('startDate')
      const endDate = end || request.input('endDate')

      let query = `
        SELECT 
          d.id,
          d.nom as name,
          d.code,
          d.couleur as fill,
          COUNT(DISTINCT c.id) as consultations,
          COUNT(DISTINCT c.patient_id) as patients,
          COUNT(DISTINCT m.id) as doctors_count,
          COALESCE(SUM(f.montant_total), 0) as revenue
        FROM departments d
        LEFT JOIN medecins m ON m.department_id = d.id
        LEFT JOIN consultations c ON c.medecin_id = m.id
        LEFT JOIN factures f ON f.consultation_id = c.id
      `

      const conditions: string[] = ['d.actif = true']
      const params: any = {}

      if (startDate) {
        conditions.push('(c.date_consultation IS NULL OR c.date_consultation >= :start)')
        params.start = DateTime.fromISO(startDate).toSQL()
      }

      if (endDate) {
        conditions.push('(c.date_consultation IS NULL OR c.date_consultation <= :end)')
        params.end = DateTime.fromISO(endDate).toSQL()
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`
      }

      query += `
        GROUP BY d.id, d.nom, d.code, d.couleur
        HAVING COUNT(DISTINCT c.id) > 0 OR COUNT(DISTINCT m.id) > 0
        ORDER BY consultations DESC, d.nom ASC
      `

      const result = await db.rawQuery(query, params)

      // Calculer le total pour les pourcentages
      const totalConsultations = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.consultations || 0), 0)
      const totalRevenue = result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.revenue || 0), 0)

      const departments = result.rows.map((row: any) => {
        const consultations = parseInt(row.consultations) || 0
        const revenue = parseFloat(row.revenue) || 0
        const percentage = totalConsultations > 0 ? ((consultations / totalConsultations) * 100).toFixed(1) : '0'

        return {
          id: row.id,
          name: row.name,
          code: row.code,
          fill: row.fill || '#3B82F6',
          value: consultations,
          consultations: consultations,
          patients: parseInt(row.patients) || 0,
          doctorsCount: parseInt(row.doctors_count) || 0,
          revenue: revenue,
          revenuePercentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0',
          percentage: percentage,
          tooltipData: {
            consultations: consultations,
            revenue: revenue,
            patients: parseInt(row.patients) || 0,
            doctors: parseInt(row.doctors_count) || 0,
            percentage: percentage
          }
        }
      })

      return response.json({
        success: true,
        data: departments,
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques par département')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des statistiques par département.'
      })
    }
  }
}

