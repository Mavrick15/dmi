import Document from '#models/Document'
import DocumentVersion from '#models/document_version'
import DocumentComment from '#models/document_comment'
import DocumentAccess from '#models/document_access'
import DocumentApproval from '#models/document_approval'
import UserProfile from '#models/UserProfile'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import { PDFDocument, rgb, degrees } from 'pdf-lib'

/**
 * Service pour gérer toutes les fonctionnalités avancées des documents
 */
export default class DocumentService {
  /**
   * Créer une nouvelle version d'un document
   */
  static async createVersion(
    documentId: number,
    newFilePath: string,
    createdBy: string,
    changeSummary?: string
  ): Promise<DocumentVersion> {
    const document = await Document.findOrFail(documentId)
    
    // Incrémenter la version
    const newVersionNumber = document.version + 1
    
    // Créer l'entrée de version
    const version = await DocumentVersion.create({
      documentId: document.id,
      versionNumber: newVersionNumber,
      filePath: newFilePath,
      changeSummary: changeSummary || null,
      createdBy,
    })
    
    // Mettre à jour le document principal
    document.version = newVersionNumber
    document.filePath = newFilePath
    await document.save()
    
    return version
  }

  /**
   * Restaurer une version précédente
   */
  static async restoreVersion(documentId: number, versionNumber: number): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    const version = await DocumentVersion.query()
      .where('documentId', documentId)
      .where('versionNumber', versionNumber)
      .firstOrFail()
    
    // Créer une nouvelle version avec l'ancien fichier
    const restoredVersion = await this.createVersion(
      documentId,
      version.filePath,
      document.uploadedBy || '',
      `Restauration de la version ${versionNumber}`
    )
    
