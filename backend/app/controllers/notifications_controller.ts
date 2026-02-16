import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Notification from '#models/Notification'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'
import { DateTime } from 'luxon'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { AppException } from '../exceptions/AppException.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { markNotificationReadValidator } from '#validators/notification'

export default class NotificationsController {
  /**
   * Récupérer toutes les notifications de l'utilisateur
   * @route GET /api/v1/notifications
   * @access Authentifié
   * 
   * Règles de visibilité :
   * - Admin et Gestionnaire : voient TOUTES les notifications (peu importe le userId)
   * - Médecin, Infirmière, Pharmacien : voient UNIQUEMENT leurs notifications (userId = leur id)
   */
  public async index({ auth, request, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }
    const { unread_only = false, category = null } = request.qs()
    const { page, limit } = PaginationHelper.fromQueryString(request, 50, 100)

    // Déterminer si l'utilisateur peut voir toutes les notifications
    const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'

    const query = Notification.query()
      .where('is_archived', false)
      .orderBy('created_at', 'desc')

    // Filtrer selon le rôle
    if (canSeeAllNotifications) {
      // Admin et Gestionnaire : voir toutes les notifications (partagées et individuelles)
      // Pas de filtre nécessaire - ils voient tout
    } else {
      // Médecin, Infirmière, Pharmacien, etc. : voir leurs notifications individuelles ET les notifications partagées qui les concernent
      query.where((builder) => {
        builder
          .where('user_id', user.id) // Notifications individuelles
          .orWhere((subBuilder) => {
            // Notifications partagées où l'utilisateur est dans sharedWith
            subBuilder
              .whereNull('user_id') // Notifications partagées (userId = null)
              .whereRaw("metadata->>'isShared' = 'true'")
              .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
          })
      })
    }

    if (unread_only === 'true' || unread_only === true) {
      query.where('is_read', false)
    }

    if (category) {
      query.where('category', category)
    }

    const notifications = await query.paginate(page, limit)

    // Calculer le nombre de notifications non lues selon le rôle
    const unreadQuery = Notification.query()
      .where('is_archived', false)
    
    if (canSeeAllNotifications) {
      // Admin et Gestionnaire : compter toutes les notifications non lues
      unreadQuery.where('is_read', false)
    } else {
      // Pour les autres utilisateurs : compter les notifications individuelles non lues
      // ET les notifications partagées où l'utilisateur n'a pas encore lu
      unreadQuery.where((builder) => {
        builder
          .where((subBuilder) => {
            // Notifications individuelles non lues
            subBuilder
              .where('user_id', user.id)
              .where('is_read', false)
          })
          .orWhere((subBuilder) => {
            // Notifications partagées où l'utilisateur n'est pas dans readBy
            subBuilder
              .whereNull('user_id')
              .whereRaw("metadata->>'isShared' = 'true'")
              .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
              .where((readBySubBuilder) => {
                // Soit readBy est null/vide, soit l'utilisateur n'est pas dans readBy
                readBySubBuilder
                  .whereRaw("metadata->'readBy' IS NULL")
                  .orWhereRaw("metadata->'readBy' = '[]'::jsonb")
                  .orWhereRaw("NOT (metadata->'readBy' @> ?)", [JSON.stringify([user.id])])
              })
          })
      })
    }

    const unreadCount = await unreadQuery
      .count('* as total')
      .then(result => Number(result[0]?.$extras.total || 0))

    // Enrichir les notifications avec des noms lisibles au lieu d'UUIDs
    const notificationsData = await Promise.all(
      notifications.all().map(async (n) => {
        const enrichedMetadata = await this.enrichMetadata(n.metadata)
        const enrichedTarget = n.targetId ? await this.resolveTargetId(n.targetId, n.targetType) : null
        const enrichedUserId = n.userId ? await this.resolveUserId(n.userId) : null

        return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      category: n.category,
      targetId: n.targetId,
      targetType: n.targetType,
          targetDisplay: enrichedTarget, // Nom lisible de la cible
      actionUrl: n.actionUrl,
      isRead: n.isRead,
          metadata: enrichedMetadata, // Métadonnées enrichies avec noms lisibles
          userId: n.userId,
          userDisplay: enrichedUserId, // Nom lisible de l'utilisateur
      time: this.formatTime(n.createdAt),
      createdAt: n.createdAt.toISO(),
        }
      })
    )

