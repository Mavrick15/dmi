import ActivityLog from '#models/ActivityLog'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import UserProfile from '#models/UserProfile'
import Patient from '#models/Patient'

/**
 * Service d'audit pour tracer toutes les opérations de l'application
 * Amélioré pour des descriptions claires et précises
 */
export default class AuditService {
  
  /**
   * Formate une valeur pour l'affichage dans les logs
   */
  private static formatValue(value: any, maxLength: number = 100): string {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non'
    }
    
    if (typeof value === 'number') {
      // Formater les montants en devise
      if (value > 1000 && value % 1 === 0) {
        return new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'XOF',
          minimumFractionDigits: 0 
        }).format(value)
      }
      return value.toString()
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return 'Aucun'
      if (value.length <= 3) {
        return value.join(', ')
      }
      return `${value.slice(0, 3).join(', ')} et ${value.length - 3} autre(s)`
    }
    
    if (typeof value === 'object') {
      // Pour les objets, créer une représentation structurée
      const keys = Object.keys(value)
      if (keys.length === 0) return '{}'
      if (keys.length <= 2) {
        return keys.map(k => `${k}: ${this.formatValue(value[k], 50)}`).join(', ')
      }
      return `${keys.slice(0, 2).map(k => `${k}: ${this.formatValue(value[k], 30)}`).join(', ')}... (+${keys.length - 2})`
    }
    
    const str = String(value)
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str
  }

  /**
   * Résout un UUID en nom lisible selon le type de ressource
   */
  private static async resolveUUIDToName(key: string, uuid: string): Promise<string> {
    if (!this.isValidUUID(uuid)) {
      return uuid // Si ce n'est pas un UUID, retourner tel quel
    }

    try {
      // Mapping des clés vers les modèles
      if (key.includes('patientId') || key === 'patientId') {
        const patient = await Patient.find(uuid)
        if (patient) {
          await patient.load('user')
          return patient.user?.nomComplet || patient.numeroPatient || `Patient ${uuid.substring(0, 8)}`
        }
      } else if (key.includes('medecinId') || key.includes('doctorId') || key.includes('uploadedBy') || key.includes('createdBy') || key.includes('userId') || key.includes('approvedBy') || key.includes('signedBy')) {
        const user = await UserProfile.find(uuid)
        if (user) {
          return user.nomComplet || user.email || `Utilisateur ${uuid.substring(0, 8)}`
        }
      }
      
      return uuid // Si aucune correspondance, retourner l'UUID
    } catch (error) {
      logger.debug({ key, uuid, err: error }, 'Impossible de résoudre l\'UUID en nom')
      return uuid
    }
  }

  /**
   * Construit une description claire et structurée à partir des métadonnées
   * Remplace automatiquement les UUIDs par des noms lisibles
   */
  private static async buildMetadataDescription(metadata: Record<string, any>): Promise<string> {
    if (!metadata || Object.keys(metadata).length === 0) {
      return ''
    }

    // Catégoriser les métadonnées par importance
    const importantFields = ['patientName', 'doctorName', 'medicamentName', 'amount', 'quantity', 'reason', 'status']
    const important: string[] = []
    const other: string[] = []

    // Traiter les métadonnées de manière asynchrone
    const entries = Object.entries(metadata)
    for (const [key, value] of entries) {
      if (value === null || value === undefined) continue
      
      let formattedValue = value
      
      // Si la valeur est un UUID, le résoudre en nom
      if (typeof value === 'string' && this.isValidUUID(value)) {
        formattedValue = await this.resolveUUIDToName(key, value)
      }
      
      formattedValue = this.formatValue(formattedValue, 80)
      const formatted = `${this.formatFieldName(key)}: ${formattedValue}`
      
      if (importantFields.includes(key) || key.includes('Name') || key.includes('amount') || key.includes('quantity')) {
        important.push(formatted)
      } else {
        other.push(formatted)
      }
    }

    // Construire la description avec les champs importants en premier
    const parts: string[] = []
    if (important.length > 0) {
      parts.push(important.join(' • '))
    }
    if (other.length > 0 && other.length <= 3) {
      parts.push(other.join(' • '))
    } else if (other.length > 3) {
      parts.push(`${other.slice(0, 2).join(' • ')}... (+${other.length - 2})`)
    }

    return parts.length > 0 ? ` [${parts.join(' | ')}]` : ''
  }

  /**
   * Formate le nom d'un champ pour l'affichage (camelCase -> Titre)
   */
  private static formatFieldName(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'patientName': 'Patient',
      'doctorName': 'Médecin',
      'medicamentName': 'Médicament',
      'documentTitle': 'Document',
      'amount': 'Montant',
      'formattedAmount': 'Montant',
      'quantity': 'Quantité',
      'daysOverdue': 'Jours de retard',
      'paymentMethod': 'Méthode de paiement',
      'movementType': 'Type de mouvement',
      'reason': 'Raison',
      'orderNumber': 'N° Commande',
      'appointmentDate': 'Date RDV',
      'appointmentTime': 'Heure RDV',
      'medicamentCount': 'Nb médicaments',
      'recipientCount': 'Nb destinataires',
      'recipientRoles': 'Rôles destinataires',
      'category': 'Catégorie',
      'targetType': 'Type de cible',
      'createdBy': 'Créé par',
      'uploadedBy': 'Uploadé par',
      'alertType': 'Type d\'alerte',
      'hoursBefore': 'Heures avant',
      'isAutomatic': 'Automatique',
      'severity': 'Sévérité',
      'systemNotification': 'Notification système',
    }

    if (fieldMap[fieldName]) {
      return fieldMap[fieldName]
    }

    // Convertir camelCase en Titre
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  /**
   * Récupère le nom complet de l'utilisateur pour l'affichage
   */
  private static async getUserDisplayName(userId: string | null): Promise<string> {
    if (!userId) return 'Système'
    
    try {
      const user = await UserProfile.find(userId)
      if (user) {
        return user.nomComplet || user.email || `Utilisateur ${userId.substring(0, 8)}`
      }
      return `Utilisateur ${userId.substring(0, 8)}`
    } catch {
      return `Utilisateur ${userId.substring(0, 8)}`
    }
  }

  /**
   * Valide si une chaîne est un UUID valide
   */
  private static isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  /**
   * Enregistre une action d'audit avec des descriptions claires et précises
   * @param ctx - Contexte HTTP (pour récupérer l'utilisateur)
   * @param type - Type d'action (ex: 'patient_created', 'user_updated', 'document_deleted')
   * @param description - Description de l'action
   * @param targetId - ID de la ressource concernée (optionnel, doit être un UUID valide)
   * @param metadata - Données supplémentaires (optionnel)
   */
  public static async log(
    ctx: HttpContext | null,
    type: string,
    description: string,
    targetId: string | number | null = null,
    metadata: Record<string, any> | null = null
  ): Promise<void> {
    try {
      const userId = (ctx?.auth?.user as any)?.id || null
      
      // Valider et convertir targetId
      let validTargetId: string | null = null
      if (targetId) {
        const targetIdStr = String(targetId)
        // Vérifier si c'est un UUID valide
        if (this.isValidUUID(targetIdStr)) {
          validTargetId = targetIdStr
        } else {
          // Si ce n'est pas un UUID valide, l'ajouter aux métadonnées
          // C'est normal pour certaines ressources comme les documents qui utilisent des IDs numériques
          if (!metadata) {
            metadata = {}
          }
          metadata.originalTargetId = targetIdStr
          // Ne pas logger d'avertissement car c'est un comportement attendu pour certaines ressources
          // (documents, consultations, etc. utilisent des IDs numériques, pas des UUIDs)
        }
      }
      
      // Construire la description complète avec métadonnées formatées
      let fullDescription = description
      
      if (metadata && Object.keys(metadata).length > 0) {
        const metadataDesc = await this.buildMetadataDescription(metadata)
        if (metadataDesc) {
          fullDescription = `${description}${metadataDesc}`
        }
      }

      // Tronquer la description à 2000 caractères pour éviter des logs trop longs
      // (la colonne est maintenant de type TEXT, mais on limite quand même pour la lisibilité)
      const truncatedDescription = fullDescription.length > 2000 
        ? fullDescription.substring(0, 1997) + '...'
        : fullDescription

      await ActivityLog.create({
        type,
        description: truncatedDescription,
        userId,
        targetId: validTargetId
      })
    } catch (error) {
      // Ne pas faire échouer l'opération principale si l'audit échoue
      logger.error({ err: error, type, description }, 'Erreur lors de l\'enregistrement du log d\'audit')
    }
  }

  /**
   * Enregistre une création avec des informations claires
   */
  public static async logCreate(
    ctx: HttpContext | null,
    resourceType: string,
    resourceId: string,
    resourceName?: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const resourceTypeLabel = this.formatFieldName(resourceType)
    const description = resourceName 
      ? `Création de ${resourceTypeLabel}: "${resourceName}"`
      : `Création de ${resourceTypeLabel}`
    
    await this.log(ctx, `${resourceType}_created`, description, resourceId, {
      action: 'create',
      resourceType: resourceTypeLabel,
      resourceName,
      ...(additionalMetadata || {})
    })
  }

  /**
   * Enregistre une mise à jour avec des informations claires sur les changements
   */
  public static async logUpdate(
    ctx: HttpContext | null,
    resourceType: string,
    resourceId: string,
    resourceName?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const resourceTypeLabel = this.formatFieldName(resourceType)
    let description = resourceName 
      ? `Modification de ${resourceTypeLabel}: "${resourceName}"`
      : `Modification de ${resourceTypeLabel}`
    
    // Ajouter un résumé des changements si disponibles
    if (changes && Object.keys(changes).length > 0) {
      const changeSummary = Object.keys(changes)
        .slice(0, 3)
        .map(key => this.formatFieldName(key))
        .join(', ')
      const moreCount = Object.keys(changes).length - 3
      description += moreCount > 0 
        ? ` (${changeSummary}${moreCount > 0 ? ` +${moreCount} autre(s)` : ''})`
        : ` (${changeSummary})`
    }
    
    await this.log(ctx, `${resourceType}_updated`, description, resourceId, {
      action: 'update',
      resourceType: resourceTypeLabel,
      resourceName,
      changes: changes ? Object.keys(changes).length : 0,
      ...(changes || {})
    })
  }

  /**
   * Enregistre une suppression avec des informations claires
   */
  public static async logDelete(
    ctx: HttpContext | null,
    resourceType: string,
    resourceId: string,
    resourceName?: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const resourceTypeLabel = this.formatFieldName(resourceType)
    const description = resourceName 
      ? `Suppression de ${resourceTypeLabel}: "${resourceName}"`
      : `Suppression de ${resourceTypeLabel}`
    
    await this.log(ctx, `${resourceType}_deleted`, description, resourceId, {
      action: 'delete',
      resourceType: resourceTypeLabel,
      resourceName,
      ...(additionalMetadata || {})
    })
  }

  /**
   * Enregistre une connexion avec des informations claires
   */
  public static async logLogin(
    ctx: HttpContext | null,
    userId: string,
    email: string,
    success: boolean = true,
    ipAddress?: string
  ): Promise<void> {
    const userDisplayName = await this.getUserDisplayName(userId)
    const description = success 
      ? `Connexion réussie: ${userDisplayName} (${email})`
      : `Tentative de connexion échouée: ${email}`
    
    await this.log(ctx, success ? 'user_login_success' : 'user_login_failed', description, userId, {
      action: 'login',
      success: success ? 'Oui' : 'Non',
      email,
      userDisplayName,
      ...(ipAddress ? { ipAddress } : {})
    })
  }

  /**
   * Enregistre une déconnexion avec des informations claires
   */
  public static async logLogout(
    ctx: HttpContext | null,
    userId: string,
    email: string
  ): Promise<void> {
    const userDisplayName = await this.getUserDisplayName(userId)
    await this.log(ctx, 'user_logout', `Déconnexion: ${userDisplayName} (${email})`, userId, {
      action: 'logout',
      email,
      userDisplayName
    })
  }

  /**
   * Enregistre un verrouillage de compte après tentatives échouées
   */
  public static async logAccountLocked(
    ctx: HttpContext | null,
    email: string,
    lockDuration: number = 15,
    failedAttempts: number = 5
  ): Promise<void> {
    await this.log(ctx, 'auth_account_locked', 
      `Compte verrouillé: ${email} (${failedAttempts} tentatives échouées)`, 
      null, 
      {
        action: 'account_locked',
        email,
        lockDuration: `${lockDuration} minutes`,
        failedAttempts,
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre un déverrouillage de compte par un administrateur
   */
  public static async logAccountUnlocked(
    ctx: HttpContext | null,
    unlockedUserId: string,
    unlockedUserEmail: string,
    adminId?: string
  ): Promise<void> {
    const adminName = adminId ? await this.getUserDisplayName(adminId) : 'Système'
    const userDisplayName = await this.getUserDisplayName(unlockedUserId)
    
    await this.log(ctx, 'auth_account_unlocked', 
      `Compte déverrouillé: ${userDisplayName} (${unlockedUserEmail}) par ${adminName}`, 
      unlockedUserId, 
      {
        action: 'account_unlocked',
        unlockedUserEmail,
        unlockedBy: adminName,
        adminId
      }
    )
  }

  /**
   * Enregistre une demande de réinitialisation de mot de passe
   */
  public static async logPasswordResetRequest(
    ctx: HttpContext | null,
    email: string,
    userId?: string
  ): Promise<void> {
    await this.log(ctx, 'auth_password_reset_request', 
      `Demande de réinitialisation de mot de passe: ${email}`, 
      userId || null, 
      {
        action: 'password_reset_request',
        email
      }
    )
  }

  /**
   * Enregistre une réinitialisation de mot de passe effectuée
   */
  public static async logPasswordResetComplete(
    ctx: HttpContext | null,
    userId: string,
    email: string
  ): Promise<void> {
    const userDisplayName = await this.getUserDisplayName(userId)
    await this.log(ctx, 'auth_password_reset_complete', 
      `Réinitialisation de mot de passe effectuée: ${userDisplayName} (${email})`, 
      userId, 
      {
        action: 'password_reset_complete',
        email,
        userDisplayName
      }
    )
  }

  // ==================== AUDIT PATIENTS (RGPD) ====================

  /**
   * Enregistre la création d'un patient (RGPD - Registre des traitements)
   */
  public static async logPatientCreated(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string
  ): Promise<void> {
    await this.log(ctx, 'patient_created', 
      `Création du patient: ${patientName} (${numeroPatient})`, 
      patientId, 
      {
        action: 'create',
        patientName,
        numeroPatient,
        gdprAction: 'data_collection'
      }
    )
  }

  /**
   * Enregistre la modification d'un patient (RGPD - Traçabilité des modifications)
   */
  public static async logPatientUpdated(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'patient_updated', 
      `Modification du patient: ${patientName} (${numeroPatient})`, 
      patientId, 
      {
        action: 'update',
        patientName,
        numeroPatient,
        changedFields,
        gdprAction: 'data_modification'
      }
    )
  }

  /**
   * Enregistre la suppression d'un patient (RGPD - Droit à l'oubli)
   */
  public static async logPatientDeleted(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'patient_deleted', 
      `Suppression du patient: ${patientName} (${numeroPatient})`, 
      patientId, 
      {
        action: 'delete',
        patientName,
        numeroPatient,
        reason: reason || 'Non spécifiée',
        gdprAction: 'right_to_erasure',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la consultation d'un dossier patient (RGPD - Traçabilité des accès)
   */
  public static async logPatientViewed(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string,
    viewContext?: string
  ): Promise<void> {
    const userName = await this.getUserDisplayName(ctx?.auth?.user?.id || null)
    await this.log(ctx, 'patient_viewed', 
      `Consultation du dossier: ${patientName} (${numeroPatient}) par ${userName}`, 
      patientId, 
      {
        action: 'view',
        patientName,
        numeroPatient,
        viewedBy: userName,
        context: viewContext || 'Consultation générale',
        gdprAction: 'data_access'
      }
    )
  }

  /**
   * Enregistre l'export des données d'un patient (RGPD - Droit à la portabilité)
   */
  public static async logPatientDataExported(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string,
    exportFormat: string,
    dataScope?: string[]
  ): Promise<void> {
    const userName = await this.getUserDisplayName(ctx?.auth?.user?.id || null)
    await this.log(ctx, 'patient_data_exported', 
      `Export des données: ${patientName} (${numeroPatient}) par ${userName}`, 
      patientId, 
      {
        action: 'export',
        patientName,
        numeroPatient,
        exportedBy: userName,
        exportFormat,
        dataScope: dataScope ? dataScope.join(', ') : 'Toutes les données',
        gdprAction: 'right_to_portability',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre l'upload d'une photo de patient (RGPD - Données sensibles)
   */
  public static async logPatientPhotoUploaded(
    ctx: HttpContext | null,
    patientId: string,
    patientName: string,
    numeroPatient: string,
    fileSize?: number
  ): Promise<void> {
    await this.log(ctx, 'patient_photo_uploaded', 
      `Upload de photo: ${patientName} (${numeroPatient})`, 
      patientId, 
      {
        action: 'photo_upload',
        patientName,
        numeroPatient,
        fileSize: fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'N/A',
        gdprAction: 'biometric_data_processing'
      }
    )
  }

  // ==================== AUDIT CONSULTATIONS & PRESCRIPTIONS ====================

  /**
   * Enregistre la création d'une consultation
   */
  public static async logConsultationCreated(
    ctx: HttpContext | null,
    consultationId: string,
    patientName: string,
    medecinName: string,
    motifConsultation?: string
  ): Promise<void> {
    await this.log(ctx, 'consultation_created', 
      `Consultation créée: ${patientName} par Dr. ${medecinName}`, 
      consultationId, 
      {
        action: 'create',
        patientName,
        medecinName,
        motifConsultation: motifConsultation || 'Non spécifié',
        medicalAction: 'consultation_initiation'
      }
    )
  }

  /**
   * Enregistre la modification d'une consultation
   */
  public static async logConsultationUpdated(
    ctx: HttpContext | null,
    consultationId: string,
    patientName: string,
    medecinName: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'consultation_updated', 
      `Consultation modifiée: ${patientName} par Dr. ${medecinName}`, 
      consultationId, 
      {
        action: 'update',
        patientName,
        medecinName,
        changedFields,
        medicalAction: 'consultation_modification'
      }
    )
  }

  /**
   * Enregistre la finalisation d'une consultation (acte médical validé)
   */
  public static async logConsultationFinalized(
    ctx: HttpContext | null,
    consultationId: string,
    patientName: string,
    medecinName: string,
    diagnostics?: string[]
  ): Promise<void> {
    await this.log(ctx, 'consultation_finalized', 
      `Consultation finalisée: ${patientName} par Dr. ${medecinName}`, 
      consultationId, 
      {
        action: 'finalize',
        patientName,
        medecinName,
        diagnostics: diagnostics ? diagnostics.join(', ') : 'Non spécifié',
        medicalAction: 'consultation_validation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la suppression d'une consultation
   */
  public static async logConsultationDeleted(
    ctx: HttpContext | null,
    consultationId: string,
    patientName: string,
    medecinName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'consultation_deleted', 
      `Consultation supprimée: ${patientName} par Dr. ${medecinName}`, 
      consultationId, 
      {
        action: 'delete',
        patientName,
        medecinName,
        reason: reason || 'Non spécifiée',
        medicalAction: 'consultation_deletion',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la création d'une prescription
   */
  public static async logPrescriptionCreated(
    ctx: HttpContext | null,
    prescriptionId: string,
    patientName: string,
    medecinName: string,
    medicamentCount?: number
  ): Promise<void> {
    await this.log(ctx, 'prescription_created', 
      `Prescription créée: ${patientName} par Dr. ${medecinName} (${medicamentCount || 0} médicament(s))`, 
      prescriptionId, 
      {
        action: 'create',
        patientName,
        medecinName,
        medicamentCount: medicamentCount || 0,
        medicalAction: 'prescription_issuance'
      }
    )
  }

  /**
   * Enregistre la modification d'une prescription
   */
  public static async logPrescriptionUpdated(
    ctx: HttpContext | null,
    prescriptionId: string,
    patientName: string,
    medecinName: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'prescription_updated', 
      `Prescription modifiée: ${patientName} par Dr. ${medecinName}`, 
      prescriptionId, 
      {
        action: 'update',
        patientName,
        medecinName,
        changedFields,
        medicalAction: 'prescription_modification'
      }
    )
  }

  /**
   * Enregistre l'annulation d'une prescription
   */
  public static async logPrescriptionCancelled(
    ctx: HttpContext | null,
    prescriptionId: string,
    patientName: string,
    medecinName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'prescription_cancelled', 
      `Prescription annulée: ${patientName} par Dr. ${medecinName}`, 
      prescriptionId, 
      {
        action: 'cancel',
        patientName,
        medecinName,
        reason: reason || 'Non spécifiée',
        medicalAction: 'prescription_cancellation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la délivrance d'une prescription (pharmacie)
   */
  public static async logPrescriptionDispensed(
    ctx: HttpContext | null,
    prescriptionId: string,
    patientName: string,
    pharmacienName: string,
    medicamentCount?: number
  ): Promise<void> {
    await this.log(ctx, 'prescription_dispensed', 
      `Prescription délivrée: ${patientName} par ${pharmacienName} (${medicamentCount || 0} médicament(s))`, 
      prescriptionId, 
      {
        action: 'dispense',
        patientName,
        pharmacienName,
        medicamentCount: medicamentCount || 0,
        medicalAction: 'prescription_fulfillment'
      }
    )
  }

  // ==================== AUDIT PHARMACIE & STOCKS ====================

  /**
   * Enregistre la création d'un médicament
   */
  public static async logMedicamentCreated(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    codeDci?: string
  ): Promise<void> {
    await this.log(ctx, 'medicament_created', 
      `Médicament créé: ${medicamentName}${codeDci ? ` (${codeDci})` : ''}`, 
      medicamentId, 
      {
        action: 'create',
        medicamentName,
        codeDci: codeDci || 'Non spécifié',
        pharmacyAction: 'medicament_registration'
      }
    )
  }

  /**
   * Enregistre la modification d'un médicament
   */
  public static async logMedicamentUpdated(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'medicament_updated', 
      `Médicament modifié: ${medicamentName}`, 
      medicamentId, 
      {
        action: 'update',
        medicamentName,
        changedFields,
        pharmacyAction: 'medicament_modification'
      }
    )
  }

  /**
   * Enregistre la suppression d'un médicament
   */
  public static async logMedicamentDeleted(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'medicament_deleted', 
      `Médicament supprimé: ${medicamentName}`, 
      medicamentId, 
      {
        action: 'delete',
        medicamentName,
        reason: reason || 'Non spécifiée',
        pharmacyAction: 'medicament_deletion',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre un ajustement de stock
   */
  public static async logStockAdjusted(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    oldQuantity: number,
    newQuantity: number,
    reason?: string
  ): Promise<void> {
    const difference = newQuantity - oldQuantity
    const action = difference > 0 ? 'Augmentation' : 'Diminution'
    
    await this.log(ctx, 'stock_adjusted', 
      `${action} de stock: ${medicamentName} (${oldQuantity} → ${newQuantity}, ${Math.abs(difference)} unités)`, 
      medicamentId, 
      {
        action: 'adjust',
        medicamentName,
        oldQuantity,
        newQuantity,
        difference,
        reason: reason || 'Non spécifiée',
        pharmacyAction: 'stock_adjustment',
        severity: Math.abs(difference) > 100 ? 'high' : 'normal'
      }
    )
  }

  /**
   * Enregistre une alerte de stock bas
   */
  public static async logStockAlert(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    currentStock: number,
    threshold: number
  ): Promise<void> {
    await this.log(ctx, 'stock_alert', 
      `Alerte stock bas: ${medicamentName} (${currentStock} unités restantes, seuil: ${threshold})`, 
      medicamentId, 
      {
        action: 'alert',
        medicamentName,
        currentStock,
        threshold,
        pharmacyAction: 'stock_low_alert',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre un médicament périmé
   */
  public static async logStockExpired(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    expiryDate: string,
    quantity: number
  ): Promise<void> {
    await this.log(ctx, 'stock_expired', 
      `Médicament périmé: ${medicamentName} (${quantity} unités, exp: ${expiryDate})`, 
      medicamentId, 
      {
        action: 'expired',
        medicamentName,
        expiryDate,
        quantity,
        pharmacyAction: 'expired_stock_detected',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre une réception de stock
   */
  public static async logStockReceived(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    quantity: number,
    supplier?: string,
    batchNumber?: string
  ): Promise<void> {
    await this.log(ctx, 'stock_received', 
      `Réception de stock: ${medicamentName} (${quantity} unités)${supplier ? ` de ${supplier}` : ''}`, 
      medicamentId, 
      {
        action: 'receive',
        medicamentName,
        quantity,
        supplier: supplier || 'Non spécifié',
        batchNumber: batchNumber || 'N/A',
        pharmacyAction: 'stock_reception'
      }
    )
  }

  /**
   * Enregistre un transfert de stock
   */
  public static async logStockTransferred(
    ctx: HttpContext | null,
    medicamentId: string,
    medicamentName: string,
    quantity: number,
    fromLocation: string,
    toLocation: string
  ): Promise<void> {
    await this.log(ctx, 'stock_transferred', 
      `Transfert de stock: ${medicamentName} (${quantity} unités, ${fromLocation} → ${toLocation})`, 
      medicamentId, 
      {
        action: 'transfer',
        medicamentName,
        quantity,
        fromLocation,
        toLocation,
        pharmacyAction: 'stock_transfer'
      }
    )
  }

  /**
   * Enregistre un inventaire effectué
   */
  public static async logInventoryPerformed(
    ctx: HttpContext | null,
    inventoryId: string,
    itemsCount: number,
    discrepancies?: number
  ): Promise<void> {
    const status = discrepancies && discrepancies > 0 ? 'avec écarts' : 'sans écart'
    
    await this.log(ctx, 'inventory_performed', 
      `Inventaire effectué: ${itemsCount} articles vérifiés, ${status}`, 
      inventoryId, 
      {
        action: 'inventory',
        itemsCount,
        discrepancies: discrepancies || 0,
        pharmacyAction: 'inventory_check',
        severity: discrepancies && discrepancies > 0 ? 'high' : 'normal'
      }
    )
  }

  /**
   * Enregistre la création d'un lot de médicaments
   */
  public static async logBatchCreated(
    ctx: HttpContext | null,
    batchId: string,
    medicamentName: string,
    batchNumber: string,
    quantity: number,
    expiryDate?: string
  ): Promise<void> {
    await this.log(ctx, 'batch_created', 
      `Lot créé: ${medicamentName} (${batchNumber}, ${quantity} unités)${expiryDate ? `, exp: ${expiryDate}` : ''}`, 
      batchId, 
      {
        action: 'create',
        medicamentName,
        batchNumber,
        quantity,
        expiryDate: expiryDate || 'Non spécifiée',
        pharmacyAction: 'batch_registration'
      }
    )
  }

  // ==================== AUDIT DOCUMENTS ====================

  /**
   * Enregistre la création d'un document
   */
  public static async logDocumentCreated(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    documentType: string,
    patientName?: string
  ): Promise<void> {
    await this.log(ctx, 'document_created', 
      `Document créé: ${documentName} (${documentType})${patientName ? ` pour ${patientName}` : ''}`, 
      documentId, 
      {
        action: 'create',
        documentName,
        documentType,
        patientName: patientName || 'N/A',
        documentAction: 'document_creation',
        gdprAction: 'data_processing'
      }
    )
  }

  /**
   * Enregistre la modification d'un document
   */
  public static async logDocumentUpdated(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'document_updated', 
      `Document modifié: ${documentName}`, 
      documentId, 
      {
        action: 'update',
        documentName,
        changedFields,
        documentAction: 'document_modification',
        gdprAction: 'data_modification'
      }
    )
  }

  /**
   * Enregistre la suppression d'un document
   */
  public static async logDocumentDeleted(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'document_deleted', 
      `Document supprimé: ${documentName}`, 
      documentId, 
      {
        action: 'delete',
        documentName,
        reason: reason || 'Non spécifiée',
        documentAction: 'document_deletion',
        gdprAction: 'data_erasure',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la consultation d'un document (RGPD - Traçabilité des accès)
   */
  public static async logDocumentViewed(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    viewerName: string,
    patientName?: string
  ): Promise<void> {
    await this.log(ctx, 'document_viewed', 
      `Document consulté: ${documentName} par ${viewerName}${patientName ? ` (patient: ${patientName})` : ''}`, 
      documentId, 
      {
        action: 'view',
        documentName,
        viewerName,
        patientName: patientName || 'N/A',
        documentAction: 'document_access',
        gdprAction: 'data_access'
      }
    )
  }

  /**
   * Enregistre le téléchargement d'un document (RGPD)
   */
  public static async logDocumentDownloaded(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    downloaderName: string,
    patientName?: string
  ): Promise<void> {
    await this.log(ctx, 'document_downloaded', 
      `Document téléchargé: ${documentName} par ${downloaderName}${patientName ? ` (patient: ${patientName})` : ''}`, 
      documentId, 
      {
        action: 'download',
        documentName,
        downloaderName,
        patientName: patientName || 'N/A',
        documentAction: 'document_export',
        gdprAction: 'data_export',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre le partage d'un document
   */
  public static async logDocumentShared(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    sharedWith: string,
    sharedBy: string
  ): Promise<void> {
    await this.log(ctx, 'document_shared', 
      `Document partagé: ${documentName} avec ${sharedWith} par ${sharedBy}`, 
      documentId, 
      {
        action: 'share',
        documentName,
        sharedWith,
        sharedBy,
        documentAction: 'document_sharing',
        gdprAction: 'data_disclosure',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la signature électronique d'un document
   */
  public static async logDocumentSigned(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    signerName: string,
    signatureType: string
  ): Promise<void> {
    await this.log(ctx, 'document_signed', 
      `Document signé: ${documentName} par ${signerName} (${signatureType})`, 
      documentId, 
      {
        action: 'sign',
        documentName,
        signerName,
        signatureType,
        documentAction: 'electronic_signature',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre l'archivage d'un document
   */
  public static async logDocumentArchived(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'document_archived', 
      `Document archivé: ${documentName}`, 
      documentId, 
      {
        action: 'archive',
        documentName,
        reason: reason || 'Archivage standard',
        documentAction: 'document_archiving'
      }
    )
  }

  /**
   * Enregistre la restauration d'un document archivé
   */
  public static async logDocumentRestored(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'document_restored', 
      `Document restauré: ${documentName}`, 
      documentId, 
      {
        action: 'restore',
        documentName,
        reason: reason || 'Restauration demandée',
        documentAction: 'document_restoration'
      }
    )
  }

  /**
   * Enregistre la création d'une nouvelle version d'un document
   */
  public static async logDocumentVersionCreated(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    versionNumber: string,
    createdBy: string
  ): Promise<void> {
    await this.log(ctx, 'document_version_created', 
      `Nouvelle version: ${documentName} v${versionNumber} par ${createdBy}`, 
      documentId, 
      {
        action: 'version',
        documentName,
        versionNumber,
        createdBy,
        documentAction: 'version_control'
      }
    )
  }

  /**
   * Enregistre l'octroi d'un accès à un document
   */
  public static async logDocumentAccessGranted(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    grantedTo: string,
    grantedBy: string,
    accessLevel: string
  ): Promise<void> {
    await this.log(ctx, 'document_access_granted', 
      `Accès accordé: ${documentName} à ${grantedTo} (${accessLevel}) par ${grantedBy}`, 
      documentId, 
      {
        action: 'grant_access',
        documentName,
        grantedTo,
        grantedBy,
        accessLevel,
        documentAction: 'access_control',
        gdprAction: 'authorization_granted',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la révocation d'un accès à un document
   */
  public static async logDocumentAccessRevoked(
    ctx: HttpContext | null,
    documentId: string,
    documentName: string,
    revokedFrom: string,
    revokedBy: string
  ): Promise<void> {
    await this.log(ctx, 'document_access_revoked', 
      `Accès révoqué: ${documentName} pour ${revokedFrom} par ${revokedBy}`, 
      documentId, 
      {
        action: 'revoke_access',
        documentName,
        revokedFrom,
        revokedBy,
        documentAction: 'access_revocation',
        gdprAction: 'authorization_revoked',
        severity: 'high'
      }
    )
  }

  // ==================== AUDIT UTILISATEURS & ADMINISTRATION ====================

  /**
   * Enregistre la création d'un utilisateur
   */
  public static async logUserCreated(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    userRole: string,
    createdBy: string
  ): Promise<void> {
    await this.log(ctx, 'user_created', 
      `Utilisateur créé: ${userName} (${userRole}) par ${createdBy}`, 
      userId, 
      {
        action: 'create',
        userName,
        userRole,
        createdBy,
        adminAction: 'user_creation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la modification d'un utilisateur
   */
  public static async logUserUpdated(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    changes?: Record<string, any>,
    updatedBy?: string
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'user_updated', 
      `Utilisateur modifié: ${userName}${updatedBy ? ` par ${updatedBy}` : ''}`, 
      userId, 
      {
        action: 'update',
        userName,
        changedFields,
        updatedBy: updatedBy || 'N/A',
        adminAction: 'user_modification'
      }
    )
  }

  /**
   * Enregistre la suppression d'un utilisateur
   */
  public static async logUserDeleted(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    userRole: string,
    deletedBy: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'user_deleted', 
      `Utilisateur supprimé: ${userName} (${userRole}) par ${deletedBy}${reason ? ` - ${reason}` : ''}`, 
      userId, 
      {
        action: 'delete',
        userName,
        userRole,
        deletedBy,
        reason: reason || 'Non spécifiée',
        adminAction: 'user_deletion',
        severity: 'critical'
      }
    )
  }

  /**
   * Enregistre l'activation d'un utilisateur
   */
  public static async logUserActivated(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    activatedBy: string
  ): Promise<void> {
    await this.log(ctx, 'user_activated', 
      `Utilisateur activé: ${userName} par ${activatedBy}`, 
      userId, 
      {
        action: 'activate',
        userName,
        activatedBy,
        adminAction: 'user_activation'
      }
    )
  }

  /**
   * Enregistre la désactivation d'un utilisateur
   */
  public static async logUserDeactivated(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    deactivatedBy: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'user_deactivated', 
      `Utilisateur désactivé: ${userName} par ${deactivatedBy}${reason ? ` - ${reason}` : ''}`, 
      userId, 
      {
        action: 'deactivate',
        userName,
        deactivatedBy,
        reason: reason || 'Non spécifiée',
        adminAction: 'user_deactivation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre le changement de rôle d'un utilisateur
   */
  public static async logRoleChanged(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    oldRole: string,
    newRole: string,
    changedBy: string
  ): Promise<void> {
    await this.log(ctx, 'role_changed', 
      `Rôle changé: ${userName} de ${oldRole} à ${newRole} par ${changedBy}`, 
      userId, 
      {
        action: 'change_role',
        userName,
        oldRole,
        newRole,
        changedBy,
        adminAction: 'role_modification',
        severity: 'critical'
      }
    )
  }

  /**
   * Enregistre l'attribution d'une permission
   */
  public static async logPermissionGranted(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    permission: string,
    grantedBy: string
  ): Promise<void> {
    await this.log(ctx, 'permission_granted', 
      `Permission accordée: ${permission} à ${userName} par ${grantedBy}`, 
      userId, 
      {
        action: 'grant_permission',
        userName,
        permission,
        grantedBy,
        adminAction: 'permission_grant',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la révocation d'une permission
   */
  public static async logPermissionRevoked(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    permission: string,
    revokedBy: string
  ): Promise<void> {
    await this.log(ctx, 'permission_revoked', 
      `Permission révoquée: ${permission} de ${userName} par ${revokedBy}`, 
      userId, 
      {
        action: 'revoke_permission',
        userName,
        permission,
        revokedBy,
        adminAction: 'permission_revocation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre le changement de mot de passe
   */
  public static async logPasswordChanged(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    changedBy?: string,
    isReset?: boolean
  ): Promise<void> {
    const action = isReset ? 'Réinitialisation' : 'Changement'
    await this.log(ctx, 'password_changed', 
      `${action} de mot de passe: ${userName}${changedBy ? ` par ${changedBy}` : ''}`, 
      userId, 
      {
        action: isReset ? 'reset_password' : 'change_password',
        userName,
        changedBy: changedBy || userName,
        isReset: isReset || false,
        adminAction: 'password_modification',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre l'expiration d'une session
   */
  public static async logSessionExpired(
    ctx: HttpContext | null,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    await this.log(ctx, 'session_expired', 
      `Session expirée: ${userName} (${reason})`, 
      userId, 
      {
        action: 'session_expire',
        userName,
        reason,
        adminAction: 'session_management'
      }
    )
  }

  /**
   * Enregistre la modification de la liste blanche IP
   */
  public static async logIpWhitelistUpdated(
    ctx: HttpContext | null,
    ipAddress: string,
    action: 'add' | 'remove',
    updatedBy: string
  ): Promise<void> {
    await this.log(ctx, 'ip_whitelist_updated', 
      `Liste blanche IP ${action === 'add' ? 'ajoutée' : 'retirée'}: ${ipAddress} par ${updatedBy}`, 
      null, 
      {
        action,
        ipAddress,
        updatedBy,
        adminAction: 'ip_whitelist_modification',
        severity: 'critical'
      }
    )
  }

  // ==================== AUDIT RENDEZ-VOUS ====================

  /**
   * Enregistre la création d'un rendez-vous
   */
  public static async logAppointmentCreated(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    createdBy: string
  ): Promise<void> {
    await this.log(ctx, 'appointment_created', 
      `Rendez-vous créé: ${patientName} avec ${doctorName} le ${appointmentDate} par ${createdBy}`, 
      appointmentId, 
      {
        action: 'create',
        patientName,
        doctorName,
        appointmentDate,
        createdBy,
        appointmentAction: 'creation'
      }
    )
  }

  /**
   * Enregistre la modification d'un rendez-vous
   */
  public static async logAppointmentUpdated(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    changes?: Record<string, any>,
    updatedBy?: string
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'appointment_updated', 
      `Rendez-vous modifié: ${patientName}${updatedBy ? ` par ${updatedBy}` : ''}`, 
      appointmentId, 
      {
        action: 'update',
        patientName,
        changedFields,
        updatedBy: updatedBy || 'N/A',
        appointmentAction: 'modification'
      }
    )
  }

  /**
   * Enregistre l'annulation d'un rendez-vous
   */
  public static async logAppointmentCancelled(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    cancelledBy: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'appointment_cancelled', 
      `Rendez-vous annulé: ${patientName} avec ${doctorName} le ${appointmentDate} par ${cancelledBy}${reason ? ` - ${reason}` : ''}`, 
      appointmentId, 
      {
        action: 'cancel',
        patientName,
        doctorName,
        appointmentDate,
        cancelledBy,
        reason: reason || 'Non spécifiée',
        appointmentAction: 'cancellation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre la reprogrammation d'un rendez-vous
   */
  public static async logAppointmentRescheduled(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    oldDate: string,
    newDate: string,
    rescheduledBy: string
  ): Promise<void> {
    await this.log(ctx, 'appointment_rescheduled', 
      `Rendez-vous reprogrammé: ${patientName} de ${oldDate} à ${newDate} par ${rescheduledBy}`, 
      appointmentId, 
      {
        action: 'reschedule',
        patientName,
        oldDate,
        newDate,
        rescheduledBy,
        appointmentAction: 'rescheduling'
      }
    )
  }

  /**
   * Enregistre la confirmation d'un rendez-vous
   */
  public static async logAppointmentConfirmed(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    appointmentDate: string,
    confirmedBy: string
  ): Promise<void> {
    await this.log(ctx, 'appointment_confirmed', 
      `Rendez-vous confirmé: ${patientName} le ${appointmentDate} par ${confirmedBy}`, 
      appointmentId, 
      {
        action: 'confirm',
        patientName,
        appointmentDate,
        confirmedBy,
        appointmentAction: 'confirmation'
      }
    )
  }

  /**
   * Enregistre l'absence à un rendez-vous
   */
  public static async logAppointmentMissed(
    ctx: HttpContext | null,
    appointmentId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    markedBy: string
  ): Promise<void> {
    await this.log(ctx, 'appointment_missed', 
      `Rendez-vous manqué: ${patientName} avec ${doctorName} le ${appointmentDate} (marqué par ${markedBy})`, 
      appointmentId, 
      {
        action: 'mark_missed',
        patientName,
        doctorName,
        appointmentDate,
        markedBy,
        appointmentAction: 'no_show',
        severity: 'high'
      }
    )
  }

  // ==================== AUDIT FINANCE & FACTURATION ====================

  /**
   * Enregistre la création d'une facture
   */
  public static async logInvoiceCreated(
    ctx: HttpContext | null,
    invoiceId: string,
    invoiceNumber: string,
    patientName: string,
    amount: number
  ): Promise<void> {
    await this.log(ctx, 'invoice_created', 
      `Facture créée: ${invoiceNumber} pour ${patientName} (${amount}€)`, 
      invoiceId, 
      {
        action: 'create',
        invoiceNumber,
        patientName,
        amount,
        financeAction: 'invoice_creation'
      }
    )
  }

  /**
   * Enregistre la modification d'une facture
   */
  public static async logInvoiceUpdated(
    ctx: HttpContext | null,
    invoiceId: string,
    invoiceNumber: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'invoice_updated', 
      `Facture modifiée: ${invoiceNumber}`, 
      invoiceId, 
      {
        action: 'update',
        invoiceNumber,
        changedFields,
        financeAction: 'invoice_modification'
      }
    )
  }

  /**
   * Enregistre l'envoi d'une facture
   */
  public static async logInvoiceSent(
    ctx: HttpContext | null,
    invoiceId: string,
    invoiceNumber: string,
    patientName: string,
    sentBy: string
  ): Promise<void> {
    await this.log(ctx, 'invoice_sent', 
      `Facture envoyée: ${invoiceNumber} à ${patientName} par ${sentBy}`, 
      invoiceId, 
      {
        action: 'send',
        invoiceNumber,
        patientName,
        sentBy,
        financeAction: 'invoice_dispatch'
      }
    )
  }

  /**
   * Enregistre la réception d'un paiement
   */
  public static async logPaymentReceived(
    ctx: HttpContext | null,
    paymentId: string,
    invoiceNumber: string,
    amount: number,
    paymentMethod: string,
    patientName?: string
  ): Promise<void> {
    await this.log(ctx, 'payment_received', 
      `Paiement reçu: ${amount}€ (${paymentMethod}) pour ${invoiceNumber}${patientName ? ` - ${patientName}` : ''}`, 
      paymentId, 
      {
        action: 'receive',
        invoiceNumber,
        amount,
        paymentMethod,
        patientName: patientName || 'N/A',
        financeAction: 'payment_reception'
      }
    )
  }

  /**
   * Enregistre un remboursement
   */
  public static async logPaymentRefunded(
    ctx: HttpContext | null,
    refundId: string,
    invoiceNumber: string,
    amount: number,
    reason: string,
    patientName?: string
  ): Promise<void> {
    await this.log(ctx, 'payment_refunded', 
      `Remboursement: ${amount}€ pour ${invoiceNumber}${patientName ? ` - ${patientName}` : ''} (${reason})`, 
      refundId, 
      {
        action: 'refund',
        invoiceNumber,
        amount,
        reason,
        patientName: patientName || 'N/A',
        financeAction: 'payment_refund',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre l'application d'une remise
   */
  public static async logDiscountApplied(
    ctx: HttpContext | null,
    invoiceId: string,
    invoiceNumber: string,
    discountAmount: number,
    discountType: string,
    reason?: string
  ): Promise<void> {
    await this.log(ctx, 'discount_applied', 
      `Remise appliquée: ${discountAmount}€ (${discountType}) sur ${invoiceNumber}`, 
      invoiceId, 
      {
        action: 'discount',
        invoiceNumber,
        discountAmount,
        discountType,
        reason: reason || 'Non spécifiée',
        financeAction: 'discount_application'
      }
    )
  }

  /**
   * Enregistre la création d'une demande de remboursement assurance
   */
  public static async logInsuranceClaimCreated(
    ctx: HttpContext | null,
    claimId: string,
    claimNumber: string,
    patientName: string,
    insuranceName: string,
    amount: number
  ): Promise<void> {
    await this.log(ctx, 'insurance_claim_created', 
      `Demande assurance créée: ${claimNumber} pour ${patientName} (${insuranceName}, ${amount}€)`, 
      claimId, 
      {
        action: 'create',
        claimNumber,
        patientName,
        insuranceName,
        amount,
        financeAction: 'insurance_claim_creation'
      }
    )
  }

  /**
   * Enregistre la mise à jour d'une demande de remboursement assurance
   */
  public static async logInsuranceClaimUpdated(
    ctx: HttpContext | null,
    claimId: string,
    claimNumber: string,
    status: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const changedFields = changes ? Object.keys(changes).join(', ') : 'N/A'
    await this.log(ctx, 'insurance_claim_updated', 
      `Demande assurance mise à jour: ${claimNumber} (${status})`, 
      claimId, 
      {
        action: 'update',
        claimNumber,
        status,
        changedFields,
        financeAction: 'insurance_claim_update'
      }
    )
  }

  /**
   * Enregistre la génération d'un rapport de revenus
   */
  public static async logRevenueReportGenerated(
    ctx: HttpContext | null,
    reportId: string,
    reportType: string,
    period: string,
    totalRevenue: number,
    generatedBy: string
  ): Promise<void> {
    await this.log(ctx, 'revenue_report_generated', 
      `Rapport de revenus généré: ${reportType} (${period}, ${totalRevenue}€) par ${generatedBy}`, 
      reportId, 
      {
        action: 'generate',
        reportType,
        period,
        totalRevenue,
        generatedBy,
        financeAction: 'report_generation',
        severity: 'high'
      }
    )
  }

  /**
   * Enregistre une dépense
   */
  public static async logExpenseRecorded(
    ctx: HttpContext | null,
    expenseId: string,
    expenseCategory: string,
    amount: number,
    description: string,
    recordedBy: string
  ): Promise<void> {
    await this.log(ctx, 'expense_recorded', 
      `Dépense enregistrée: ${expenseCategory} (${amount}€) - ${description} par ${recordedBy}`, 
      expenseId, 
      {
        action: 'record',
        expenseCategory,
        amount,
        description,
        recordedBy,
        financeAction: 'expense_recording'
      }
    )
  }

  /**
   * Enregistre la création d'un plan de paiement
   */
  public static async logPaymentPlanCreated(
    ctx: HttpContext | null,
    planId: string,
    patientName: string,
    totalAmount: number,
    installments: number,
    createdBy: string
  ): Promise<void> {
    await this.log(ctx, 'payment_plan_created', 
      `Plan de paiement créé: ${patientName} (${totalAmount}€ en ${installments} mensualités) par ${createdBy}`, 
      planId, 
      {
        action: 'create',
        patientName,
        totalAmount,
        installments,
        createdBy,
        financeAction: 'payment_plan_creation'
      }
    )
  }

  // ==================== EXPORTS & RAPPORTS ====================

  /**
   * Log d'export de données
   */
  public static async logDataExported(
    ctx: HttpContext | null,
    dataType: string,
    format: string,
    filename: string,
    filters?: string
  ): Promise<void> {
    const filterInfo = filters ? ` (${filters})` : ''
    await this.log(ctx, 'data_exported', 
      `Export ${dataType} au format ${format}: ${filename}${filterInfo}`, 
      null, 
      {
        action: 'export',
        dataType,
        format,
        filename,
        filters,
        exportAction: 'data_export',
        severity: 'medium' // Exports sont sensibles (RGPD)
      }
    )
  }

  /**
   * Log de génération de rapport
   */
  public static async logReportGenerated(
    ctx: HttpContext | null,
    reportType: string,
    reportName: string,
    period?: string,
    recipient?: string
  ): Promise<void> {
    const periodInfo = period ? ` pour la période ${period}` : ''
    const recipientInfo = recipient ? ` destiné à ${recipient}` : ''
    await this.log(ctx, 'report_generated', 
      `Rapport généré: ${reportName} (${reportType})${periodInfo}${recipientInfo}`, 
      null, 
      {
        action: 'generate',
        reportType,
        reportName,
        period,
        recipient,
        reportAction: 'report_generation'
      }
    )
  }

  /**
   * Log d'export en masse
   */
  public static async logBulkExport(
    ctx: HttpContext | null,
    dataType: string,
    recordCount: number,
    format: string
  ): Promise<void> {
    await this.log(ctx, 'bulk_export', 
      `Export en masse: ${recordCount} enregistrements (${dataType}) au format ${format}`, 
      null, 
      {
        action: 'bulk_export',
        dataType,
        recordCount,
        format,
        exportAction: 'bulk_export',
        severity: 'high' // Exports en masse sont très sensibles
      }
    )
  }

  // ==================== WEBHOOKS & INTÉGRATIONS ====================

  /**
   * Log de création de webhook
   */
  public static async logWebhookCreated(
    ctx: HttpContext | null,
    event: string,
    url: string
  ): Promise<void> {
    await this.log(ctx, 'webhook_created', 
      `Webhook créé pour l'événement "${event}": ${url}`, 
      null, 
      {
        action: 'create',
        event,
        url,
        webhookAction: 'webhook_creation'
      }
    )
  }

  /**
   * Log de déclenchement de webhook
   */
  public static async logWebhookTriggered(
    ctx: HttpContext | null,
    event: string,
    url: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    const success = statusCode >= 200 && statusCode < 300
    await this.log(ctx, 'webhook_triggered', 
      `Webhook déclenché: ${event} → ${url} (${statusCode}, ${responseTime}ms)`, 
      null, 
      {
        action: 'trigger',
        event,
        url,
        statusCode,
        responseTime,
        success,
        webhookAction: 'webhook_trigger'
      }
    )
  }

  /**
   * Log d'échec de webhook
   */
  public static async logWebhookFailed(
    ctx: HttpContext | null,
    event: string,
    url: string,
    error: string,
    attempts: number
  ): Promise<void> {
    await this.log(ctx, 'webhook_failed', 
      `Échec webhook: ${event} → ${url} (tentative ${attempts}): ${error}`, 
      null, 
      {
        action: 'failed',
        event,
        url,
        error,
        attempts,
        webhookAction: 'webhook_failure',
        severity: 'medium'
      }
    )
  }

  /**
   * Log de suppression de webhook
   */
  public static async logWebhookDeleted(
    ctx: HttpContext | null,
    event: string,
    url: string
  ): Promise<void> {
    await this.log(ctx, 'webhook_deleted', 
      `Webhook supprimé pour l'événement "${event}": ${url}`, 
      null, 
      {
        action: 'delete',
        event,
        url,
        webhookAction: 'webhook_deletion'
      }
    )
  }

  /**
   * Log d'appel API externe
   */
  public static async logExternalApiCall(
    ctx: HttpContext | null,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number
  ): Promise<void> {
    const success = statusCode >= 200 && statusCode < 300
    await this.log(ctx, 'external_api_call', 
      `Appel API externe: ${method} ${endpoint} (${statusCode}, ${responseTime}ms)`, 
      null, 
      {
        action: 'api_call',
        endpoint,
        method,
        statusCode,
        responseTime,
        success,
        apiAction: 'external_api_call'
      }
    )
  }

  /**
   * Log d'erreur API externe
   */
  public static async logExternalApiError(
    ctx: HttpContext | null,
    endpoint: string,
    method: string,
    error: string
  ): Promise<void> {
    await this.log(ctx, 'external_api_error', 
      `Erreur API externe: ${method} ${endpoint}: ${error}`, 
      null, 
      {
        action: 'api_error',
        endpoint,
        method,
        error,
        apiAction: 'external_api_error',
        severity: 'medium'
      }
    )
  }

  /**
   * Enregistre une action personnalisée avec des informations claires
   * Cette méthode est utilisée pour les notifications et autres actions spécifiques
   */
  public static async logAction(
    ctx: HttpContext | null,
    actionType: string,
    description: string,
    targetId?: string | null,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Améliorer la description si elle contient des informations structurées
    let enhancedDescription = description
    
    // Si c'est une notification, améliorer le formatage
    if (actionType.startsWith('notification_')) {
      // La description est déjà formatée par NotificationService
      // On peut juste s'assurer qu'elle est claire
      enhancedDescription = description
    }
    
    await this.log(ctx, actionType, enhancedDescription, targetId || null, metadata)
  }
}

