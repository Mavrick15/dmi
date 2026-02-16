import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import db from '@adonisjs/lucid/services/db'
import { cuid } from '@adonisjs/core/helpers'
import { PDFDocument } from 'pdf-lib' 
import Document from '#models/Document'
import Patient from '#models/Patient'
import UserProfile from '#models/UserProfile'
import DocumentVersion from '#models/document_version'
import DocumentComment from '#models/document_comment'
import DocumentAccess from '#models/document_access'
import DocumentApproval from '#models/document_approval'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import NotificationService from '#services/NotificationService'
import DocumentService from '#services/DocumentService'
import { DocumentTransformer } from '../transformers/DocumentTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { DateTime } from 'luxon'
import JSZip from 'jszip'
import CacheService from '#services/CacheService'

export default class DocumentsController {
  
  // --- LISTING ---
  public async indexAll({ request, response }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 20, 100)
    const search = request.input('search')

    // Validation de la recherche
    if (search) {
      const searchTrimmed = search.trim()
      if (searchTrimmed.length < 2) {
        throw AppException.badRequest('La recherche doit contenir au moins 2 caractères')
      }
      if (searchTrimmed.length > 100) {
        throw AppException.badRequest('La recherche ne peut pas dépasser 100 caractères')
      }
    }

    const query = Document.query()
      .preload('uploader', (q) => q.select('nomComplet'))
      .preload('signer', (q) => q.select('nomComplet'))
      .preload('patient', (q) => q.select('id', 'numeroPatient'))
      .orderBy('created_at', 'desc')

    if (search) {
      const searchTerm = search.trim()
      query.where((q) => {
        q.where('title', 'ilike', `%${searchTerm}%`)
         .orWhere('originalName', 'ilike', `%${searchTerm}%`)
         .orWhereHas('patient', (pQuery) => {
            pQuery.where('numeroPatient', 'ilike', `%${searchTerm}%`)
         })
      })
    }

