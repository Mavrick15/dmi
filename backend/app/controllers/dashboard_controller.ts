// openclinic/backend/app/controllers/dashboard_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import Patient from '#models/Patient'
import RendezVous from '#models/RendezVous'
import Facture from '#models/Facture'
import Consultation from '#models/Consultation'
import Document from '#models/Document'
import Medicament from '#models/Medicament'
import Medecin from '#models/Medecin'
import UserProfile from '#models/UserProfile'
import Analyse from '#models/Analyse'
import { DashboardTransformer } from '../transformers/DashboardTransformer.js'
import { AppException } from '../exceptions/AppException.js'
import { ApiResponse } from '../utils/ApiResponse.js'

export default class DashboardController {
  /**
   * Récupérer les données du dashboard
   * @route GET /api/v1/dashboard
   * @access Authentifié
   * @param {HttpContext} ctx - Contexte HTTP
   * @returns {Promise<Response>} Données du dashboard (toujours fraîches, pas de cache)
   */
  public async index({ response, auth }: HttpContext) {
    // Récupérer l'utilisateur authentifié
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    // Déterminer si l'utilisateur est admin
    const isAdmin = user.role === 'admin'
    
    // Si l'utilisateur est docteur, récupérer son profil médecin
    // Optimisation : Charger le médecin une seule fois et le réutiliser
    let medecinId: string | null = null
    let medecin: Medecin | null = null
    if (['docteur_clinique', 'docteur_labo'].includes(user.role)) {
      medecin = await Medecin.findBy('userId', user.id)
      if (medecin) {
        medecinId = medecin.id
      } else {
        // Si le docteur n'a pas de profil Medecin, logger un avertissement
        logger.warn({ userId: user.id, role: user.role }, 'Docteur sans profil Medecin associé')
      }
    }

    // Pas de cache : données toujours fraîches (statuts, RDV, analyses, etc.)
    const today = DateTime.now().toSQLDate()
    const startOfMonth = DateTime.now().startOf('month').toSQLDate()

    let totalPatients, activePatients, appointmentsToday, monthlyRevenue, urgentAlerts, todaysAppointmentsList, revenueChart, 
        recentPatients, pendingDocuments, consultationsToday, lowStockMedications, totalUsers, activeUsers, criticalPatients,
        analysesPending, analysesToday, analysesCritical, recentAnalyses;

    try {
      // On récupère tout en parallèle
      const results = await Promise.all([
      // 1. Compte total patients
      Patient.query().count('* as total'),

      // 1b. Compte patients actifs (via UserProfile avec actif=true)
      UserProfile.query()
        .where('role', 'patient')
        .where('actif', true)
        .count('* as total'),

      // 2. RDV ce jour (filtré par médecin si non-admin)
      (() => {
        const query = RendezVous.query()
          .whereRaw('DATE(date_heure) = ?', [today]);
        if (!isAdmin && medecinId) {
          query.where('medecinId', medecinId);
        }
        return query.count('* as total');
      })(),

      // 3. Revenus du mois
      Facture.query()
        .where('created_at', '>=', startOfMonth)
        .sum('montant_total as total'),

      // 4. Alertes (RDV urgents non terminés) (filtré par médecin si non-admin)
      (() => {
        const query = RendezVous.query()
          .where('priorite', 'urgente')
          .andWhereNot('statut', 'termine');
        if (!isAdmin && medecinId) {
          query.where('medecinId', medecinId);
        }
        return query.count('* as total');
      })(),

      // 5. Liste détaillée des 5 prochains RDV du jour avec vérification des consultations
      (async () => {
        const appointmentsQuery = RendezVous.query()
          .whereRaw('DATE(date_heure) = ?', [today])
          .preload('patient', (q) => q.preload('user'))
          .preload('medecin', (q) => q.preload('user'))
          .orderBy('date_heure', 'asc');
        
        // Si l'utilisateur n'est pas admin et est un docteur, filtrer par son medecinId
        if (!isAdmin && ['docteur_clinique', 'docteur_labo'].includes(user.role)) {
          if (medecinId) {
            appointmentsQuery.where('medecinId', medecinId);
          } else {
            // Si le docteur n'a pas de profil Medecin, ne retourner aucun rendez-vous
            logger.warn({ userId: user.id }, 'Docteur sans profil Medecin - aucun rendez-vous retourné');
            return [];
          }
        }
        // Si admin, pas de filtre (voir tous les rendez-vous)
        
        const appointments = await appointmentsQuery.limit(5).exec();
        
        // Log pour débogage
        logger.info({ 
          userRole: user.role, 
          isAdmin, 
          medecinId, 
          appointmentsCount: appointments.length 
        }, 'Rendez-vous récupérés pour le dashboard');
        
        // Vérifier pour chaque rendez-vous s'il a une consultation associée
        const appointmentIds = appointments.map(a => a.id);
        const consultations = appointmentIds.length > 0 
          ? await Consultation.query()
              .whereIn('rendez_vous_id', appointmentIds)
              .exec()
          : [];
        
        const consultationMap = new Map(consultations.map(c => [c.rendezVousId, c]));
        
        // Ajouter l'information de consultation à chaque rendez-vous
        return appointments.map(apt => {
          (apt as any).hasConsultation = consultationMap.has(apt.id);
          return apt;
        });
      })(),

      // 6. Graphique (SQL Brut Postgres)
      db.rawQuery(`
        SELECT 
          TO_CHAR(created_at, 'Mon') as month, 
          SUM(montant_total) as revenue
        FROM factures 
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `),
      
      // 7. Patients récents (derniers patients créés - 7 derniers jours)
      (async () => {
        return Patient.query()
          .where('created_at', '>=', DateTime.now().minus({ days: 7 }).toSQLDate())
          .orderBy('created_at', 'desc')
          .limit(5)
          .preload('user')
          .exec();
      })(),

      // 8. Documents en attente de signature
      Document.query()
        .where('category', 'ordonnance')
        .orWhere('category', 'prescription')
        .preload('patient', (q) => q.preload('user'))
        .orderBy('created_at', 'desc')
        .limit(5),

      // 9. Consultations du jour (statistiques)
      // IMPORTANT: compteur global sur tous les médecins (pas de filtre rôle)
      // Requête SQL explicite pour éviter tout problème de mapping ORM/colonne.
      (async () => {
        const result: any = await db.rawQuery(`
          SELECT COUNT(*) as total
          FROM consultations
          WHERE DATE(COALESCE(date_consultation, created_at)) = CURRENT_DATE
        `)
        return [{ $extras: { total: Number.parseInt(result.rows[0]?.total || 0, 10) } }]
      })(),

      // 10. Médicaments en rupture de stock
      Medicament.query()
        .whereRaw('stock_actuel <= stock_minimum')
        .limit(5),

      // 11. Total utilisateurs (staff uniquement, pas les patients)
      UserProfile.query()
        .whereNotIn('role', ['patient'])
        .count('* as total'),

      // 12. Utilisateurs actifs (staff actifs)
      UserProfile.query()
        .whereNotIn('role', ['patient'])
        .where('actif', true)
        .count('* as total'),

      // 13. Patients critiques (avec rendez-vous urgents non terminés)
      (async () => {
        const result: any = await db.rawQuery(`
          SELECT COUNT(DISTINCT p.id) as total
          FROM patients p
          INNER JOIN rendez_vous rv ON rv.patient_id = p.id
          WHERE rv.priorite = 'urgente'
          AND rv.statut != 'termine'
        `)
        // Formater comme les autres résultats Lucid
        return [{ $extras: { total: parseInt(result.rows[0]?.total || 0, 10) } }]
      })(),

      // 14. Analyses en attente (prescrites ou en cours)
      Analyse.query()
        .whereIn('statut', ['prescrite', 'en_cours'])
        .count('* as total'),

      // 15. Analyses terminées aujourd'hui
      Analyse.query()
        .whereRaw('DATE(date_resultat) = ?', [today])
        .where('statut', 'terminee')
        .count('* as total'),

      // 16. Analyses avec résultats critiques
      (async () => {
        const result: any = await db.rawQuery(`
          SELECT COUNT(DISTINCT a.id) as total
          FROM analyses a
          INNER JOIN resultats_analyse ra ON ra.analyse_id = a.id
          WHERE ra.interpretation = 'critique'
          AND a.statut = 'terminee'
        `)
        return [{ $extras: { total: parseInt(result.rows[0]?.total || 0, 10) } }]
      })(),

      // 17. Analyses récentes (5 dernières analyses en attente)
      Analyse.query()
        .whereIn('statut', ['prescrite', 'en_cours'])
        .preload('patient', (q) => q.preload('user'))
        .preload('medecin', (q) => q.preload('user'))
        .orderBy('date_prescription', 'desc')
        .limit(5)
      ]);

      // Assignation des résultats
      [
        totalPatients,
        activePatients,
        appointmentsToday,
        monthlyRevenue,
        urgentAlerts,
        todaysAppointmentsList,
        revenueChart,
        recentPatients,
        pendingDocuments,
        consultationsToday,
        lowStockMedications,
        totalUsers,
        activeUsers,
        criticalPatients,
        analysesPending,
        analysesToday,
        analysesCritical,
        recentAnalyses
      ] = results;

    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des données du dashboard')
      throw AppException.internal(
        'Erreur lors du chargement des données du tableau de bord.',
        process.env.NODE_ENV === 'development' ? error.message : undefined
      )
    }

    // Utiliser le transformer pour structurer les données
    const transformedData = DashboardTransformer.transform({
      totalPatients,
      activePatients,
      appointmentsToday,
      monthlyRevenue,
      urgentAlerts,
      todaysAppointmentsList: Array.isArray(todaysAppointmentsList) ? todaysAppointmentsList : [],
      revenueChart,
      recentPatients: Array.isArray(recentPatients) ? recentPatients : [],
      pendingDocuments: Array.isArray(pendingDocuments) ? pendingDocuments : [],
      consultationsToday,
      lowStockMedications: Array.isArray(lowStockMedications) ? lowStockMedications : [],
      totalUsers,
      activeUsers,
      criticalPatients,
      analysesPending,
      analysesToday,
      analysesCritical,
      recentAnalyses: Array.isArray(recentAnalyses) ? recentAnalyses : []
    })

    // Extraire les données (sans le champ success qui sera ajouté par ApiResponse)
    const { success, ...dashboardData } = transformedData

    response.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.header('Pragma', 'no-cache')
    response.header('Expires', '0')

    return response.json(ApiResponse.success(dashboardData))
  }
}