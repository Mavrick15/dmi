import transmit from '@adonisjs/transmit/services/main'
import mail from '@adonisjs/mail/services/main'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'
import ActivityLog from '#models/ActivityLog'
import Notification from '#models/Notification'
import Consultation from '#models/Consultation'
import AuditService from '#services/AuditService'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

interface NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error' | 'critical'
  email?: boolean
  persistent?: boolean
  actionUrl?: string
  category?: string
  targetId?: string
  targetType?: string
  title?: string
  metadata?: Record<string, any>
  expiresAt?: DateTime | string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  silent?: boolean
  groupKey?: string
}

/**
 * Service amélioré pour gérer les notifications
 */
export default class NotificationService {
  /**
   * Valide si une chaîne est un UUID valide
   */
  private static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  /**
   * Logger une notification dans l'audit avec des informations précises
   */
  private static async logNotificationToAudit(
    notificationType: string,
    title: string,
    message: string,
    recipientIds: string[],
    recipientRoles: string[] | null,
    category: string | null,
    targetId: string | null,
    targetType: string | null,
    createdBy: string | null = null,
    additionalMetadata: Record<string, any> | null = null
  ): Promise<void> {
    try {
      // Récupérer les informations des destinataires pour l'audit
      let recipientInfo = ''
      if (recipientRoles && recipientRoles.length > 0) {
        recipientInfo = `Rôles: ${recipientRoles.join(', ')}`
      } else if (recipientIds.length > 0) {
        const recipients = await UserProfile.query()
          .whereIn('id', recipientIds.slice(0, 10)) // Limiter à 10 pour éviter les requêtes trop longues
          .select('nomComplet', 'email', 'role')
        
        const recipientNames = recipients.map(u => `${u.nomComplet || u.email} (${u.role})`).join(', ')
        recipientInfo = recipientIds.length > 10
          ? `${recipientNames} et ${recipientIds.length - 10} autre(s)`
          : recipientNames
      }

      // Récupérer le nom complet du créateur si un UUID est fourni
      let createdByName = createdBy
      if (createdBy) {
        try {
          const creator = await UserProfile.find(createdBy)
          if (creator) {
            createdByName = creator.nomComplet || creator.email || createdBy
          }
        } catch (error) {
          // Si l'utilisateur n'est pas trouvé, garder l'UUID original
          logger.debug({ createdBy, err: error }, 'Impossible de récupérer le nom du créateur pour l\'audit')
        }
      }

      // Résoudre le targetId en nom lisible si c'est un UUID
      let targetDisplay = targetId
      if (targetId && this.isValidUUID(targetId)) {
        try {
          if (targetType === 'patient') {
            const patient = await Patient.find(targetId)
            if (patient) {
              await patient.load('user')
              targetDisplay = patient.user?.nomComplet || patient.numeroPatient || targetId.substring(0, 8)
            }
          } else if (targetType === 'document') {
            // Pour les documents, on garde juste l'ID numérique (pas un UUID)
            targetDisplay = targetId.substring(0, 8)
          } else {
            // Pour les autres types, essayer de trouver un utilisateur
            const user = await UserProfile.find(targetId)
            if (user) {
              targetDisplay = user.nomComplet || user.email || targetId.substring(0, 8)
            }
          }
        } catch (error) {
          logger.debug({ targetId, targetType, err: error }, 'Impossible de résoudre le targetId pour l\'audit')
        }
      } else if (targetId) {
        // Si ce n'est pas un UUID (ex: ID numérique de document), garder tel quel
        targetDisplay = targetId
      }

      const description = `Notification "${title}" envoyée à ${recipientIds.length} destinataire(s)${recipientInfo ? ` (${recipientInfo})` : ''}${category ? ` | Catégorie: ${category}` : ''}${targetType ? ` | Cible: ${targetType}${targetDisplay ? ` (${targetDisplay})` : ''}` : ''}${createdByName ? ` | Créée par: ${createdByName}` : ''}`

      const metadata = {
        notificationType,
        title,
        message: message.length > 150 ? message.substring(0, 150) + '...' : message,
        recipientCount: recipientIds.length,
        recipientRoles: recipientRoles || null,
        category,
        targetId,
        targetType,
        createdBy,
        timestamp: DateTime.now().toISO(),
        ...(additionalMetadata || {}),
      }

      await AuditService.logAction(
        null, // Pas de contexte HTTP dans NotificationService
        `notification_${notificationType}`,
        description,
        targetId,
        metadata
      )
    } catch (error) {
      // Ne pas faire échouer l'opération principale si l'audit échoue
      logger.error({ err: error, notificationType, title }, 'Erreur lors de l\'enregistrement du log d\'audit pour notification')
    }
  }
  /**
   * Diffuse une notification à tous les utilisateurs connectés (ou un canal spécifique)
   */
  static async sendGlobalAlert(
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) {
    await transmit.broadcast('global_alerts', {
      message,
      type,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Notifie la pharmacie d'une nouvelle commande
   */
  static async notifyPharmacy(orderId: string) {
    await transmit.broadcast('pharmacy_channel', {
      title: 'Nouvelle commande reçue',
      orderId,
      action: 'refresh_inventory',
    })
  }

  /**
   * Créer une notification persistante dans la base de données
   * Amélioré avec validation, gestion d'erreurs et support des notifications groupées
   */
  static async createNotification(
    userId: string | string[],
    title: string,
    message: string,
    options: NotificationOptions = {}
  ) {
    // Validation des paramètres
    if (!title || !message) {
      throw new Error('Le titre et le message sont requis pour créer une notification')
    }

    if (title.length > 200) {
      logger.warn({ title }, 'Titre de notification trop long, tronqué à 200 caractères')
      title = title.substring(0, 200)
    }

    if (message.length > 1000) {
      logger.warn({ message }, 'Message de notification trop long, tronqué à 1000 caractères')
      message = message.substring(0, 1000)
    }

    const {
      type = 'info',
      category = null,
      targetId: rawTargetId = null,
      targetType = null,
      actionUrl = null,
      metadata: originalMetadata = null,
      expiresAt = null,
      priority = 'normal',
      silent = false,
      groupKey = null,
    } = options

    // Valider et convertir targetId en UUID valide ou null
    // La colonne target_id dans la base de données est de type UUID
    let targetId: string | null = null
    let metadata = originalMetadata ? { ...originalMetadata } : {}
    
    if (rawTargetId) {
      const targetIdStr = String(rawTargetId)
      // Vérifier si c'est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(targetIdStr)) {
        targetId = targetIdStr
      } else {
        // Si ce n'est pas un UUID valide, l'ajouter aux métadonnées et mettre targetId à null (colonne UUID en base)
        logger.debug({ targetId: targetIdStr, type: 'notification', category }, 'targetId non-UUID, stocké dans metadata.originalTargetId')
        metadata.originalTargetId = targetIdStr
      }
    }
    
    // Normaliser metadata (null si vide, sinon l'objet)
    const finalMetadataForOptions = Object.keys(metadata).length > 0 ? metadata : null

    const userIds = Array.isArray(userId) ? userId : [userId]

    // Filtrer les IDs invalides
    const validUserIds = userIds.filter((uid) => uid && typeof uid === 'string')
    
    if (validUserIds.length === 0) {
      logger.warn('Aucun utilisateur valide pour la notification')
      return { success: false, message: 'Aucun utilisateur valide' }
    }

    // Vérifier si les utilisateurs existent (optimisation)
    const existingUsers = await UserProfile.query()
      .whereIn('id', validUserIds)
      .where('actif', true)
    
    let activeUserIds = existingUsers.map((u) => u.id)
    
    if (activeUserIds.length === 0) {
      logger.warn({ userIds: validUserIds }, 'Aucun utilisateur actif trouvé pour la notification')
      return { success: false, message: 'Aucun utilisateur actif' }
    }

    // Gérer les notifications groupées (éviter les doublons)
    // Note: targetId peut être null si ce n'est pas un UUID valide
    if (groupKey) {
      // Vérifier pour CHAQUE utilisateur s'il a déjà une notification avec ce groupKey
      const query = Notification.query()
        .where('category', category || '')
        .whereIn('userId', activeUserIds)
        .where('isRead', false)
        .where('isArchived', false)
        .whereRaw("metadata->>'groupKey' = ?", [groupKey])
      
      // Ajouter la condition targetId seulement si c'est un UUID valide
      if (targetId) {
        query.where('targetId', targetId)
      } else {
        query.whereNull('targetId')
      }
      
      const existingGrouped = await query.exec()
      
      if (existingGrouped.length > 0) {
        // Filtrer les utilisateurs qui ont déjà une notification
        const usersWithNotification = existingGrouped.map(n => n.userId)
        const usersWithoutNotification = activeUserIds.filter(uid => !usersWithNotification.includes(uid))
        
        // Mettre à jour les notifications existantes
        for (const notification of existingGrouped) {
          notification.title = title
          notification.message = message
          notification.type = type
          notification.updatedAt = DateTime.now()
          await notification.save()
        
        // Diffuser la mise à jour via canal partagé
        if (!silent) {
            try {
              const sharedChannel = category ? `shared_${category}_notifications` : 'shared_notifications'
              await transmit.broadcast(sharedChannel, {
                type: 'update',
                notificationId: notification.id,
                title,
                message,
                category,
                actionUrl,
                sharedWith: activeUserIds, // Liste des utilisateurs concernés
                timestamp: new Date().toISOString(),
              })
            } catch (broadcastError) {
              logger.error({ err: broadcastError }, 'Erreur lors de la diffusion SSE de la mise à jour partagée')
            }
          }
        }
        
        // Si tous les utilisateurs ont déjà une notification, ne pas en créer de nouvelles
        if (usersWithoutNotification.length === 0) {
          logger.info({ groupKey, count: existingGrouped.length }, 'Toutes les notifications groupées déjà existantes, aucune nouvelle création')
          return { success: true, notifications: existingGrouped, updated: true, count: existingGrouped.length }
        }
        
        // Ne créer des notifications que pour les utilisateurs qui n'en ont pas encore
        activeUserIds = usersWithoutNotification
        logger.info({ groupKey, existingCount: existingGrouped.length, newCount: usersWithoutNotification.length }, 'Certaines notifications groupées existent, création uniquement pour les utilisateurs sans notification')
      }
    }

    // Préparer les métadonnées avec groupKey si fourni
    const finalMetadata = {
      ...(finalMetadataForOptions || {}),
      ...(groupKey ? { groupKey } : {}),
      priority,
      createdAt: DateTime.now().toISO(),
    }

    // Créer UNE SEULE notification partagée au lieu de plusieurs notifications individuelles
    // Stocker les utilisateurs concernés dans metadata.sharedWith
    const sharedMetadata = {
      ...finalMetadata,
      sharedWith: activeUserIds, // Liste des utilisateurs concernés
      readBy: [], // Liste des utilisateurs qui ont lu cette notification
      isShared: true, // Indicateur que c'est une notification partagée
    }

    const sharedNotification = {
      userId: null, // null pour les notifications partagées
      type,
      title,
      message,
      category,
      targetId,
      targetType,
      actionUrl,
      metadata: sharedMetadata,
      isRead: false,
      isArchived: false,
    }

    try {
      const createdNotification = await Notification.create(sharedNotification)
      const createdNotifications = [createdNotification]

      // Diffuser en temps réel via SSE sur un canal partagé (seulement si pas silencieux)
      // UN SEUL toast partagé au lieu d'envoyer individuellement à chaque utilisateur
      if (!silent) {
        try {
          // Créer un canal partagé basé sur la catégorie ou utiliser un canal global
          const sharedChannel = category ? `shared_${category}_notifications` : 'shared_notifications'
          
          await transmit.broadcast(sharedChannel, {
            type,
            title,
            message,
            category,
            actionUrl,
            targetId,
            targetType,
            priority,
            notificationId: createdNotification.id, // Inclure l'ID de la notification partagée
            sharedNotification: true, // Indicateur que c'est une notification partagée
            sharedWith: activeUserIds, // Liste des utilisateurs concernés
            timestamp: new Date().toISOString(),
          })
          
          logger.info({ channel: sharedChannel, sharedWithCount: activeUserIds.length, type, category }, 'Toast partagé diffusé avec succès')
        } catch (broadcastError) {
          logger.error({ err: broadcastError }, 'Erreur lors de la diffusion SSE du toast partagé')
          // Ne pas faire échouer toute l'opération si la diffusion échoue
        }
      }

      logger.info(
        { count: createdNotifications.length, sharedWithCount: activeUserIds.length, type, category },
        'Notification partagée créée avec succès'
      )

      // Logger dans l'audit avec des informations précises
      const recipientRoles = [...new Set(existingUsers.map(u => u.role))]
      await this.logNotificationToAudit(
        'created',
        title,
        message,
        activeUserIds,
        recipientRoles,
        category,
        targetId,
        targetType,
        null // createdBy sera déterminé par le contexte appelant si disponible
      )

      return { success: true, notifications: createdNotifications, count: createdNotifications.length }
    } catch (error) {
      logger.error({ err: error, userIds: activeUserIds }, 'Erreur lors de la création de la notification')
      throw error
    }
  }

  /**
   * Envoyer une notification en temps réel à un utilisateur (méthode legacy, utilise createNotification)
   */
  static async sendNotification(
    userId: string,
    message: string,
    options: NotificationOptions = {}
  ) {
    const { type = 'info', email = false, persistent = false, actionUrl, title = message } = options

    // Créer notification persistante
    await this.createNotification(userId, title, message, {
      ...options,
      type,
      actionUrl,
    })

    // Envoyer par email si demandé
    if (email) {
      try {
        const user = await UserProfile.find(userId)
        if (user?.email) {
          await mail.send((msg) => {
            msg
              .to(user.email)
              .from(process.env.SMTP_FROM || 'noreply@openclinic.cd')
              .subject(`Notification: ${title.substring(0, 50)}`)
              .html(`
                <h3>Notification OpenClinic</h3>
                <p>${message}</p>
                ${actionUrl ? `<p><a href="${actionUrl}">Voir les détails</a></p>` : ''}
              `)
          })
        }
      } catch (error) {
        logger.error({ err: error }, `Erreur lors de l'envoi de l'email de notification`)
      }
    }

    // Logger l'activité si persistent
    if (persistent) {
      try {
        await ActivityLog.create({
          userId,
          type: 'notification',
          description: message,
        })
      } catch (error) {
        logger.error({ err: error }, 'Erreur lors de la création du log d\'activité')
      }
    }
  }

  /**
   * Notifier plusieurs utilisateurs
   */
  static async broadcastNotification(
    userIds: string[],
    message: string,
    options: NotificationOptions = {}
  ) {
    await Promise.all(userIds.map((userId) => this.sendNotification(userId, message, options)))
  }

  /**
   * Notifier par rôle
   */
  static async notifyByRole(
    roles: string[],
    message: string,
    options: NotificationOptions = {}
  ) {
    const users = await UserProfile.query().whereIn('role', roles).where('actif', true)
    const userIds = users.map((u) => u.id)
    await this.broadcastNotification(userIds, message, options)
  }

  /**
   * Notification de stock faible
   * Notifie uniquement les pharmaciens (leur domaine)
   */
  static async notifyLowStock(medicamentId: string, medicamentName: string) {
    // Notifier uniquement les pharmaciens (leur domaine)
    const pharmacists = await UserProfile.query()
      .where('role', 'pharmacien')
      .where('actif', true)
    const pharmacistIds = pharmacists.map((u) => u.id)

    if (pharmacistIds.length > 0) {
      await this.createNotification(
        pharmacistIds,
        'Stock faible',
        `Le médicament ${medicamentName} a un stock critique`,
        {
          type: 'warning',
          category: 'pharmacy',
          targetId: medicamentId,
          targetType: 'medication',
          actionUrl: `/operations-pharmacie?medication=${medicamentId}`,
          priority: 'high',
        }
      )

      // Logger dans l'audit pour les pharmaciens
      await this.logNotificationToAudit(
        'low_stock',
        'Stock faible',
        `Le médicament ${medicamentName} a un stock critique`,
        pharmacistIds,
        ['pharmacien'],
        'pharmacy',
        medicamentId,
        'medication',
        null,
        {
          medicamentName,
          medicamentId,
        }
      )
    }

    // Notifier aussi les admins/gestionnaires (pour information)
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const adminIds = admins.map((u) => u.id)

    if (adminIds.length > 0) {
      await this.createNotification(
        adminIds,
        'Stock faible en pharmacie',
        `Le médicament ${medicamentName} a un stock critique`,
        {
          type: 'warning',
          category: 'pharmacy',
          targetId: medicamentId,
          targetType: 'medication',
          actionUrl: `/operations-pharmacie?medication=${medicamentId}`,
          priority: 'normal',
          silent: true, // Notification silencieuse pour les admins
        }
      )

      // Logger dans l'audit pour les admins
      await this.logNotificationToAudit(
        'low_stock_admin',
        'Stock faible en pharmacie',
        `Le médicament ${medicamentName} a un stock critique`,
        adminIds,
        ['admin', 'gestionnaire'],
        'pharmacy',
        medicamentId,
        'medication',
        null,
        {
          medicamentName,
          medicamentId,
        }
      )
    }
  }

  /**
   * Notification de mouvement d'inventaire en pharmacie
   * Notifie TOUS les pharmaciens actifs (leur domaine)
   */
  static async notifyInventoryMovement(
    medicamentId: string,
    medicamentName: string,
    movementType: 'entree' | 'sortie' | 'ajustement',
    quantity: number,
    reason: string,
    orderNumber?: string
  ) {
    // Notifier TOUS les pharmaciens actifs (leur domaine)
    const pharmacists = await UserProfile.query()
      .where('role', 'pharmacien')
      .where('actif', true)
    const pharmacistIds = pharmacists.map((u) => u.id)

    if (pharmacistIds.length === 0) {
      logger.warn('Aucun pharmacien actif trouvé pour la notification de mouvement d\'inventaire')
      return
    }

    logger.info(
      { pharmacistCount: pharmacistIds.length, medicamentName, movementType },
      'Notification de mouvement d\'inventaire envoyée à tous les pharmaciens'
    )

    const movementLabels = {
      entree: 'Entrée',
      sortie: 'Sortie',
      ajustement: 'Ajustement',
    }

    const title = `Mouvement d'inventaire - ${movementLabels[movementType]}`
    const sign = movementType === 'entree' ? '+' : movementType === 'sortie' ? '-' : ''
    const message = orderNumber
      ? `${movementLabels[movementType]} de ${Math.abs(quantity)} unité(s) de ${medicamentName} (Commande ${orderNumber})`
      : `${movementLabels[movementType]} de ${Math.abs(quantity)} unité(s) de ${medicamentName}${reason ? ` : ${reason}` : ''}`

    await this.createNotification(
      pharmacistIds,
      title,
      message,
      {
        type: movementType === 'entree' ? 'success' : movementType === 'sortie' ? 'warning' : 'info',
        category: 'pharmacy',
        targetId: medicamentId,
        targetType: 'medication',
        actionUrl: `/operations-pharmacie?medication=${medicamentId}`,
        priority: 'normal',
        metadata: {
          movementType,
          quantity: sign + Math.abs(quantity),
          reason,
          orderNumber,
        },
      }
    )

    // Diffuser aussi via pharmacy_channel pour une notification instantanée à tous les pharmaciens
    try {
      await transmit.broadcast('pharmacy_channel', {
        type: 'inventory_movement',
        title,
        message,
        medicamentId,
        medicamentName,
        movementType,
        quantity: Math.abs(quantity),
        reason,
        orderNumber: orderNumber || undefined,
        actionUrl: `/operations-pharmacie?medication=${medicamentId}`,
        timestamp: new Date().toISOString(),
      } as any)
      logger.info({ medicamentId, movementType, pharmacistCount: pharmacistIds.length }, 'Notification de mouvement d\'inventaire diffusée via pharmacy_channel')
    } catch (broadcastError) {
      logger.error({ err: broadcastError, medicamentId }, 'Erreur lors de la diffusion du mouvement d\'inventaire via pharmacy_channel')
      // Ne pas faire échouer l'opération si la diffusion échoue
    }

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'inventory_movement',
      title,
      message,
      pharmacistIds,
      ['pharmacien'],
      'pharmacy',
      medicamentId,
      'medication',
      null,
      {
        movementType,
        quantity: Math.abs(quantity),
        medicamentName,
        reason,
        orderNumber,
      }
    )
  }

  /**
   * Notification de rendez-vous
   * Notifie uniquement le patient ET le médecin concerné (pas tous les médecins)
   * @param doctorId - ID de UserProfile du médecin (pas l'ID du modèle Medecin)
   */
  static async notifyAppointment(
    patientUserId: string | null,
    appointmentId: string,
    appointmentDate: string,
    doctorName: string,
    doctorUserId: string, // ID de UserProfile du médecin
    patientName: string | null = null, // Nom du patient pour personnaliser le message
    appointmentType: string | null = null // Type de rendez-vous (motif)
  ) {
    // Récupérer le nom du patient si non fourni
    let finalPatientName = patientName
    if (!finalPatientName && patientUserId) {
      try {
        const patient = await Patient.query()
          .where('userId', patientUserId)
          .preload('user')
          .first()
        if (patient?.user) {
          finalPatientName = patient.user.nomComplet || 'Patient'
        }
      } catch (error) {
        logger.debug({ patientUserId, err: error }, 'Impossible de récupérer le nom du patient pour la notification')
      }
    }

    const recipientIds: string[] = []
    const recipientRoles: string[] = []
    
    // Notifier le patient si un userId est fourni
    if (patientUserId) {
      recipientIds.push(patientUserId)
      recipientRoles.push('patient')
      
      // Message personnalisé pour le patient
      const patientMessage = `Vous avez un rendez-vous avec ${doctorName} confirmé pour le ${appointmentDate}`
      
      await this.createNotification(
        patientUserId,
        'Rendez-vous confirmé',
        patientMessage,
        {
          type: 'success',
          category: 'appointment',
          targetId: appointmentId,
          targetType: 'appointment',
          actionUrl: `/console-clinique?appointment=${appointmentId}`,
          priority: 'normal',
          metadata: {
            doctorName,
            appointmentDate,
            patientName: finalPatientName,
          },
        }
      )
    }
    
    // Toujours notifier le médecin concerné (obligatoire)
    if (doctorUserId) {
      // Vérifier que le médecin existe et est actif
      const doctor = await UserProfile.find(doctorUserId)
      if (doctor && doctor.actif) {
        recipientIds.push(doctor.id)
        recipientRoles.push('docteur')
        
        // Message personnalisé pour le médecin
        const appointmentTypeText = appointmentType ? ` pour un(e) ${appointmentType}` : ''
        const doctorMessage = finalPatientName
          ? `Le patient ${finalPatientName} a un rendez-vous avec vous ${doctorName} confirmé pour le ${appointmentDate}${appointmentTypeText}`
          : `Vous avez un rendez-vous confirmé pour le ${appointmentDate}${appointmentTypeText}`

    await this.createNotification(
          doctor.id,
      'Rendez-vous confirmé',
          doctorMessage,
      {
        type: 'success',
        category: 'appointment',
        targetId: appointmentId,
        targetType: 'appointment',
        actionUrl: `/console-clinique?appointment=${appointmentId}`,
        priority: 'normal',
            metadata: {
              doctorName,
              appointmentDate,
              patientName: finalPatientName,
            },
      }
    )
      } else {
        logger.warn({ doctorUserId, doctorName }, 'Médecin non trouvé ou inactif pour la notification de rendez-vous')
      }
    }

    if (recipientIds.length === 0) {
      logger.warn({ patientUserId, doctorUserId, appointmentId }, 'Aucun utilisateur à notifier pour le rendez-vous')
      return
    }

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'appointment_confirmed',
      'Rendez-vous confirmé',
      finalPatientName
        ? `Rendez-vous entre ${finalPatientName} et ${doctorName} confirmé pour le ${appointmentDate}`
        : `Rendez-vous avec ${doctorName} confirmé pour le ${appointmentDate}`,
      recipientIds,
      recipientRoles.length > 0 ? recipientRoles : null,
      'appointment',
      appointmentId,
      'appointment',
      doctorUserId,
      {
        doctorName,
        appointmentDate,
        patientUserId,
        patientName: finalPatientName,
      }
    )
  }

