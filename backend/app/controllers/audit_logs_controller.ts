// openclinic/backend/app/controllers/audit_logs_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import ActivityLog from '#models/ActivityLog'
import { DateTime } from 'luxon'
import { PaginationHelper } from '../utils/PaginationHelper.js'

export default class AuditLogsController {
  
  /**
   * 0. Créer une nouvelle entrée de log d'audit
   * Endpoint utilisé par le frontend pour enregistrer des actions
   */
  public async store({ request, response, auth }: HttpContext) {
    try {
      const { action, resourceId, description } = request.only([
        'action',
        'resourceId',
        'description'
      ])

      if (!action || !description) {
        return response.badRequest({
          success: false,
          message: 'Action et description sont requis'
        })
      }

      // Créer le log
      const log = await ActivityLog.create({
        type: action,
        description: description,
        targetId: resourceId || null,
        userId: auth.user?.id || null
      })

      return response.created({
        success: true,
        message: 'Log d\'audit créé avec succès',
        data: log
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création du log d\'audit')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la création du log d\'audit.'
      })
    }
  }

  /**
   * 1. Liste paginée et filtrée de toutes les activités.
   * Sert à l'onglet "Audit" de l'administration.
   */
  public async index({ request, response }: HttpContext) {
    try {
      const { page, limit } = PaginationHelper.fromRequest(request, 15, 100)
      const search = request.input('search')
      const actionType = request.input('actionType') // Ex: 'patient_added', 'user_login'
      const dateFrom = request.input('dateFrom')

      const query = ActivityLog.query()
        .preload('user', (q) => q.select('nomComplet', 'role')) // Utilisateur effectuant l'action
        .orderBy('createdAt', 'desc')

      if (search) {
        query.where((q) => {
          q.where('description', 'ilike', `%${search}%`)
           .orWhere('type', 'ilike', `%${search}%`)
           .orWhereHas('user', (userQuery) => {
             userQuery.where('nomComplet', 'ilike', `%${search}%`)
           })
        })
      }

      if (actionType && actionType !== 'all') {
        query.where('type', actionType)
      }

      if (dateFrom) {
        // Filtrer à partir du début du jour spécifié
        const dateFromParsed = DateTime.fromISO(dateFrom)
        if (!dateFromParsed.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date invalide pour dateFrom'
          })
        }
        query.where('createdAt', '>=', dateFromParsed.startOf('day').toSQL())
      }

      const logs = await query.paginate(page, limit)

      const formattedLogs = logs.all().map(log => {
        // Extraire le type d'action depuis le type
        const actionType = log.type
        let actionCategory = 'Autre'
        let actionIcon = 'Activity'
        
        if (actionType.includes('created') || actionType.includes('_create')) {
          actionCategory = 'Création'
          actionIcon = 'PlusCircle'
        } else if (actionType.includes('updated') || actionType.includes('_update')) {
          actionCategory = 'Modification'
          actionIcon = 'Edit'
        } else if (actionType.includes('deleted') || actionType.includes('_delete')) {
          actionCategory = 'Suppression'
          actionIcon = 'Trash2'
        } else if (actionType.includes('login')) {
          actionCategory = 'Connexion'
          actionIcon = 'LogIn'
        } else if (actionType.includes('logout')) {
          actionCategory = 'Déconnexion'
          actionIcon = 'LogOut'
        }

        // Extraire le type de ressource
        const resourceType = actionType.split('_')[0] || 'unknown'
        const resourceTypeLabels: Record<string, string> = {
          'user': 'Utilisateur',
          'patient': 'Patient',
          'document': 'Document',
          'facture': 'Facture',
          'consultation': 'Consultation',
          'rendezvous': 'Rendez-vous',
          'prescription': 'Prescription',
          'medicament': 'Médicament',
          'transaction': 'Transaction',
          'establishment': 'Établissement'
        }

        return {
          id: log.id,
          timestamp: log.createdAt.toFormat('yyyy-MM-dd HH:mm:ss'),
          date: log.createdAt.toFormat('dd/MM/yyyy'),
          time: log.createdAt.toFormat('HH:mm:ss'),
          user: log.user?.nomComplet || 'Système',
          userRole: log.user?.role || 'System',
          action: log.description,
          actionType: actionType,
          actionCategory: actionCategory,
          actionIcon: actionIcon,
          resourceType: resourceTypeLabels[resourceType] || resourceType,
          target: log.targetId ? log.targetId : null,
          targetIdShort: log.targetId ? log.targetId.substring(0, 8) : 'N/A',
          // Statut basé sur le type
          status: actionType.includes('error') || actionType.includes('failed') ? 'Failed' : 'Success',
          level: actionType.includes('admin') || actionType.includes('user') || actionType.includes('delete') ? 'high' : 'low'
        }
      })

      return response.json({
        success: true,
        meta: logs.getMeta(),
        data: formattedLogs
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des logs d\'audit')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des logs d\'audit.'
      })
    }
  }
}