    const documents = await query.paginate(page, limit)
    return response.ok(documents)
  }

  public async index({ params, response }: HttpContext) {
    try {
      // Validation UUID pour patientId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.patientId)) {
        throw AppException.badRequest('Format UUID invalide pour patientId')
      }

      const documents = await Document.query()
        .where('patient_id', params.patientId)
        .preload('uploader', (q) => q.select('nomComplet'))
        .preload('signer', (q) => q.select('nomComplet'))
        .preload('patient', (q) => q.preload('user'))
        .orderBy('created_at', 'desc')

      const transformedDocuments = DocumentTransformer.transformMany(documents, true)

      return response.json(ApiResponse.success(transformedDocuments))
    } catch (error) {
      logger.error({ err: error, patientId: params.patientId }, 'Erreur lors de la récupération des documents du patient')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors du chargement des documents.')
    }
  }

  // --- UPLOAD (Compatible S3 & Local) ---
  public async store({ request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    
    // Vérification patient - accepter les deux formats (camelCase et snake_case)
    const patientId = request.input('patientId') || request.input('patient_id')
    
    if (!patientId) {
      throw AppException.badRequest('Le patientId est requis.')
    }
    
    // Charger le patient avec ses relations pour l'utiliser plus tard
    const patient = await Patient.findOrFail(patientId)
    await patient.load('user') 

    const file = request.file('file', { 
      size: '100mb', 
      extnames: ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'txt', 'dicom'] 
    })

    if (!file) {
      const error: any = new Error('Aucun fichier fourni.')
      error.status = 400
      throw error
    }

    if (!file.isValid) {
      const error: any = new Error(`Fichier invalide: ${file.errors.map(e => e.message).join(', ')}`)
      error.status = 400
      throw error
    }

    // Génération nom unique et chemin
    // Note: on utilise pas file.move() mais file.moveToDisk()
    const key = `patient_docs/${cuid()}.${file.extname}`
    
    const trx = await db.transaction()

    try {
      // Écriture sur le disque configuré (fs ou s3)
      await file.moveToDisk(key)

      const tags = request.input('tags') ? JSON.parse(request.input('tags')) : []
      const description = request.input('description') || null
      
      const doc = await Document.create({
        patientId: patientId,
        uploadedBy: user.id,
        title: request.input('title') || file.clientName,
        category: request.input('category') || 'general',
        filePath: key,
        originalName: file.clientName,
        mimeType: `${file.type}/${file.subtype}`,
        size: file.size,
        version: 1,
        description,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        status: 'draft',
        accessLevel: 'private',
        downloadCount: 0,
        viewCount: 0,
      }, { client: trx })
      
      // Générer une miniature si c'est une image
      if (file.type === 'image') {
        await DocumentService.generateThumbnail(doc).catch(err => {
          logger.warn({ err, documentId: doc.id }, 'Échec génération miniature')
        })
      }
      
      // Ajouter un watermark si demandé
      if (request.input('addWatermark') === 'true' && file.subtype === 'pdf') {
        const watermarkText = `${patient.user?.nomComplet || 'Patient'} - ${DateTime.now().toFormat('dd/MM/yyyy')}`
        await DocumentService.addWatermark(doc, watermarkText, user.id).catch(err => {
          logger.warn({ err, documentId: doc.id }, 'Échec ajout watermark')
        })
      }

      await trx.commit()
      await CacheService.deleteAsync('documents:stats')

      // Log d'audit - Création de document
      const patientName = patient.user?.nomComplet || 'Patient'
      await AuditService.logDocumentCreated(
        { auth, request, response } as HttpContext,
        String(doc.id),
        doc.title || doc.originalName,
        doc.category,
        patientName
      )

      // Notification de document uploadé (utiliser le patient déjà chargé)
      await NotificationService.notifyDocumentUploaded(
        String(doc.id),
        doc.title || doc.originalName,
        patientId,
        patientName,
        user.id
      )

      const transformedDoc = DocumentTransformer.transform(doc, true)

      return response.status(201).json(
        ApiResponse.created(
          transformedDoc,
          'Document uploadé avec succès.'
        )
      )

    } catch (error) {
      await trx.rollback()
      // Nettoyage si erreur (tentative de suppression du fichier orphelin)
      try { await drive.use().delete(key) } catch {}
      throw error 
    }
  }

  // --- PRÉVISUALISATION ---
  public async preview({ params, response }: HttpContext) {
    const doc = await Document.findOrFail(params.id) 
    
    // Vérifier si le fichier existe
    const exists = await drive.use().exists(doc.filePath)
    if (!exists) {
        throw AppException.notFound('Fichier')
    }

    // Récupérer le flux (stream) depuis le disque (local ou s3)
    const stream = await drive.use().getStream(doc.filePath)
    
    response.header('Content-Type', doc.mimeType)
    response.header('Content-Disposition', `inline; filename="${doc.originalName}"`)
    
    return response.stream(stream)
  }

  // --- TÉLÉCHARGEMENT ---
  public async download({ params, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const doc = await Document.findOrFail(params.id)
    
    // Vérifier les permissions d'accès
    const hasAccess = await DocumentService.checkAccess(doc.id, user.id, user.role, 'read')
    if (!hasAccess) {
      throw AppException.forbidden('Vous n\'avez pas accès à ce document')
    }
    
    // Incrémenter le compteur de téléchargements
    await DocumentService.incrementDownloadCount(doc.id).catch(() => {})
    
    // Log d'audit - Téléchargement de document
    await doc.load('patient', (q) => q.preload('user'))
    const patientName = doc.patient?.user?.nomComplet
    await AuditService.logDocumentDownloaded(
      { auth, request: {} as any, response } as HttpContext,
      String(doc.id),
      doc.title || doc.originalName,
      user.nomComplet || user.email,
      patientName
    )
    
    const exists = await drive.use().exists(doc.filePath)
    if (!exists) throw AppException.notFound('Fichier')

    const stream = await drive.use().getStream(doc.filePath)
    
    response.header('Content-Type', doc.mimeType)
    response.header('Content-Disposition', `attachment; filename="${doc.originalName}"`)
    
    return response.stream(stream)
  }

  // --- SIGNATURE PDF (In-Memory pour compatibilité Cloud) ---
  public async sign({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const doc = await Document.findOrFail(params.id) 

    if (!doc.mimeType.includes('pdf')) {
        throw AppException.badRequest("Seuls les PDF peuvent être signés.")
    }

    const { signatureImage } = request.only(['signatureImage'])
    if (!signatureImage) {
        throw AppException.badRequest("Données de signature manquantes.")
    }
    
    try {
        // 1. Lire le fichier original en Buffer (marche pour FS et S3)
        const pdfBuffer = await drive.use().getBytes(doc.filePath)
        
        // 2. Charger dans PDF-Lib
        const pdfDoc = await PDFDocument.load(pdfBuffer)
    
        // 3. Intégrer la signature (PNG base64)
        const signatureBytes = Buffer.from(signatureImage.split(',')[1], 'base64')
        const signatureImageEmbed = await pdfDoc.embedPng(signatureBytes)
    
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]
        const { width } = firstPage.getSize()
        const sigDims = signatureImageEmbed.scale(0.5)
    
        firstPage.drawImage(signatureImageEmbed, {
          x: width - sigDims.width - 50,
          y: 50,
          width: sigDims.width,
          height: sigDims.height,
        })
    
        // 4. Sauvegarder le PDF modifié
        const modifiedPdfBytes = await pdfDoc.save()

        // 5. Écraser le fichier sur le disque (FS ou S3)
        await drive.use().put(doc.filePath, modifiedPdfBytes)
    
        // 6. Mettre à jour le titre et le statut de signature en base
        if (!doc.title.includes('(Signé)')) {
          doc.title = `${doc.title} (Signé)`
        }
        doc.isSigned = true
        doc.signedBy = user.id
        doc.signedAt = DateTime.now()
        await doc.save()
        await CacheService.deleteAsync('documents:stats')
        
        // Charger la relation signer pour l'inclure dans la réponse
        await doc.load('signer', (q) => q.select('nomComplet'))
        
        // Log d'audit - Signature électronique
        await AuditService.logDocumentSigned(
          { auth, request, response } as HttpContext,
          String(doc.id),
          doc.title || doc.originalName,
          user.nomComplet || user.email,
          'electronic_signature'
        )
    
        return response.json(
          ApiResponse.success(
            DocumentTransformer.transform(doc, true),
            "Document signé avec succès !"
          )
        )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la signature du document')
      throw error
    }
  }

  // --- SUPPRESSION ---
  public async destroy({ params, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    // Vérification supplémentaire : seuls les admins et gestionnaires peuvent supprimer
    if (user.role !== 'admin' && user.role !== 'gestionnaire') {
      const userName = user.nomComplet || user.email || 'Utilisateur'
      throw AppException.forbidden(userName)
    }

    const trx = await db.transaction()

    try {
        const doc = await Document.findOrFail(params.id, { client: trx })
        const filePath = doc.filePath
        
        // Récupérer les informations nécessaires pour la notification avant la suppression
        const documentTitle = doc.title || doc.originalName
        const uploadedBy = doc.uploadedBy
        let patientId: string | null = null
        let patientName: string | null = null
        
        if (doc.patientId) {
          patientId = doc.patientId
          try {
            const patient = await Patient.find(doc.patientId)
            if (patient) {
              await patient.load('user')
              patientName = patient.user?.nomComplet || null
            }
          } catch (error) {
            logger.debug({ patientId: doc.patientId, err: error }, 'Impossible de charger le patient pour notification de suppression')
          }
        }

        // Suppression DB
        await doc.delete()

        // Suppression Fichier Physique (asynchrone, on attend pas forcément le résultat critique)
        await drive.use().delete(filePath).catch(err => {
            logger.warn({ err }, 'Fichier physique non supprimé lors de la suppression du document')
        })

        await trx.commit()

        // Notification de suppression (après le commit)
        await NotificationService.notifyDocumentDeleted(
          String(doc.id),
          documentTitle,
          patientId,
          patientName,
          user.id,
          uploadedBy
        )

        // Log d'audit - Suppression de document
        await AuditService.logDocumentDeleted(
          { auth, request: {} as any, response } as HttpContext,
          String(doc.id),
          documentTitle,
          'Suppression demandée par utilisateur autorisé'
        )

        return response.json(
          ApiResponse.deleted('Document supprimé')
        )
    } catch (error) {
        await trx.rollback()
        throw error
    }
  }

  // ========== PHASE 1: VERSIONS, TAGS, ACCÈS ==========

  /**
   * Obtenir toutes les versions d'un document
   */
  public async getVersions({ params, response }: HttpContext) {
    const versions = await DocumentVersion.query()
      .where('documentId', params.id)
      .preload('creator', (q) => q.select('nomComplet', 'email'))
      .orderBy('versionNumber', 'desc')
    
    return response.json(ApiResponse.success(versions))
  }

  /**
   * Restaurer une version précédente
   */
  public async restoreVersion({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const versionNumber = request.input('versionNumber')
    
    if (!versionNumber) {
      throw AppException.badRequest('Le numéro de version est requis')
    }
    
    const document = await DocumentService.restoreVersion(params.id, versionNumber)
    
    // Log d'audit - Création de nouvelle version (restauration)
    await AuditService.logDocumentVersionCreated(
      { auth, request, response } as HttpContext,
      String(document.id),
      document.title,
      document.version,
      user.nomComplet || user.email
    )
    
    // Log d'audit - Restauration de version
    await AuditService.logDocumentRestored(
      { auth, request, response } as HttpContext,
      String(document.id),
      document.title,
      `Restauration de la version ${versionNumber}`
    )
    
    return response.json(ApiResponse.success(
      DocumentTransformer.transform(document, true),
      `Version ${versionNumber} restaurée avec succès`
    ))
  }

  /**
   * Ajouter/Retirer des tags
   */
  public async updateTags({ params, request, response, auth }: HttpContext) {
    const action = request.input('action') // 'add' ou 'remove'
    const tags = request.input('tags') // Array de tags
    const user = auth.user as UserProfile
    
    if (!Array.isArray(tags) || tags.length === 0) {
      throw AppException.badRequest('Les tags sont requis')
    }
    
    const document = action === 'add'
      ? await DocumentService.addTags(params.id, tags)
      : await DocumentService.removeTags(params.id, tags)
    
    // Log d'audit - Modification de document (tags)
    await AuditService.logDocumentUpdated(
      { auth, request, response } as HttpContext,
      String(document.id),
      document.title,
      user.nomComplet || user.email,
      { tags, action }
    )
    
    return response.json(ApiResponse.success(
      DocumentTransformer.transform(document, true),
      `Tags ${action === 'add' ? 'ajoutés' : 'retirés'} avec succès`
    ))
  }

  /**
   * Partager un document
   */
  public async share({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const userIds = request.input('userIds', [])
    const roleIds = request.input('roleIds', [])
    const permission = request.input('permission', 'read')
    const expiresAt = request.input('expiresAt') 
      ? DateTime.fromISO(request.input('expiresAt'))
      : null
    
    await DocumentService.shareDocument(
      params.id,
      userIds,
      roleIds,
      permission,
      expiresAt,
      user.id
    )
    
    const document = await Document.findOrFail(params.id)
    
    // Log d'audit - Partage de document
    const sharedWithNames = userIds.length > 0 
      ? `${userIds.length} utilisateur(s)` 
      : `Rôle(s): ${roleIds.join(', ')}`
    await AuditService.logDocumentShared(
      { auth, request, response } as HttpContext,
      String(document.id),
      document.title,
      sharedWithNames,
      user.nomComplet || user.email
    )
    
    // Log d'audit - Accès accordé pour chaque utilisateur (RGPD)
    if (userIds.length > 0) {
      for (const userId of userIds) {
        // Récupérer le nom de l'utilisateur
        const grantedUser = await UserProfile.find(userId)
        if (grantedUser) {
          await AuditService.logDocumentAccessGranted(
            { auth, request, response } as HttpContext,
            String(document.id),
            document.title,
            grantedUser.nomComplet || grantedUser.email,
            user.nomComplet || user.email
          )
        }
      }
    }
    
    return response.json(ApiResponse.success(null, 'Document partagé avec succès'))
  }

  /**
   * Révoquer l'accès à un document
   */
  public async revokeAccess({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const accessId = request.input('accessId') // ID de l'accès à révoquer
    
    if (!accessId) {
      throw AppException.badRequest('L\'ID de l\'accès est requis')
    }
    
    // Trouver l'accès et le supprimer
    const access = await DocumentAccess.findOrFail(accessId)
    await access.load('userProfile', (q) => q.select('nomComplet', 'email'))
    await access.load('document')
    
    const revokedFromName = access.userProfile?.nomComplet || access.userProfile?.email || 'Utilisateur'
    const documentName = access.document?.title || 'Document'
    
    await access.delete()
    
    // Log d'audit - Accès révoqué (RGPD)
    await AuditService.logDocumentAccessRevoked(
      { auth, request, response } as HttpContext,
      String(access.documentId),
      documentName,
      revokedFromName,
      user.nomComplet || user.email
    )
    
    return response.json(ApiResponse.success(null, 'Accès révoqué avec succès'))
  }

  /**
   * Ajouter un commentaire
   */
  public async addComment({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const content = request.input('content')
    const parentCommentId = request.input('parentCommentId')
    const annotations = request.input('annotations')
    
    if (!content) {
      throw AppException.badRequest('Le contenu du commentaire est requis')
    }
    
    const comment = await DocumentService.addComment(
      params.id,
      user.id,
      content,
      parentCommentId || null,
      annotations || null
    )
    
    await comment.load('user', (q) => q.select('nomComplet', 'email'))
    
    return response.json(ApiResponse.created(comment, 'Commentaire ajouté avec succès'))
  }

  /**
   * Obtenir les commentaires d'un document
   */
  public async getComments({ params, response }: HttpContext) {
    const comments = await DocumentComment.query()
      .where('documentId', params.id)
      .preload('user', (q) => q.select('nomComplet', 'email'))
      .preload('parentComment')
      .orderBy('createdAt', 'asc')
    
    return response.json(ApiResponse.success(comments))
  }

  /**
   * Créer un workflow d'approbation
   */
  public async createApprovalWorkflow({ params, request, response, auth }: HttpContext) {
    const approvers = request.input('approvers') // [{ userId, stepNumber }]
    
    if (!Array.isArray(approvers) || approvers.length === 0) {
      throw AppException.badRequest('Les approbateurs sont requis')
    }
    
    const approvals = await DocumentService.createApprovalWorkflow(params.id, approvers)
    
    const document = await Document.findOrFail(params.id)
    
    await AuditService.logUpdate(
      { auth, request, response } as HttpContext,
      'document',
      String(document.id),
      document.title,
      { action: 'approval_workflow_created', approversCount: approvers.length }
    )
    
    return response.json(ApiResponse.success(approvals, 'Workflow d\'approbation créé'))
  }

  /**
   * Approuver/Rejeter une étape
   */
  public async processApproval({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const stepNumber = request.input('stepNumber')
    const status = request.input('status') // 'approved' ou 'rejected'
    const comment = request.input('comment')
    
    if (!stepNumber || !status) {
      throw AppException.badRequest('Le numéro d\'étape et le statut sont requis')
    }
    
    const document = await DocumentService.processApproval(
      params.id,
      stepNumber,
      user.id,
      status,
      comment || null
    )
    
    await AuditService.logUpdate(
      { auth, request, response } as HttpContext,
      'document',
      String(document.id),
      document.title,
      { action: 'approval_processed', stepNumber, status }
    )
    
    return response.json(ApiResponse.success(
      DocumentTransformer.transform(document, true),
      `Étape ${stepNumber} ${status === 'approved' ? 'approuvée' : 'rejetée'}`
    ))
  }

  /**
   * Archiver/Désarchiver un document
   */
  public async toggleArchive({ params, request, response, auth }: HttpContext) {
    const action = request.input('action') // 'archive' ou 'unarchive'
    const user = auth.user as UserProfile
    
    const document = action === 'archive'
      ? await DocumentService.archiveDocument(params.id)
      : await DocumentService.unarchiveDocument(params.id)
    await CacheService.deleteAsync('documents:stats')
    
    // Log d'audit - Archivage de document
    if (action === 'archive') {
      await AuditService.logDocumentArchived(
        { auth, request, response } as HttpContext,
        String(document.id),
        document.title,
        user.nomComplet || user.email
      )
    } else {
      // Pour le désarchivage, on utilise logUpdate
      await AuditService.logUpdate(
        { auth, request, response } as HttpContext,
        'document',
        String(document.id),
        document.title,
        { action: 'unarchive' }
      )
    }
    
    return response.json(ApiResponse.success(
      DocumentTransformer.transform(document, true),
      `Document ${action === 'archive' ? 'archivé' : 'désarchivé'} avec succès`
    ))
  }

  /**
   * Ajouter un watermark
   */
  public async addWatermark({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const watermarkText = request.input('watermarkText') || 
      `${user.nomComplet || 'Utilisateur'} - ${DateTime.now().toFormat('dd/MM/yyyy')}`
    
    const document = await Document.findOrFail(params.id)
    await DocumentService.addWatermark(document, watermarkText, user.id)
    
    await AuditService.logUpdate(
      { auth, request, response } as HttpContext,
      'document',
      String(document.id),
      document.title,
      { action: 'watermark_added' }
    )
    
    return response.json(ApiResponse.success(
      DocumentTransformer.transform(document, true),
      'Watermark ajouté avec succès'
    ))
  }

  /**
   * Export en masse (ZIP)
   */
  public async exportBulk({ request, response }: HttpContext) {
    const documentIds = request.input('documentIds') // Array d'IDs
    
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw AppException.badRequest('Les IDs des documents sont requis')
    }
    
    if (documentIds.length > 100) {
      throw AppException.badRequest('Maximum 100 documents par export')
    }
    
    const documents = await Document.query()
      .whereIn('id', documentIds)
      .preload('patient', (q) => q.preload('user'))
    
    const zip = new JSZip()
    
    for (const doc of documents) {
      try {
        const fileBuffer = await drive.use().getBytes(doc.filePath)
        const fileName = `${doc.patient?.user?.nomComplet || 'Patient'}_${doc.title || doc.originalName}`
        zip.file(fileName, fileBuffer)
      } catch (error) {
        logger.warn({ err: error, documentId: doc.id }, 'Document non inclus dans l\'export')
      }
    }
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    
    response.header('Content-Type', 'application/zip')
    response.header('Content-Disposition', `attachment; filename="documents_export_${DateTime.now().toFormat('yyyy-MM-dd')}.zip"`)
    
    return response.send(zipBuffer)
  }

  /**
   * Recherche full-text (avec OCR)
   */
  public async searchFullText({ request, response }: HttpContext) {
    const query = request.input('query')
    const { page, limit } = PaginationHelper.fromRequest(request, 20, 100)
    
    if (!query || query.length < 3) {
      throw AppException.badRequest('La requête de recherche doit contenir au moins 3 caractères')
    }
    
    const documents = await Document.query()
      .where((q) => {
        q.where('title', 'ilike', `%${query}%`)
          .orWhere('originalName', 'ilike', `%${query}%`)
          .orWhere('description', 'ilike', `%${query}%`)
          .orWhere('extractedText', 'ilike', `%${query}%`) // Recherche dans le texte extrait
      })
      .where('isArchived', false)
      .preload('uploader', (q) => q.select('nomComplet'))
      .preload('patient', (q) => q.select('id', 'numeroPatient'))
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)
    
    return response.json(ApiResponse.paginated(
      DocumentTransformer.transformMany(documents.all(), true),
      documents.currentPage,
      documents.perPage,
      documents.total
    ))
  }

  /**
   * Incrémenter le compteur de vues
   */
  public async trackView({ params, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    await DocumentService.incrementViewCount(params.id, user.id)
    
    // Log d'audit - Consultation de document (RGPD)
    const document = await Document.findOrFail(params.id)
    await document.load('patient', (q) => q.preload('user'))
    const patientName = document.patient?.user?.nomComplet
    await AuditService.logDocumentViewed(
      { auth, request: {} as any, response } as HttpContext,
      String(document.id),
      document.title,
      user.nomComplet || user.email,
      patientName
    )
    
    return response.json(ApiResponse.success(null))
  }

  /**
   * Statistiques complètes des documents
   */
  public async stats({ response }: HttpContext) {
    try {
      const cacheKey = 'documents:stats'
      const cached = await CacheService.getAsync(cacheKey)
      if (cached !== undefined) {
        return response.json(ApiResponse.success(cached))
      }

      const today = DateTime.now().toSQLDate()

      const [
        totalDocuments,
        archivedDocuments,
        pendingSignatures,
        totalSigned,
        signedToday,
        totalViews,
        totalDownloads,
        totalStorage
      ] = await Promise.all([
        Document.query().count('* as total'),
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_archived = true`),
        // Attente de signature : tous les documents non signés
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_signed = false`),
        // Documents signés : intégralité des documents signés (sans exception)
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_signed = true`),
        // Signés aujourd'hui : documents signés dont la date de signature est aujourd'hui
        db.rawQuery(`
          SELECT COUNT(*) as total 
          FROM documents 
          WHERE is_signed = true 
          AND DATE(updated_at) = CURRENT_DATE
        `),
        db.rawQuery(`
          SELECT COALESCE(SUM(view_count), 0) as total
          FROM documents
        `),
        db.rawQuery(`
          SELECT COALESCE(SUM(download_count), 0) as total
          FROM documents
        `),
        db.rawQuery(`
          SELECT COALESCE(SUM(size), 0) as total
          FROM documents
        `)
      ])

      const stats = {
        totalDocuments: Number(totalDocuments[0].$extras.total),
        archivedDocuments: Number(archivedDocuments.rows[0]?.total || 0),
        pendingSignatures: Number(pendingSignatures.rows[0]?.total || 0), // Tous les documents non signés
        totalSigned: Number(totalSigned.rows[0]?.total || 0), // Intégralité des documents signés
        signedToday: Number(signedToday.rows[0]?.total || 0), // Documents signés aujourd'hui
        totalViews: Number(totalViews.rows[0]?.total || 0),
        totalDownloads: Number(totalDownloads.rows[0]?.total || 0),
        storageUsed: `${(Number(totalStorage.rows[0]?.total || 0) / (1024 * 1024)).toFixed(1)} MB`
      }
      await CacheService.setAsync(cacheKey, stats, 60)
      return response.json(ApiResponse.success(stats))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques des documents')
      throw AppException.internal('Erreur lors du chargement des statistiques.')
    }
  }
}