  /**
   * Notification de rendez-vous annulé
   * Notifie uniquement le patient ET le médecin concerné
   * @param doctorUserId - ID de UserProfile du médecin (pas l'ID du modèle Medecin)
   */
  static async notifyAppointmentCancelled(
    patientUserId: string | null,
    appointmentId: string,
    appointmentDate: string,
    doctorName: string,
    doctorUserId: string, // ID de UserProfile du médecin
    reason: string = 'Rendez-vous annulé',
    isAutomatic: boolean = false
  ) {
    const userIds: string[] = []
    
    // Notifier le patient si un userId est fourni
    if (patientUserId) {
      userIds.push(patientUserId)
    }
    
    // Toujours notifier le médecin concerné (obligatoire)
    // doctorUserId est déjà l'ID de UserProfile, pas besoin de chercher
    if (doctorUserId) {
      // Vérifier que le médecin existe et est actif
      const doctor = await UserProfile.find(doctorUserId)
      if (doctor && doctor.actif) {
        userIds.push(doctor.id)
      } else {
        logger.warn({ doctorUserId, doctorName }, 'Médecin non trouvé ou inactif pour la notification d\'annulation')
      }
    }

    const title = isAutomatic 
      ? 'Rendez-vous annulé automatiquement'
      : 'Rendez-vous annulé'
    
    const message = isAutomatic
      ? `Votre rendez-vous avec ${doctorName} prévu le ${appointmentDate} a été annulé automatiquement : ${reason}`
      : `Votre rendez-vous avec ${doctorName} prévu le ${appointmentDate} a été annulé. ${reason}`

    await this.createNotification(
      userIds,
      title,
      message,
      {
        type: 'warning',
        category: 'appointment',
        targetId: appointmentId,
        targetType: 'appointment',
        actionUrl: `/console-clinique?appointment=${appointmentId}`,
        metadata: { 
          cancelled: true,
          automatic: isAutomatic,
          reason,
          appointmentDate,
        },
      }
    )

    if (userIds.length === 0) {
      logger.warn({ patientUserId, doctorUserId, appointmentId }, 'Aucun utilisateur à notifier pour l\'annulation du rendez-vous')
      return
    }

    // Logger dans l'audit avec informations précises
    const recipientRoles = []
    if (patientUserId) recipientRoles.push('patient')
    if (doctorUserId) recipientRoles.push('docteur')
    
    await this.logNotificationToAudit(
      'appointment_cancelled',
      title,
      message,
      userIds,
      recipientRoles.length > 0 ? recipientRoles : null,
      'appointment',
      appointmentId,
      'appointment',
      doctorUserId,
      {
        doctorName,
        appointmentDate,
        reason,
        isAutomatic,
        patientUserId,
      }
    )
  }

