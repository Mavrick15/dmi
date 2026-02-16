import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'
import Etablissement from '#models/Etablissement'
import RendezVous from '#models/RendezVous'
import Consultation from '#models/Consultation'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import CacheService from '#services/CacheService'

export default class AdminStatsController {
  
  public async overview({ response }: HttpContext) {
    try {
      const cacheKey = 'admin:stats:overview'
      const cached = await CacheService.getAsync(cacheKey)
      if (cached !== undefined) {
        return response.json(ApiResponse.success(cached))
      }

      const [
        totalUsers,
        activeUsers,
        totalPatients,
        activePatients,
        totalEstablishments,
        activeEstablishments,
        todayAppointments,
        todayConsultations,
        recentUsers,
        recentPatients
      ] = await Promise.all([
        // Utilisateurs
        UserProfile.query().whereNotIn('role', ['patient']).count('* as total'),
        UserProfile.query().whereNotIn('role', ['patient']).where('actif', true).count('* as total'),
        
        // Patients
        Patient.query().count('* as total'),
        db.rawQuery(`
          SELECT COUNT(*) as total 
          FROM patients p
          INNER JOIN user_profiles up ON p.user_id = up.id
          WHERE up.actif = true
        `),
        
        // Établissements
        Etablissement.query().count('* as total'),
        Etablissement.query().where('actif', true).count('* as total'),
        
        // Activité du jour
        RendezVous.query().whereRaw('DATE(date_heure) = CURRENT_DATE').count('* as total'),
        Consultation.query().whereRaw('DATE(date_consultation) = CURRENT_DATE').count('* as total'),
        
        // Récents (7 derniers jours)
        UserProfile.query()
          .whereNotIn('role', ['patient'])
          .where('date_creation', '>=', DateTime.now().minus({ days: 7 }).toSQLDate())
          .count('* as total'),
        Patient.query()
          .where('created_at', '>=', DateTime.now().minus({ days: 7 }).toSQLDate())
          .count('* as total')
      ])

      // Statistiques par rôle
      const usersByRole = await UserProfile.query()
        .whereNotIn('role', ['patient'])
        .select('role')
        .count('* as count')
        .groupBy('role')

      // Statistiques par type d'établissement
      const establishmentsByType = await Etablissement.query()
        .select('type_etablissement')
        .count('* as count')
        .groupBy('type_etablissement')

      // Activité des 30 derniers jours
      const activityLast30Days = await db.rawQuery(`
        SELECT 
          DATE(date_creation) as date,
          COUNT(*) as count
        FROM (
          SELECT date_creation FROM user_profiles WHERE role != 'patient'
          UNION ALL
          SELECT created_at as date_creation FROM patients
          UNION ALL
          SELECT created_at as date_creation FROM etablissements
        ) as all_activity
        WHERE date_creation >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(date_creation)
        ORDER BY date ASC
      `)

      const data = {
        users: {
          total: Number(totalUsers[0].$extras.total),
          active: Number(activeUsers[0].$extras.total),
          recent: Number(recentUsers[0].$extras.total),
          byRole: usersByRole.map((u: any) => ({
            role: u.role,
            count: Number(u.$extras.count)
          }))
        },
        patients: {
          total: Number(totalPatients[0].$extras.total),
          active: Number(activePatients.rows[0]?.total || 0),
          recent: Number(recentPatients[0].$extras.total)
        },
        establishments: {
          total: Number(totalEstablishments[0].$extras.total),
          active: Number(activeEstablishments[0].$extras.total),
          byType: establishmentsByType.map((e) => ({
            type: e.typeEtablissement,
            count: Number(e.$extras.count)
          }))
        },
        activity: {
          todayAppointments: Number(todayAppointments[0].$extras.total),
          todayConsultations: Number(todayConsultations[0].$extras.total),
          last30Days: activityLast30Days.rows.map((row: any) => ({
            date: row.date,
            count: Number(row.count)
          }))
        }
      }
      await CacheService.setAsync(cacheKey, data, 120)
      return response.json(ApiResponse.success(data))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques admin')
      throw AppException.internal('Erreur lors de la récupération des statistiques')
    }
  }
}