    return document
  }

  /**
   * Ajouter des tags à un document
   */
  static async addTags(documentId: number, tags: string[]): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    const currentTags = document.getTagsArray()
    const newTags = [...new Set([...currentTags, ...tags])] // Éviter les doublons
    document.setTagsArray(newTags)
    await document.save()
    return document
  }

  /**
   * Retirer des tags d'un document
   */
  static async removeTags(documentId: number, tags: string[]): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    const currentTags = document.getTagsArray()
    const newTags = currentTags.filter(tag => !tags.includes(tag))
    document.setTagsArray(newTags)
    await document.save()
    return document
  }

  /**
   * Générer une miniature pour un document (image)
   */
  static async generateThumbnail(document: Document): Promise<string | null> {
    if (!document.mimeType.includes('image')) {
      return null
    }
    
    try {
      const fileBuffer = await drive.use().getBytes(document.filePath)
      const thumbnail = await sharp(fileBuffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()
      
      const thumbnailPath = `document_thumbnails/${cuid()}.jpg`
      await drive.use().put(thumbnailPath, thumbnail)
      
      document.thumbnailPath = thumbnailPath
      await document.save()
      
      return thumbnailPath
    } catch (error) {
      logger.error({ err: error, documentId: document.id }, 'Erreur lors de la génération de la miniature')
      return null
    }
  }

  /**
   * Ajouter un watermark à un document PDF
   */
  static async addWatermark(
    document: Document,
    watermarkText: string,
    userId: string
  ): Promise<void> {
    if (!document.mimeType.includes('pdf')) {
      throw new Error('Le watermarking n\'est disponible que pour les PDF')
    }
    
    try {
      const pdfBuffer = await drive.use().getBytes(document.filePath)
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      
      const pages = pdfDoc.getPages()
      const font = await pdfDoc.embedFont('Helvetica-Bold')
      
      pages.forEach((page) => {
        const { width, height } = page.getSize()
        
        // Watermark en diagonale
        // Utiliser rgb() de pdf-lib pour créer la couleur correctement
        page.drawText(watermarkText, {
          x: width / 2 - 100,
          y: height / 2,
          size: 20,
          font,
          color: rgb(0.8, 0.8, 0.8),
          rotate: degrees(-45),
          opacity: 0.3,
        })
      })
      
      const watermarkedPdf = await pdfDoc.save()
      await drive.use().put(document.filePath, watermarkedPdf)
      
      document.isWatermarked = true
      await document.save()
    } catch (error) {
      logger.error({ err: error, documentId: document.id }, 'Erreur lors de l\'ajout du watermark')
      throw error
    }
  }

  /**
   * Vérifier les permissions d'accès à un document
   */
  static async checkAccess(
    documentId: number,
    userId: string,
    userRole: string,
    requiredPermission: 'read' | 'write' | 'delete' = 'read'
  ): Promise<boolean> {
    const document = await Document.findOrFail(documentId)
    
    // Propriétaire ou uploader a tous les droits
    if (document.uploadedBy === userId) {
      return true
    }
    
    // Vérifier les accès explicites
    const access = await DocumentAccess.query()
      .where('documentId', documentId)
      .where((query) => {
        query.where('userId', userId).orWhere('role', userRole)
      })
      .where('permission', requiredPermission)
      .where((query) => {
        query.whereNull('expiresAt').orWhere('expiresAt', '>', DateTime.now().toSQL())
      })
      .first()
    
    if (access) {
      return true
    }
    
    // Vérifier le niveau d'accès du document
    if (document.accessLevel === 'public') {
      return requiredPermission === 'read'
    }
    
    if (document.accessLevel === 'shared') {
      const permissions = document.getAccessPermissions()
      if (permissions.userIds?.includes(userId) || permissions.roleIds?.includes(userRole)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Partager un document avec des utilisateurs/rôles
   */
  static async shareDocument(
    documentId: number,
    userIds: string[],
    roleIds: string[],
    permission: 'read' | 'write' | 'delete',
    expiresAt: DateTime | null,
    grantedBy: string
  ): Promise<void> {
    const document = await Document.findOrFail(documentId)
    
    // Créer les accès pour les utilisateurs
    for (const userId of userIds) {
      await DocumentAccess.updateOrCreate(
        {
          documentId: document.id,
          userId,
          role: null,
        },
        {
          permission,
          expiresAt: expiresAt || null,
          grantedBy,
          grantedAt: DateTime.now(),
        }
      )
    }
    
    // Créer les accès pour les rôles
    for (const roleId of roleIds) {
      await DocumentAccess.updateOrCreate(
        {
          documentId: document.id,
          userId: null,
          role: roleId,
        },
        {
          permission,
          expiresAt: expiresAt || null,
          grantedBy,
          grantedAt: DateTime.now(),
        }
      )
    }
    
    // Mettre à jour le niveau d'accès si nécessaire
    if (userIds.length > 0 || roleIds.length > 0) {
      document.accessLevel = 'shared'
      document.setAccessPermissions({ userIds, roleIds })
      await document.save()
    }
  }

  /**
   * Ajouter un commentaire à un document
   */
  static async addComment(
    documentId: number,
    userId: string,
    content: string,
    parentCommentId: number | null = null,
    annotations: Record<string, any> | null = null
  ): Promise<DocumentComment> {
    const comment = await DocumentComment.create({
      documentId,
      userId,
      content,
      parentCommentId,
      annotations,
      isResolved: false,
    })
    
    return comment
  }

  /**
   * Créer un workflow d'approbation
   */
  static async createApprovalWorkflow(
    documentId: number,
    approvers: { userId: string, stepNumber: number }[]
  ): Promise<DocumentApproval[]> {
    const document = await Document.findOrFail(documentId)
    
    const approvals = []
    for (const approver of approvers) {
      const approval = await DocumentApproval.create({
        documentId: document.id,
        stepNumber: approver.stepNumber,
        approverId: approver.userId,
        status: 'pending',
      })
      approvals.push(approval)
    }
    
    document.status = 'pending_approval'
    document.approvalStep = 1
    await document.save()
    
    return approvals
  }

  /**
   * Approuver/Rejeter une étape d'approbation
   */
  static async processApproval(
    documentId: number,
    stepNumber: number,
    approverId: string,
    status: 'approved' | 'rejected',
    comment: string | null = null
  ): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    const approval = await DocumentApproval.query()
      .where('documentId', documentId)
      .where('stepNumber', stepNumber)
      .where('approverId', approverId)
      .firstOrFail()
    
    approval.status = status
    approval.comment = comment
    approval.approvedAt = DateTime.now()
    await approval.save()
    
    if (status === 'rejected') {
      document.status = 'rejected'
      await document.save()
      return document
    }
    
    // Vérifier si toutes les étapes sont approuvées
    const totalSteps = await DocumentApproval.query()
      .where('documentId', documentId)
      .count('* as total')
      .then(result => Number(result[0]?.$extras.total || 0))
    
    const approvedSteps = await DocumentApproval.query()
      .where('documentId', documentId)
      .where('status', 'approved')
      .count('* as total')
      .then(result => Number(result[0]?.$extras.total || 0))
    
    if (approvedSteps >= totalSteps) {
      document.status = 'approved'
      document.approvedBy = approverId
      document.approvedAt = DateTime.now()
      document.approvalStep = totalSteps
    } else {
      document.approvalStep = stepNumber + 1
    }
    
    await document.save()
    return document
  }

  /**
   * Archiver un document
   */
  static async archiveDocument(documentId: number): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    document.isArchived = true
    document.archivedAt = DateTime.now()
    await document.save()
    return document
  }

  /**
   * Désarchiver un document
   */
  static async unarchiveDocument(documentId: number): Promise<Document> {
    const document = await Document.findOrFail(documentId)
    document.isArchived = false
    document.archivedAt = null
    await document.save()
    return document
  }

  /**
   * Incrémenter le compteur de vues
   */
  static async incrementViewCount(documentId: number, userId: string): Promise<void> {
    const document = await Document.findOrFail(documentId)
    document.viewCount = (document.viewCount || 0) + 1
    document.lastViewedAt = DateTime.now()
    document.lastViewedBy = userId
    await document.save()
  }

  /**
   * Incrémenter le compteur de téléchargements
   */
  static async incrementDownloadCount(documentId: number): Promise<void> {
    const document = await Document.findOrFail(documentId)
    document.downloadCount = (document.downloadCount || 0) + 1
    await document.save()
  }
}