    return response.json(
      ApiResponse.paginated(
        notificationsData,
        notifications.currentPage,
        notifications.perPage,
        notifications.total,
        { unread_count: unreadCount }
      )
    )
  }

  /**
   * Marquer une notification comme lue
   * @route PATCH /api/v1/notifications/:id/read
   * @access Authentifié
   */
  public async markAsRead({ auth, params, request, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }
    
    // Validation UUID du paramètre id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      throw AppException.badRequest('Format UUID invalide pour l\'ID de la notification')
    }
    
    try {
      const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'
      
      const query = Notification.query().where('id', params.id)
      
      // Filtrer selon le rôle
      if (!canSeeAllNotifications) {
        query.where((builder) => {
          builder
            .where('user_id', user.id) // Notifications individuelles
            .orWhere((subBuilder) => {
              // Notifications partagées où l'utilisateur est dans sharedWith
              subBuilder
                .whereNull('user_id')
                .whereRaw("metadata->>'isShared' = 'true'")
                .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
            })
        })
      }
      
      const notification = await query.firstOrFail()

      // Gérer les notifications partagées différemment
      const isShared = notification.metadata?.isShared === true
      const sharedWith = notification.metadata?.sharedWith || []
      const readBy = notification.metadata?.readBy || []

      if (isShared) {
        // Pour les notifications partagées, ajouter l'utilisateur à readBy
        if (!notification.metadata) {
          notification.metadata = {}
        }
        
        if (!Array.isArray(readBy)) {
          notification.metadata.readBy = []
        }
        
        if (!readBy.includes(user.id)) {
          notification.metadata.readBy = [...readBy, user.id]
          
          // Si tous les utilisateurs concernés ont lu, marquer la notification comme lue
          const allRead = sharedWith.every((uid: string) => 
            notification.metadata!.readBy.includes(uid)
          )
          
          if (allRead) {
            notification.isRead = true
            notification.readAt = DateTime.now()
          }
          
          await notification.save()
        } else {
          // Déjà lue par cet utilisateur
          return response.json(ApiResponse.success(null, undefined))
        }
      } else {
        // Notification individuelle classique
        if (notification.isRead) {
          return response.json(ApiResponse.success(null, undefined))
        }
        await notification.markAsRead()
      }

      return response.json(ApiResponse.success(null, 'Notification marquée comme lue'))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Notification')
      }
      logger.error({ err: error }, 'Erreur lors du marquage de la notification comme lue')
      throw AppException.internal('Erreur technique lors du marquage.')
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   * @route PATCH /api/v1/notifications/read-all
   * @access Authentifié
   * 
   * Règles :
   * - Admin et Gestionnaire : marquent toutes les notifications comme lues
   * - Médecin, Infirmière, Pharmacien : marquent uniquement leurs notifications comme lues
   */
  public async markAllAsRead({ auth, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'
    
    // Pour les notifications individuelles
    const individualQuery = Notification.query()
      .where('is_read', false)
      .where('is_archived', false)
      .whereNotNull('user_id')
    
    if (!canSeeAllNotifications) {
      individualQuery.where('user_id', user.id)
    }

    const updatedIndividualResult = await individualQuery.update({
      is_read: true,
      read_at: DateTime.now().toSQL(),
      updated_at: DateTime.now().toSQL()
    })
    const updatedIndividual = Array.isArray(updatedIndividualResult) ? updatedIndividualResult.length : (typeof updatedIndividualResult === 'number' ? updatedIndividualResult : 0)

    // Pour les notifications partagées, ajouter l'utilisateur à readBy
    const sharedQuery = Notification.query()
      .where('is_archived', false)
      .whereNull('user_id')
      .whereRaw("metadata->>'isShared' = 'true'")
      .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
      .whereRaw("NOT (metadata->'readBy' @> ?)", [JSON.stringify([user.id])])

    if (canSeeAllNotifications) {
      // Pour les admins, traiter toutes les notifications partagées
      const sharedNotifications = await Notification.query()
        .where('is_archived', false)
        .whereNull('user_id')
        .whereRaw("metadata->>'isShared' = 'true'")
        .exec()

      let updatedSharedCount = 0
      for (const notif of sharedNotifications) {
        if (!notif.metadata) {
          notif.metadata = {}
        }
        const readBy = notif.metadata.readBy || []
        if (!readBy.includes(user.id)) {
          notif.metadata.readBy = [...readBy, user.id]
          
          const sharedWith = notif.metadata.sharedWith || []
          const allRead = sharedWith.every((uid: string) => 
            notif.metadata!.readBy.includes(uid)
          )
          
          if (allRead) {
            notif.isRead = true
            notif.readAt = DateTime.now()
          }
          
          await notif.save()
          updatedSharedCount++
        }
      }
      
      return response.json(
        ApiResponse.success(
          { count: updatedIndividual + updatedSharedCount },
          `${updatedIndividual + updatedSharedCount} notification(s) marquée(s) comme lue(s)`
        )
      )
    } else {
      // Pour les autres utilisateurs, traiter uniquement leurs notifications partagées
      const sharedNotifications = await sharedQuery.exec()
      
      let updatedSharedCount = 0
      for (const notif of sharedNotifications) {
        const readBy = notif.metadata?.readBy || []
        if (!readBy.includes(user.id)) {
          notif.metadata = notif.metadata || {}
          notif.metadata.readBy = [...readBy, user.id]
          
          const sharedWith = notif.metadata.sharedWith || []
          const allRead = sharedWith.every((uid: string) => 
            notif.metadata!.readBy.includes(uid)
          )
          
          if (allRead) {
            notif.isRead = true
            notif.readAt = DateTime.now()
          }
          
          await notif.save()
          updatedSharedCount++
        }
      }
      
      return response.json(
        ApiResponse.success(
          { count: updatedIndividual + updatedSharedCount },
          `${updatedIndividual + updatedSharedCount} notification(s) marquée(s) comme lue(s)`
        )
      )
    }
  }

  /**
   * Marquer plusieurs notifications comme lues en batch
   * @route PATCH /api/v1/notifications/mark-multiple
   * @access Authentifié
   */
  public async markMultipleAsRead({ auth, request, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    const { notificationIds } = request.only(['notificationIds'])

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw AppException.badRequest('La liste des IDs de notifications est requise')
    }

    try {
      const NotificationService = (await import('#services/NotificationService')).default
      const result = await NotificationService.markMultipleAsRead(notificationIds, user.id)

      return response.json(
        ApiResponse.success(
          { count: result.count },
          `${result.count} notification(s) marquée(s) comme lue(s)`
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors du marquage multiple des notifications')
      throw AppException.internal('Erreur lors du marquage des notifications')
    }
  }

  /**
   * Archiver une notification
   * @route DELETE /api/v1/notifications/:id
   * @access Authentifié
   * 
   * Règles :
   * - Admin et Gestionnaire : peuvent archiver n'importe quelle notification
   * - Médecin, Infirmière, Pharmacien : peuvent archiver uniquement leurs notifications
   */
  public async archive({ auth, params, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }
    
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID de la notification')
      }

      const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'
      
      const query = Notification.query().where('id', params.id)
      
      // Filtrer selon le rôle
      if (!canSeeAllNotifications) {
        query.where((builder) => {
          builder
            .where('user_id', user.id) // Notifications individuelles
            .orWhere((subBuilder) => {
              // Notifications partagées où l'utilisateur est dans sharedWith
              subBuilder
                .whereNull('user_id')
                .whereRaw("metadata->>'isShared' = 'true'")
                .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
            })
        })
      }
      
      const notification = await query.firstOrFail()

      // Pour les notifications partagées, on peut les archiver individuellement pour cet utilisateur
      // en les retirant de sharedWith, ou les archiver complètement si c'est un admin
      const isShared = notification.metadata?.isShared === true
      
      if (isShared && !canSeeAllNotifications) {
        // Pour les utilisateurs non-admin, retirer l'utilisateur de sharedWith au lieu d'archiver complètement
        if (!notification.metadata) {
          notification.metadata = {}
        }
        const sharedWith = notification.metadata.sharedWith || []
        notification.metadata.sharedWith = sharedWith.filter((uid: string) => uid !== user.id)
        
        // Si plus personne n'est concerné, archiver complètement
        if (notification.metadata.sharedWith.length === 0) {
          await notification.archive()
        } else {
          await notification.save()
        }
      } else {
        // Notification individuelle ou admin qui archive complètement
        await notification.archive()
      }

      return response.json(ApiResponse.success(null, 'Notification archivée'))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Notification')
      }
      logger.error({ err: error }, 'Erreur lors de l\'archivage de la notification')
      throw AppException.internal('Erreur technique lors de l\'archivage.')
    }
  }

  /**
   * Archiver toutes les notifications lues
   * @route DELETE /api/v1/notifications/archive-read
   * @access Authentifié
   * 
   * Règles :
   * - Admin et Gestionnaire : peuvent archiver toutes les notifications lues
   * - Médecin, Infirmière, Pharmacien : peuvent archiver uniquement leurs notifications lues
   */
  public async archiveAllRead({ auth, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'
    
    // Archiver les notifications individuelles lues
    const individualQuery = Notification.query()
      .where('is_read', true)
      .where('is_archived', false)
      .whereNotNull('user_id')
    
    if (!canSeeAllNotifications) {
      individualQuery.where('user_id', user.id)
    }

    const updatedIndividualResult = await individualQuery.update({
      is_archived: true,
      updated_at: DateTime.now().toSQL()
    })
    const updatedIndividual = Array.isArray(updatedIndividualResult) ? updatedIndividualResult.length : (typeof updatedIndividualResult === 'number' ? updatedIndividualResult : 0)

    // Pour les notifications partagées, retirer l'utilisateur de sharedWith s'il a lu
    const sharedQuery = Notification.query()
      .where('is_archived', false)
      .whereNull('user_id')
      .whereRaw("metadata->>'isShared' = 'true'")
      .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
      .whereRaw("metadata->'readBy' @> ?", [JSON.stringify([user.id])])

    if (canSeeAllNotifications) {
      // Pour les admins, archiver toutes les notifications partagées lues
      const sharedNotifications = await Notification.query()
        .where('is_read', true)
        .where('is_archived', false)
        .whereNull('user_id')
        .whereRaw("metadata->>'isShared' = 'true'")
        .exec()

      let archivedSharedCount = 0
      for (const notif of sharedNotifications) {
        await notif.archive()
        archivedSharedCount++
      }
      
      return response.json(
        ApiResponse.success(
          { count: updatedIndividual + archivedSharedCount },
          `${updatedIndividual + archivedSharedCount} notification(s) lue(s) archivée(s)`
        )
      )
    } else {
      // Pour les autres utilisateurs, retirer de sharedWith au lieu d'archiver complètement
      const sharedNotifications = await sharedQuery.exec()
      
      let archivedSharedCount = 0
      for (const notif of sharedNotifications) {
        if (!notif.metadata) {
          notif.metadata = {}
        }
        const sharedWith = notif.metadata.sharedWith || []
        notif.metadata.sharedWith = sharedWith.filter((uid: string) => uid !== user.id)
        
        // Si plus personne n'est concerné, archiver complètement
        if (notif.metadata.sharedWith.length === 0) {
          await notif.archive()
        } else {
          await notif.save()
        }
        archivedSharedCount++
      }
      
      return response.json(
        ApiResponse.success(
          { count: updatedIndividual + archivedSharedCount },
          `${updatedIndividual + archivedSharedCount} notification(s) lue(s) archivée(s)`
        )
      )
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   * @route GET /api/v1/notifications/unread-count
   * @access Authentifié
   * 
   * Règles de visibilité :
   * - Admin et Gestionnaire : comptent TOUTES les notifications non lues
   * - Médecin, Infirmière, Pharmacien : comptent UNIQUEMENT leurs notifications non lues
   */
  public async unreadCount({ auth, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    // Déterminer si l'utilisateur peut voir toutes les notifications
    const canSeeAllNotifications = user.role === 'admin' || user.role === 'gestionnaire'

    // Compter les notifications non lues (individuelles + partagées)
    const query = Notification.query()
      .where('is_archived', false)

    if (canSeeAllNotifications) {
      // Admin et Gestionnaire : compter toutes les notifications non lues
      query.where('is_read', false)
    } else {
      // Pour les autres utilisateurs : compter les notifications individuelles non lues
      // ET les notifications partagées où l'utilisateur n'a pas encore lu
      query.where((builder) => {
        builder
          .where((subBuilder) => {
            // Notifications individuelles non lues
            subBuilder
              .where('user_id', user.id)
              .where('is_read', false)
          })
          .orWhere((subBuilder) => {
            // Notifications partagées où l'utilisateur n'est pas dans readBy
            subBuilder
              .whereNull('user_id')
              .whereRaw("metadata->>'isShared' = 'true'")
              .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([user.id])])
              .where((readBySubBuilder) => {
                // Soit readBy est null/vide, soit l'utilisateur n'est pas dans readBy
                readBySubBuilder
                  .whereRaw("metadata->'readBy' IS NULL")
                  .orWhereRaw("metadata->'readBy' = '[]'::jsonb")
                  .orWhereRaw("NOT (metadata->'readBy' @> ?)", [JSON.stringify([user.id])])
              })
          })
      })
    }

    const count = await query
      .count('* as total')
      .then(result => Number(result[0]?.$extras.total || 0))

    return response.json(ApiResponse.success({ count }))
  }

  /**
   * Créer des notifications de test (pour développement)
   * @route POST /api/v1/notifications/test
   * @access Authentifié
   */
  public async createTestNotifications({ auth, response }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    const testNotifications = [
      {
        userId: user.id,
        type: 'info' as const,
        title: 'Bienvenue sur MediCore',
        message: 'Votre compte a été configuré avec succès. Explorez les différentes fonctionnalités disponibles.',
        category: 'system',
        isRead: false,
        isArchived: false,
      },
      {
        userId: user.id,
        type: 'success' as const,
        title: 'Rendez-vous confirmé',
        message: 'Votre rendez-vous avec Dr. Martin est confirmé pour le 25 janvier 2024 à 14h00.',
        category: 'appointment',
        targetId: 'test-appointment-1',
        targetType: 'appointment',
        actionUrl: '/console-clinique?appointment=test-appointment-1',
        isRead: false,
        isArchived: false,
      },
      {
        userId: user.id,
        type: 'warning' as const,
        title: 'Stock faible',
        message: 'Le médicament Paracétamol 500mg a un stock critique (5 unités restantes).',
        category: 'pharmacy',
        targetId: 'test-medication-1',
        targetType: 'medication',
        actionUrl: '/operations-pharmacie?medication=test-medication-1',
        isRead: false,
        isArchived: false,
      },
      {
        userId: user.id,
        type: 'critical' as const,
        title: 'Rendez-vous urgent',
        message: 'Un rendez-vous urgent avec M. Dupont a été programmé pour aujourd\'hui à 16h00.',
        category: 'appointment',
        targetId: 'test-appointment-2',
        targetType: 'appointment',
        actionUrl: '/console-clinique?appointment=test-appointment-2',
        isRead: false,
        isArchived: false,
      },
    ]

    try {
      await Notification.createMany(testNotifications)
      return response.json(
        ApiResponse.success(
          { count: testNotifications.length },
          `${testNotifications.length} notifications de test créées avec succès`
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la création des notifications de test')
      throw AppException.internal('Erreur lors de la création des notifications de test')
    }
  }

  /**
   * Formater le temps relatif
   */
  private formatTime(dateTime: DateTime): string {
    const now = DateTime.now()
    const diff = now.diff(dateTime)

    const minutes = Math.floor(diff.as('minutes'))
    const hours = Math.floor(diff.as('hours'))
    const days = Math.floor(diff.as('days'))

    if (minutes < 1) {
      return 'À l\'instant'
    } else if (minutes < 60) {
      return `${minutes} min`
    } else if (hours < 24) {
      return `${hours} h`
    } else if (days < 7) {
      return `${days} j`
    } else {
      return dateTime.toFormat('dd/MM/yyyy')
    }
  }

  /**
   * Valide si une chaîne est un UUID valide
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  /**
   * Résout un UUID d'utilisateur en nom lisible
   */
  private async resolveUserId(userId: string): Promise<string | null> {
    if (!this.isValidUUID(userId)) {
      return userId
    }

    try {
      const user = await UserProfile.find(userId)
      if (user) {
        return user.nomComplet || user.email || null
      }
    } catch (error) {
      logger.debug({ userId, err: error }, 'Impossible de résoudre userId pour notification')
    }
    return null
  }

  /**
   * Résout un targetId en nom lisible selon le type
   */
  private async resolveTargetId(targetId: string, targetType: string | null): Promise<string | null> {
    if (!targetId || !this.isValidUUID(targetId)) {
      return targetId || null
    }

    try {
      if (targetType === 'patient') {
        const patient = await Patient.find(targetId)
        if (patient) {
          await patient.load('user')
          return patient.user?.nomComplet || patient.numeroPatient || null
        }
      } else if (targetType === 'document') {
        // Les documents utilisent des IDs numériques, pas des UUIDs
        return targetId
      } else {
        // Pour les autres types, essayer de trouver un utilisateur
        const user = await UserProfile.find(targetId)
        if (user) {
          return user.nomComplet || user.email || null
        }
      }
    } catch (error) {
      logger.debug({ targetId, targetType, err: error }, 'Impossible de résoudre targetId pour notification')
    }
    return null
  }

  /**
   * Enrichit les métadonnées en remplaçant les UUIDs par des noms lisibles
   */
  private async enrichMetadata(metadata: Record<string, any> | null): Promise<Record<string, any> | null> {
    if (!metadata || typeof metadata !== 'object') {
      return metadata
    }

    const enriched: Record<string, any> = { ...metadata }

    // Liste des clés qui peuvent contenir des UUIDs à résoudre
    const uuidKeys = ['patientId', 'uploadedBy', 'createdBy', 'userId', 'medecinId', 'doctorId', 'approvedBy', 'signedBy', 'assignedDoctorId']

    for (const key of uuidKeys) {
      if (enriched[key] && typeof enriched[key] === 'string' && this.isValidUUID(enriched[key])) {
        try {
          if (key === 'patientId') {
            const patient = await Patient.find(enriched[key])
            if (patient) {
              await patient.load('user')
              enriched[`${key}Display`] = patient.user?.nomComplet || patient.numeroPatient || enriched[key]
            }
          } else {
            // Pour les autres clés, chercher un utilisateur
            const user = await UserProfile.find(enriched[key])
            if (user) {
              enriched[`${key}Display`] = user.nomComplet || user.email || enriched[key]
            }
          }
        } catch (error) {
          logger.debug({ key, value: enriched[key], err: error }, 'Impossible de résoudre UUID dans métadonnées')
        }
      }
    }

    return enriched
  }
}