  /**
   * Notification de nouveau patient
   * Notifie uniquement les admins et gestionnaires (pas tous les médecins)
   */
  static async notifyNewPatient(patientId: string, patientName: string, createdBy: string) {
    // Notifier uniquement les admins et gestionnaires
    const users = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const userIds = users.map((u) => u.id)

    await this.createNotification(
      userIds,
      'Nouveau patient enregistré',
      `${patientName} a été ajouté au système`,
      {
        type: 'info',
        category: 'patient',
        targetId: patientId,
        targetType: 'patient',
        actionUrl: `/gestion-patients?patient=${patientId}`,
        metadata: { createdBy },
      }
    )

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'new_patient',
      'Nouveau patient enregistré',
      `${patientName} a été ajouté au système`,
      userIds,
      ['admin', 'gestionnaire'],
      'patient',
      patientId,
      'patient',
      createdBy,
      {
        patientName,
        createdBy,
      }
    )
  }

  /**
   * Notification de rendez-vous urgent
   * Notifie TOUS les médecins pour les notifications critiques + admins/gestionnaires
   * @param doctorUserId - ID de UserProfile du médecin assigné (optionnel, pour les métadonnées)
   */
  static async notifyUrgentAppointment(
    appointmentId: string,
    patientName: string,
    doctorUserId: string, // ID de UserProfile du médecin assigné
    appointmentTime: string
  ) {
    const userIds: string[] = []
    
    // Notifier TOUS les médecins pour les notifications critiques
    const doctors = await UserProfile.query()
      .whereIn('role', ['docteur'])
      .where('actif', true)
    userIds.push(...doctors.map((u) => u.id))
    
    // Notifier aussi les admins et gestionnaires
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    userIds.push(...admins.map((u) => u.id))

    await this.createNotification(
      userIds,
      'Rendez-vous urgent',
      `Rendez-vous urgent avec ${patientName} programmé pour ${appointmentTime}`,
      {
        type: 'critical',
        category: 'appointment',
        targetId: appointmentId,
        targetType: 'appointment',
        actionUrl: `/console-clinique?appointment=${appointmentId}`,
        priority: 'urgent',
        metadata: { assignedDoctorUserId: doctorUserId }, // Conserver l'info du médecin assigné
      }
    )

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'urgent_appointment',
      'Rendez-vous urgent',
      `Rendez-vous urgent avec ${patientName} programmé pour ${appointmentTime}`,
      userIds,
      ['docteur', 'admin', 'gestionnaire'],
      'appointment',
      appointmentId,
      'appointment',
      doctorUserId,
      {
        patientName,
        appointmentTime,
        assignedDoctorUserId: doctorUserId,
      }
    )
  }

  /**
   * Notification d'alerte médicale
   * Notifie TOUS les médecins pour les alertes critiques + admins
   */
  static async notifyMedicalAlert(
    patientId: string,
    patientName: string,
    alertType: string,
    message: string,
    assignedDoctorId?: string // Gardé pour référence mais tous les médecins sont notifiés
  ) {
    const userIds: string[] = []
    
    // Notifier TOUS les médecins pour les alertes critiques
    const doctors = await UserProfile.query()
      .whereIn('role', ['docteur'])
      .where('actif', true)
    userIds.push(...doctors.map((u) => u.id))
    
    // Toujours notifier les admins et gestionnaires
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    userIds.push(...admins.map((u) => u.id))

    await this.createNotification(
      userIds,
      `Alerte médicale: ${alertType}`,
      `${patientName}: ${message}`,
      {
        type: 'critical',
        category: 'patient',
        targetId: patientId,
        targetType: 'patient',
        actionUrl: `/console-clinique?patient=${patientId}`,
        metadata: assignedDoctorId ? { assignedDoctorId } : undefined, // Conserver l'info du médecin assigné si disponible
      }
    )

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'medical_alert',
      `Alerte médicale: ${alertType}`,
      `${patientName}: ${message}`,
      userIds,
      ['docteur', 'admin', 'gestionnaire'],
      'patient',
      patientId,
      'patient',
      assignedDoctorId || null,
      {
        patientName,
        alertType,
        message,
        assignedDoctorId,
      }
    )
  }

  /**
   * Notification de facture impayée
   */
  static async notifyUnpaidInvoice(
    invoiceId: string,
    patientName: string,
    amount: number,
    daysOverdue: number
  ) {
    const users = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const userIds = users.map((u) => u.id)

    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(amount)

    await this.createNotification(
      userIds,
      'Facture impayée',
      `Facture de ${formattedAmount} pour ${patientName} en retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
      {
        type: daysOverdue > 30 ? 'critical' : daysOverdue > 15 ? 'error' : 'warning',
        category: 'finance',
        targetId: invoiceId,
        targetType: 'invoice',
        actionUrl: `/operations-financieres?invoice=${invoiceId}`,
        priority: daysOverdue > 30 ? 'urgent' : daysOverdue > 15 ? 'high' : 'normal',
        metadata: { amount, daysOverdue, patientName },
      }
    )

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'unpaid_invoice',
      'Facture impayée',
      `Facture de ${formattedAmount} pour ${patientName} en retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`,
      userIds,
      ['admin', 'gestionnaire'],
      'finance',
      invoiceId,
      'invoice',
      null,
      {
        amount,
        formattedAmount,
        daysOverdue,
        patientName,
      }
    )
  }

  /**
   * Notification de nouvelle consultation créée
   */
  static async notifyNewConsultation(
    consultationId: string,
    patientName: string,
    doctorId: string,
    doctorName: string
  ) {
    // Notifier le médecin concerné
    await this.createNotification(
      doctorId,
      'Nouvelle consultation',
      `Consultation créée pour ${patientName}`,
      {
        type: 'info',
        category: 'clinical',
        targetId: consultationId,
        targetType: 'consultation',
        actionUrl: `/console-clinique?consultation=${consultationId}`,
        priority: 'normal',
      }
    )

    // Logger dans l'audit pour le médecin
    await this.logNotificationToAudit(
      'new_consultation',
      'Nouvelle consultation',
      `Consultation créée pour ${patientName}`,
      [doctorId],
      ['docteur'],
      'clinical',
      consultationId,
      'consultation',
      doctorId,
      {
        patientName,
        doctorName,
      }
    )

    // Notifier les admins/gestionnaires
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const adminIds = admins.map((u) => u.id)

    if (adminIds.length > 0) {
      await this.createNotification(
        adminIds,
        'Nouvelle consultation enregistrée',
        `Consultation pour ${patientName} par ${doctorName}`,
        {
          type: 'info',
          category: 'clinical',
          targetId: consultationId,
          targetType: 'consultation',
          actionUrl: `/console-clinique?consultation=${consultationId}`,
          priority: 'low',
          silent: true, // Notification silencieuse pour les admins
        }
      )

      // Logger dans l'audit pour les admins
      await this.logNotificationToAudit(
        'new_consultation_admin',
        'Nouvelle consultation enregistrée',
        `Consultation pour ${patientName} par ${doctorName}`,
        adminIds,
        ['admin', 'gestionnaire'],
        'clinical',
        consultationId,
        'consultation',
        doctorId,
        {
          patientName,
          doctorName,
        }
      )
    }
  }

  /**
   * Notification de document uploadé
   * Notifie uniquement : celui qui a uploadé le document + admins/gestionnaires
   */
  static async notifyDocumentUploaded(
    documentId: string,
    documentTitle: string,
    patientId: string,
    patientName: string,
    uploadedBy: string
  ) {
    // Liste des destinataires : l'uploader + admins/gestionnaires
    const recipientIds: string[] = [uploadedBy]

    // Ajouter les admins/gestionnaires
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const adminIds = admins.map((u) => u.id)
    recipientIds.push(...adminIds)

    // Éliminer les doublons (au cas où l'uploader serait admin/gestionnaire)
    const uniqueRecipientIds = [...new Set(recipientIds)]

    if (uniqueRecipientIds.length > 0) {
      await this.createNotification(
        uniqueRecipientIds,
        'Document uploadé',
        `${documentTitle} a été ajouté au dossier de ${patientName}`,
        {
          type: 'info',
          category: 'document',
          targetId: documentId,
          targetType: 'document',
          actionUrl: `/gestion-documents?document=${documentId}&patient=${patientId}`,
          priority: 'normal',
          metadata: { patientId, uploadedBy },
        }
      )

      // Logger dans l'audit
      const recipientRoles = uniqueRecipientIds.includes(uploadedBy)
        ? [...(admins.some(a => a.id === uploadedBy) ? ['admin', 'gestionnaire'] : []), 'uploader']
        : ['admin', 'gestionnaire']
      
      await this.logNotificationToAudit(
        'document_uploaded',
        'Document uploadé',
        `${documentTitle} a été ajouté au dossier de ${patientName}`,
        uniqueRecipientIds,
        recipientRoles,
        'document',
        documentId,
        'document',
        uploadedBy,
        {
          documentTitle,
          patientName,
          patientId,
          uploadedBy,
        }
      )
    }
  }

  /**
   * Notification de document supprimé
   * Notifie uniquement : celui qui a supprimé le document (ou celui qui l'a uploadé) + admins/gestionnaires
   */
  static async notifyDocumentDeleted(
    documentId: string,
    documentTitle: string,
    patientId: string | null,
    patientName: string | null,
    deletedBy: string,
    uploadedBy: string | null = null
  ) {
    // Liste des destinataires : celui qui a supprimé (ou uploadé si différent) + admins/gestionnaires
    const recipientIds: string[] = [deletedBy]
    
    // Si l'uploader est différent du suppresseur, l'ajouter aussi
    if (uploadedBy && uploadedBy !== deletedBy) {
      recipientIds.push(uploadedBy)
    }

    // Ajouter les admins/gestionnaires
    const admins = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const adminIds = admins.map((u) => u.id)
    recipientIds.push(...adminIds)

    // Éliminer les doublons
    const uniqueRecipientIds = [...new Set(recipientIds)]

    if (uniqueRecipientIds.length > 0) {
      const patientInfo = patientName ? ` du dossier de ${patientName}` : ''
      const actionUrl = patientId 
        ? `/gestion-documents?patient=${patientId}`
        : '/gestion-documents'

      await this.createNotification(
        uniqueRecipientIds,
        'Document supprimé',
        `${documentTitle}${patientInfo} a été supprimé`,
        {
          type: 'warning',
          category: 'document',
          targetId: documentId,
          targetType: 'document',
          actionUrl,
          priority: 'normal',
          metadata: { patientId, deletedBy, uploadedBy },
        }
      )

      // Logger dans l'audit
      const recipientRoles = uniqueRecipientIds.includes(deletedBy)
        ? [...(admins.some(a => a.id === deletedBy) ? ['admin', 'gestionnaire'] : []), 'deleter']
        : ['admin', 'gestionnaire']
      
      await this.logNotificationToAudit(
        'document_deleted',
        'Document supprimé',
        `${documentTitle}${patientInfo} a été supprimé`,
        uniqueRecipientIds,
        recipientRoles,
        'document',
        documentId,
        'document',
        deletedBy,
        {
          documentTitle,
          patientName,
          patientId,
          deletedBy,
          uploadedBy,
        }
      )
    }
  }

  /**
   * Notification de prescription créée
   * Notifie TOUS les pharmaciens actifs quand un médecin prescrit des médicaments
   */
  static async notifyPrescriptionCreated(
    consultationId: string,
    patientName: string,
    doctorId: string,
    doctorName: string,
    medicamentCount: number,
    prescriptionsDetails: Array<{
      id: string
      medicamentId: string
      medicamentName: string
      quantite: number
      dosage?: string
      frequency?: string
      duration?: string
    }> = []
  ) {
    // Notifier TOUS les pharmaciens actifs
    const pharmacists = await UserProfile.query()
      .where('role', 'pharmacien')
      .where('actif', true)
    const pharmacistIds = pharmacists.map((u) => u.id)

    if (pharmacistIds.length === 0) {
      logger.warn('Aucun pharmacien actif trouvé pour la notification de prescription')
      return
    }

    logger.info(
      { pharmacistCount: pharmacistIds.length, patientName, medicamentCount, doctorName },
      'Notification de prescription envoyée à tous les pharmaciens'
    )

    // Construire le message détaillé avec la liste des médicaments
    let message = `Prescription de ${medicamentCount} médicament(s) pour ${patientName} par ${doctorName}`
    if (prescriptionsDetails.length > 0) {
      const medicationsList = prescriptionsDetails
        .map(p => `• ${p.medicamentName} (${p.quantite} unité(s))`)
        .join('\n')
      message = `Nouvelle prescription pour ${patientName} par ${doctorName}:\n${medicationsList}`
    }

    await this.createNotification(
      pharmacistIds,
      'Nouvelle prescription',
      message,
      {
        type: 'info',
        category: 'pharmacy',
        targetId: consultationId,
        targetType: 'prescription',
        actionUrl: `/operations-pharmacie?consultation=${consultationId}`,
        priority: 'normal',
        metadata: { 
          medicamentCount, 
          doctorId, 
          doctorName,
          patientName,
          prescriptionsDetails: prescriptionsDetails.map(p => ({
            medicamentName: p.medicamentName,
            quantite: p.quantite,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration
          }))
        },
      }
    )

    // Diffuser aussi via pharmacy_channel pour une notification instantanée à tous les pharmaciens
    try {
      await transmit.broadcast('pharmacy_channel', {
        type: 'new_prescription',
        title: 'Nouvelle prescription',
        message: `Prescription de ${medicamentCount} médicament(s) pour ${patientName}`,
        consultationId,
        prescriptionId: consultationId, // Pour compatibilité
        patientName,
        doctorName,
        medicamentCount,
        doctorId,
        prescriptionsDetails: prescriptionsDetails.map(p => ({
          medicamentName: p.medicamentName,
          quantite: p.quantite
        })),
        actionUrl: `/operations-pharmacie?consultation=${consultationId}`,
        timestamp: new Date().toISOString(),
      })
      logger.info({ consultationId, pharmacistCount: pharmacistIds.length }, 'Notification de prescription diffusée via pharmacy_channel')
    } catch (broadcastError) {
      logger.error({ err: broadcastError, consultationId }, 'Erreur lors de la diffusion de la prescription via pharmacy_channel')
      // Ne pas faire échouer l'opération si la diffusion échoue
    }

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'prescription_created',
      'Nouvelle prescription',
      `Prescription de ${medicamentCount} médicament(s) pour ${patientName} par ${doctorName}`,
      pharmacistIds,
      ['pharmacien'],
      'pharmacy',
      consultationId,
      'prescription',
      doctorId,
      {
        medicamentCount,
        patientName,
        doctorId,
        doctorName,
        prescriptionsCount: prescriptionsDetails.length,
      }
    )
  }

  /**
   * Notification de paiement reçu
   */
  static async notifyPaymentReceived(
    transactionId: string,
    patientName: string,
    amount: number,
    paymentMethod: string
  ) {
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(amount)

    // Notifier les admins et gestionnaires
    const users = await UserProfile.query()
      .whereIn('role', ['admin', 'gestionnaire'])
      .where('actif', true)
    const userIds = users.map((u) => u.id)

    await this.createNotification(
      userIds,
      'Paiement reçu',
      `Paiement de ${formattedAmount} (${paymentMethod}) pour ${patientName}`,
      {
        type: 'success',
        category: 'finance',
        targetId: transactionId,
        targetType: 'transaction',
        actionUrl: `/operations-financieres?transaction=${transactionId}`,
        priority: 'normal',
        metadata: { amount, paymentMethod, patientName },
      }
    )

    // Logger dans l'audit avec informations précises
    await this.logNotificationToAudit(
      'payment_received',
      'Paiement reçu',
      `Paiement de ${formattedAmount} (${paymentMethod}) pour ${patientName}`,
      userIds,
      ['admin', 'gestionnaire'],
      'finance',
      transactionId,
      'transaction',
      null,
      {
        amount,
        formattedAmount,
        paymentMethod,
        patientName,
      }
    )
  }

  /**
   * Notification de rappel de rendez-vous (à envoyer X heures avant)
   * Cette méthode devrait être appelée par un job/cron
   */
  static async notifyAppointmentReminder(
    appointmentId: string,
    patientName: string,
    appointmentDate: DateTime,
    doctorId: string,
    doctorName: string,
    patientUserId: string | null = null,
    hoursBefore: number = 24
  ) {
    const formattedDate = appointmentDate.toFormat("dd/MM/yyyy 'à' HH:mm")
    const userIds: string[] = []
    
    // Notifier le médecin
    if (doctorId) {
      userIds.push(doctorId)
    }
    
    // Notifier le patient si un userId est fourni
    if (patientUserId) {
      userIds.push(patientUserId)
    }
    
    if (userIds.length === 0) {
      logger.warn({ appointmentId }, 'Aucun utilisateur à notifier pour le rappel de rendez-vous')
      return { success: false, message: 'Aucun utilisateur à notifier' }
    }
    
    await this.createNotification(
      userIds,
      'Rappel de rendez-vous',
      `Rendez-vous avec ${doctorName} le ${formattedDate}`,
      {
        type: 'info',
        category: 'appointment',
        targetId: appointmentId,
        targetType: 'appointment',
        actionUrl: `/console-clinique?appointment=${appointmentId}`,
        priority: hoursBefore <= 2 ? 'high' : 'normal',
        metadata: { 
          appointmentDate: appointmentDate.toISO(),
          hoursBefore,
          reminderType: 'appointment',
        },
      }
    )

    // Logger dans l'audit avec informations précises
    const recipientRoles: string[] = []
    if (doctorId) {
      const doctorUser = await UserProfile.find(doctorId)
      if (doctorUser) recipientRoles.push('docteur')
    }
    if (patientUserId) {
      const patientUser = await UserProfile.find(patientUserId)
      if (patientUser) recipientRoles.push('patient')
    }
    
    await this.logNotificationToAudit(
      'appointment_reminder',
      'Rappel de rendez-vous',
      `Rendez-vous avec ${doctorName} le ${formattedDate}`,
      userIds,
      recipientRoles.length > 0 ? recipientRoles : null,
      'appointment',
      appointmentId,
      'appointment',
      doctorId,
      {
        patientName,
        doctorName,
        appointmentDate: formattedDate,
        hoursBefore,
        patientUserId,
      }
    )
  }

  /**
   * Notification système (mise à jour, maintenance, etc.)
   */
  static async notifySystemUpdate(
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    // Notifier tous les utilisateurs actifs
    const users = await UserProfile.query().where('actif', true)
    const userIds = users.map((u) => u.id)

    await this.createNotification(
      userIds,
      title,
      message,
      {
        type: severity,
        category: 'system',
        priority: severity === 'error' ? 'high' : 'normal',
        metadata: { systemNotification: true, timestamp: DateTime.now().toISO() },
      }
    )

    // Logger dans l'audit avec informations précises
    const allRoles = [...new Set(users.map(u => u.role))]
    await this.logNotificationToAudit(
      'system_update',
      title,
      message,
      userIds,
      allRoles,
      'system',
      null,
      null,
      null,
      {
        severity,
        systemNotification: true,
      }
    )
  }

  /**
   * Marquer plusieurs notifications comme lues en batch
   * Gère à la fois les notifications individuelles et partagées
   */
  static async markMultipleAsRead(notificationIds: string[], userId: string) {
    try {
      // Traiter les notifications individuelles
      const individualUpdated = await Notification.query()
        .whereIn('id', notificationIds)
        .where('userId', userId)
        .where('isRead', false)
        .whereNotNull('userId')
        .update({
          isRead: true,
          readAt: DateTime.now(),
        })

      // Traiter les notifications partagées
      const sharedNotifications = await Notification.query()
        .whereIn('id', notificationIds)
        .whereNull('userId')
        .whereRaw("metadata->>'isShared' = 'true'")
        .whereRaw("metadata->'sharedWith' @> ?", [JSON.stringify([userId])])
        .whereRaw("NOT (metadata->'readBy' @> ?)", [JSON.stringify([userId])])
        .exec()

      let sharedCount = 0
      for (const notif of sharedNotifications) {
        if (!notif.metadata) {
          notif.metadata = {}
        }
        const readBy = notif.metadata.readBy || []
        if (!readBy.includes(userId)) {
          notif.metadata.readBy = [...readBy, userId]
          
          const sharedWith = notif.metadata.sharedWith || []
          const allRead = sharedWith.every((uid: string) => 
            notif.metadata!.readBy.includes(uid)
          )
          
          if (allRead) {
            notif.isRead = true
            notif.readAt = DateTime.now()
          }
          
          await notif.save()
          sharedCount++
        }
      }

      const totalCount = (Array.isArray(individualUpdated) ? individualUpdated.length : (typeof individualUpdated === 'number' ? individualUpdated : 0)) + sharedCount
      logger.info({ count: totalCount, userId, individual: Array.isArray(individualUpdated) ? individualUpdated.length : individualUpdated, shared: sharedCount }, 'Notifications marquées comme lues')
      return { success: true, count: totalCount }
    } catch (error) {
      logger.error({ err: error, notificationIds, userId }, 'Erreur lors du marquage des notifications')
      throw error
    }
  }

  /**
   * Archiver les anciennes notifications (nettoyage)
   */
  static async archiveOldNotifications(daysOld: number = 90) {
    try {
      const cutoffDate = DateTime.now().minus({ days: daysOld })
      
      const archived = await Notification.query()
        .where('isArchived', false)
        .where('createdAt', '<', cutoffDate.toSQL())
        .update({
          isArchived: true,
        })

      logger.info({ count: archived, daysOld }, 'Anciennes notifications archivées')
      return { success: true, count: archived }
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'archivage des notifications')
      throw error
    }
  }

  /**
   * Supprimer les notifications expirées
   */
  static async deleteExpiredNotifications() {
    try {
      const now = DateTime.now()
      
      const deleted = await Notification.query()
        .whereNotNull('metadata')
        .whereRaw("metadata->>'expiresAt' IS NOT NULL")
        .whereRaw("(metadata->>'expiresAt')::timestamp < ?", [now.toSQL()])
        .delete()

      logger.info({ count: deleted }, 'Notifications expirées supprimées')
      return { success: true, count: deleted }
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la suppression des notifications expirées')
      throw error
    }
  }

  /**
   * Notification de facture payée
   * Notifie le patient et les gestionnaires/financiers
   */
  static async notifyInvoicePaid(
    patientId: string,
    factureId: string,
    numeroFacture: string,
    montantTotal: number
  ) {
    // Utiliser un groupKey unique pour cette facture (utilisé aussi dans createNotification)
    const groupKey = `invoice_paid_${factureId}`
    
    try {
      // PROTECTION CONTRE LES DOUBLONS : Vérifier si des notifications existent déjà pour cette facture
      // Vérifier TOUTES les notifications (lues ou non) créées dans les 30 dernières minutes pour éviter les race conditions
      // Vérifier par targetId ET par groupKey pour une protection maximale
      const cutoffTime = DateTime.now().minus({ minutes: 30 }).toSQL()
      
      // Vérification 1 : Par targetId et category
      const existingByTarget = await Notification.query()
        .where('category', 'billing')
        .where('targetId', factureId)
        .where('targetType', 'invoice')
        .where('isArchived', false)
        .where('createdAt', '>=', cutoffTime)
        .exec()
      
      // Vérification 2 : Par groupKey dans les métadonnées
      const existingByGroupKey = await Notification.query()
        .where('category', 'billing')
        .where('isArchived', false)
        .whereRaw("(metadata->>'groupKey' = ? OR metadata->>'groupKey' LIKE ?)", [`${groupKey}_patient`, `${groupKey}_admins`])
        .where('createdAt', '>=', cutoffTime)
        .exec()
      
      // Combiner les résultats et éliminer les doublons
      const allExisting = [...existingByTarget, ...existingByGroupKey]
      const uniqueExisting = Array.from(new Map(allExisting.map(n => [n.id, n])).values())
      
      if (uniqueExisting.length > 0) {
        logger.warn(
          { 
            factureId, 
            numeroFacture, 
            existingCount: uniqueExisting.length, 
            groupKey,
            existingIds: uniqueExisting.map(n => n.id),
            byTarget: existingByTarget.length,
            byGroupKey: existingByGroupKey.length
          },
          '🚨 Notifications de facture payée déjà existantes, ignorées pour éviter les doublons'
        )
        return { success: true, message: 'Notifications déjà existantes', skipped: true, existingCount: uniqueExisting.length }
      }
      
      logger.info({ factureId, numeroFacture, groupKey }, 'Création de nouvelles notifications de facture payée')

      // Récupérer le patient et son userId
      const patient = await Patient.query()
        .where('id', patientId)
        .preload('user')
        .firstOrFail()

      const recipientIds: string[] = []
      const recipientRoles: string[] = []

      // S'assurer que montantTotal est un nombre
      const montantTotalNumber = Number(montantTotal) || 0

      // Notifier le patient
      if (patient.userId) {
        recipientIds.push(patient.userId)
        recipientRoles.push('patient')

        await this.createNotification(
          patient.userId,
          'Facture payée',
          `Votre facture ${numeroFacture} d'un montant de ${montantTotalNumber.toFixed(2)}€ a été payée avec succès.`,
          {
            type: 'success',
            category: 'billing',
            targetId: factureId,
            targetType: 'invoice',
            actionUrl: `/operations-financieres?invoice=${factureId}`,
            priority: 'normal',
            groupKey: `${groupKey}_patient`,
            metadata: {
              numeroFacture,
              montantTotal: montantTotalNumber,
              patientName: patient.user?.nomComplet || 'Patient',
            },
          }
        )
      }

      // Notifier les gestionnaires et admins (UNE SEULE notification partagée)
      const gestionnaires = await UserProfile.query()
        .whereIn('role', ['admin', 'gestionnaire'])
        .where('actif', true)
        .orderBy('createdAt', 'asc') // Prendre le premier pour la notification en base

      const gestionnaireIds = gestionnaires.map((g) => g.id)
      const gestionnaireRoles = gestionnaires.map((g) => g.role)

      if (gestionnaireIds.length > 0) {
        recipientIds.push(...gestionnaireIds)
        recipientRoles.push(...gestionnaireRoles)

        // Créer UNE SEULE notification pour le premier admin/gestionnaire
        // Les admins/gestionnaires voient toutes les notifications, donc ils verront tous cette unique notification
        const firstAdminId = gestionnaireIds[0]

        await this.createNotification(
          firstAdminId, // UN SEUL utilisateur pour la notification en base
          'Facture payée',
          `La facture ${numeroFacture} du patient ${patient.user?.nomComplet || 'Inconnu'} d'un montant de ${montantTotalNumber.toFixed(2)}€ a été payée.`,
          {
            type: 'success',
            category: 'billing',
            targetId: factureId,
            targetType: 'invoice',
            actionUrl: `/operations-financieres?invoice=${factureId}`,
            priority: 'normal',
            groupKey: `${groupKey}_admins`, // GroupKey pour éviter les doublons
            metadata: {
              numeroFacture,
              montantTotal: montantTotalNumber,
              patientId,
              patientName: patient.user?.nomComplet || 'Patient',
              sharedWith: gestionnaireIds, // Liste de tous les admins/gestionnaires
              isShared: true, // Indicateur que c'est une notification partagée
            },
          }
        )

        // Diffuser la notification via SSE sur un canal partagé (UN SEUL toast pour tous)
        try {
          const sharedChannel = 'shared_billing_notifications'
          await transmit.broadcast(sharedChannel, {
            type: 'success',
            title: 'Facture payée',
            message: `La facture ${numeroFacture} du patient ${patient.user?.nomComplet || 'Inconnu'} d'un montant de ${montantTotalNumber.toFixed(2)}€ a été payée.`,
            category: 'billing',
            actionUrl: `/operations-financieres?invoice=${factureId}`,
            targetId: factureId,
            targetType: 'invoice',
            priority: 'normal',
            sharedNotification: true,
            sharedWith: gestionnaireIds, // Liste des utilisateurs concernés
            timestamp: new Date().toISOString(),
          })
          logger.info({ factureId, sharedWithCount: gestionnaireIds.length, channel: sharedChannel }, 'Toast partagé diffusé à tous les admins/gestionnaires')
        } catch (broadcastError) {
          logger.error({ err: broadcastError }, 'Erreur lors de la diffusion SSE du toast partagé pour facture payée')
        }
      }

      // Logger dans l'audit
      await this.logNotificationToAudit(
        'invoice_paid',
        'Facture payée',
        `Facture ${numeroFacture} payée`,
        recipientIds,
        [...new Set(recipientRoles)],
        'billing',
        factureId,
        'invoice',
        patientId,
        {
          numeroFacture,
          montantTotal: montantTotalNumber,
        }
      )

      logger.info({ factureId, numeroFacture, recipientCount: recipientIds.length }, 'Notifications de facture payée créées')
    } catch (error) {
      logger.error({ err: error, factureId, patientId }, 'Erreur lors de la création des notifications de facture payée')
      // Ne pas faire échouer l'opération principale si la notification échoue
    }
  }
}
