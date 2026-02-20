import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import db from '@adonisjs/lucid/services/db'
import { cuid } from '@adonisjs/core/helpers'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
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
export default class DocumentsController {
  // --- LISTING ---
  public async indexAll({ request, response, auth }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 20, 100)
    const search = request.input('search')
    const user = auth.user as UserProfile

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

    // Ne montrer que les documents dont l'utilisateur est propriétaire OU avec lesquels il a un accès partagé (sauf admin/gestionnaire qui voient tout)
    const canSeeAll = user?.role === 'admin' || user?.role === 'gestionnaire'
    if (!canSeeAll && user?.id) {
      const now = DateTime.now().toSQL()
      const sharedDocumentIds = db
        .from('document_accesses')
        .select('document_id')
        .where((q) => {
          q.where((sq) => {
            sq.where('user_id', user.id).orWhere((r) => {
              r.whereNull('user_id').where('role', user.role ?? '')
            })
          }).andWhere((eq) => {
            eq.whereNull('expires_at').orWhere('expires_at', '>', now)
          })
        })
      query.where((q) => {
        q.where('uploaded_by', user.id).orWhereIn('id', sharedDocumentIds)
      })
    }

    if (search) {
      const searchTerm = search.trim()
      query.andWhere((q) => {
        q.where('title', 'ilike', `%${searchTerm}%`)
          .orWhere('originalName', 'ilike', `%${searchTerm}%`)
          .orWhereHas('patient', (pQuery) => {
            pQuery.where('numeroPatient', 'ilike', `%${searchTerm}%`)
          })
      })
    }

    const documents = await query.paginate(page, limit)
    const meta = documents.getMeta()
    const list = documents.all()
    const data = list.map((doc) => {
      const item = typeof doc.serialize === 'function' ? doc.serialize() : doc
      const isSharedWithMe = !canSeeAll && !!user?.id && doc.uploadedBy !== user.id
      return { ...item, isSharedWithMe }
    })
    return response.ok({ meta, data })
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
      logger.error(
        { err: error, patientId: params.patientId },
        'Erreur lors de la récupération des documents du patient'
      )
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

    // Pour un infirmier : le document doit être attribué à un médecin (propriétaire = médecin)
    let uploadedByUserId: string = user.id
    if (user.role === 'infirmiere') {
      const attributedToUserId = request.input('attributedToUserId') || request.input('attributed_to_user_id')
      if (!attributedToUserId) {
        throw AppException.badRequest(
          'En tant qu\'infirmier(ère), vous devez choisir le médecin auquel ce document sera attribué.'
        )
      }
      const attributedUser = await UserProfile.find(attributedToUserId)
      if (!attributedUser || !['docteur_clinique', 'docteur_labo'].includes(attributedUser.role)) {
        throw AppException.badRequest('Le document doit être attribué à un médecin valide.')
      }
      uploadedByUserId = attributedUser.id
    }

    // Charger le patient avec ses relations pour l'utiliser plus tard
    const patient = await Patient.findOrFail(patientId)
    await patient.load('user')

    const file = request.file('file', {
      size: '100mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'txt', 'dicom'],
    })

    if (!file) {
      const error: any = new Error('Aucun fichier fourni.')
      error.status = 400
      throw error
    }

    if (!file.isValid) {
      const error: any = new Error(
        `Fichier invalide: ${file.errors.map((e) => e.message).join(', ')}`
      )
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

      const description = request.input('description') || null

      const doc = await Document.create(
        {
          patientId: patientId,
          uploadedBy: uploadedByUserId,
          title: request.input('title') || file.clientName,
          category: request.input('category') || 'general',
          filePath: key,
          originalName: file.clientName,
          mimeType: `${file.type}/${file.subtype}`,
          size: file.size,
          version: 1,
          description,
          status: 'draft',
          accessLevel: 'private',
          downloadCount: 0,
          viewCount: 0,
        },
        { client: trx }
      )

      // Générer une miniature si c'est une image
      if (file.type === 'image') {
        await DocumentService.generateThumbnail(doc).catch((err) => {
          logger.warn({ err, documentId: doc.id }, 'Échec génération miniature')
        })
      }

      await trx.commit()

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

      return response
        .status(201)
        .json(ApiResponse.created(transformedDoc, 'Document uploadé avec succès.'))
    } catch (error) {
      await trx.rollback()
      // Nettoyage si erreur (tentative de suppression du fichier orphelin)
      try {
        await drive.use().delete(key)
      } catch {}
      throw error
    }
  }

  // --- PRÉVISUALISATION ---
  public async preview({ params, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const doc = await Document.findOrFail(params.id)

    const hasAccess = await DocumentService.checkAccess(doc.id, user.id, user.role, 'read')
    if (!hasAccess) {
      throw AppException.forbiddenWithMessage(
        "Vous n'avez pas accès à ce document. Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur système."
      )
    }

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
      throw AppException.forbiddenWithMessage(
        "Vous n'avez pas accès à ce document. Si vous pensez qu'il s'agit d'une erreur, contactez l'administrateur système."
      )
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

    // Seul le médecin propriétaire du document (uploader) peut le signer
    if (doc.uploadedBy !== user.id) {
      throw AppException.forbiddenWithMessage('Seul le médecin propriétaire du document peut le signer.')
    }

    if (!doc.mimeType.includes('pdf')) {
      throw AppException.badRequest('Seuls les PDF peuvent être signés.')
    }

    const { signatureImage } = request.only(['signatureImage'])
    if (!signatureImage) {
      throw AppException.badRequest('Données de signature manquantes.')
    }

    try {
      // 1. Lire le fichier original en Buffer (marche pour FS et S3)
      const pdfBuffer = await drive.use().getBytes(doc.filePath)

      // 2. Charger dans PDF-Lib
      const pdfDoc = await PDFDocument.load(pdfBuffer)

      // 3. Intégrer la signature (PNG base64) sur la DERNIÈRE page, en bas à droite
      const signatureBytes = Buffer.from(signatureImage.split(',')[1], 'base64')
      const signatureImageEmbed = await pdfDoc.embedPng(signatureBytes)

      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { width, height } = lastPage.getSize()
      const margin = 50
      const sigScale = 0.5
      const sigDims = signatureImageEmbed.scale(sigScale)

      // Position : bas à droite (origine PDF = bas gauche, y vers le haut)
      const sigX = width - sigDims.width - margin
      const sigY = margin

      lastPage.drawImage(signatureImageEmbed, {
        x: sigX,
        y: sigY,
        width: sigDims.width,
        height: sigDims.height,
      })

      // 3b. Nom du médecin signataire sous la signature
      const doctorName = user.nomComplet || user.email || 'Médecin'
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const fontSize = 10
      const textWidth = font.widthOfTextAtSize(doctorName, fontSize)
      const textX = Math.max(sigX, width - margin - textWidth)
      const textY = sigY - 18

      lastPage.drawText(doctorName, {
        font,
        size: fontSize,
        x: textX,
        y: textY,
        color: rgb(0.2, 0.2, 0.2),
      })

      // 4. Sauvegarder le PDF modifié
      const modifiedPdfBytes = await pdfDoc.save()

      // 5. Écraser le fichier sur le disque (FS ou S3)
      await drive.use().put(doc.filePath, modifiedPdfBytes)

      // 6. Mettre à jour le statut de signature en base (le titre reste inchangé)
      doc.isSigned = true
      doc.signedBy = user.id
      doc.signedAt = DateTime.now()
      await doc.save()

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
          'Document signé avec succès !'
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

    const doc = await Document.find(params.id)
    if (!doc) {
      throw AppException.notFound('Document')
    }

    // Seuls le médecin propriétaire (uploader), les admins et gestionnaires peuvent supprimer
    const isOwner = doc.uploadedBy === user.id
    const isAdminOrGestionnaire = user.role === 'admin' || user.role === 'gestionnaire'
    if (!isOwner && !isAdminOrGestionnaire) {
      throw AppException.forbiddenWithMessage(
        'Seul le médecin propriétaire du document ou un administrateur peut le supprimer.'
      )
    }

    const trx = await db.transaction()

    try {
      const docInTrx = await Document.findOrFail(params.id, { client: trx })
      const filePath = docInTrx.filePath

      const documentTitle = docInTrx.title || docInTrx.originalName
      const uploadedBy = docInTrx.uploadedBy
      let patientId: string | null = null
      let patientName: string | null = null

      if (docInTrx.patientId) {
        patientId = docInTrx.patientId
        try {
          const patient = await Patient.find(docInTrx.patientId)
          if (patient) {
            await patient.load('user')
            patientName = patient.user?.nomComplet || null
          }
        } catch (error) {
          logger.debug(
            { patientId: docInTrx.patientId, err: error },
            'Impossible de charger le patient pour notification de suppression'
          )
        }
      }

      await docInTrx.delete()

      await drive
        .use()
        .delete(filePath)
        .catch((err) => {
          logger.warn({ err }, 'Fichier physique non supprimé lors de la suppression du document')
        })

      await trx.commit()

      await NotificationService.notifyDocumentDeleted(
        String(docInTrx.id),
        documentTitle,
        patientId,
        patientName,
        user.id,
        uploadedBy
      )

      await AuditService.logDocumentDeleted(
        { auth, request: {} as any, response } as HttpContext,
        String(docInTrx.id),
        documentTitle,
        'Suppression demandée par utilisateur autorisé'
      )

      return response.json(ApiResponse.deleted('Document supprimé'))
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

    return response.json(
      ApiResponse.success(
        DocumentTransformer.transform(document, true),
        `Version ${versionNumber} restaurée avec succès`
      )
    )
  }

  /**
   * Partager un document (uniquement avec des docteurs)
   */
  public async share({ params, request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile
    const userIds: string[] = Array.isArray(request.input('userIds'))
      ? request.input('userIds')
      : []
    const roleIds: string[] = Array.isArray(request.input('roleIds'))
      ? request.input('roleIds')
      : []
    const permission = request.input('permission', 'read')
    const expiresAt = request.input('expiresAt')
      ? DateTime.fromISO(request.input('expiresAt'))
      : null

    // Les documents ne peuvent être partagés qu'avec des médecins
    const doctorRoles = ['docteur_clinique', 'docteur_labo']
    const invalidRoleIds = roleIds.filter((r) => !doctorRoles.includes(r))
    if (invalidRoleIds.length > 0) {
      throw AppException.badRequest('Le partage est autorisé uniquement avec des rôles Médecins.')
    }

    if (userIds.length > 0) {
      const profiles = await UserProfile.query().whereIn('id', userIds).where('actif', true)
      const nonDoctors = profiles.filter((p) => !doctorRoles.includes(p.role))
      if (nonDoctors.length > 0) {
        throw AppException.badRequest(
          'Le partage est autorisé uniquement avec des médecins (docteurs).'
        )
      }
    }

    // Les médecins avec qui on partage n'ont que le droit de lecture (pas signer ni supprimer)
    const readOnlyPermission = 'read' as const
    await DocumentService.shareDocument(
      params.id,
      userIds,
      roleIds,
      readOnlyPermission,
      expiresAt,
      user.id
    )

    const document = await Document.findOrFail(params.id)

    // Déterminer les médecins à notifier (IDs utilisateur)
    const doctorIdsToNotify: string[] = [...userIds]
    if (roleIds.some((r) => ['docteur_clinique', 'docteur_labo'].includes(r))) {
      const doctorsByRole = await UserProfile.query()
        .whereIn('role', ['docteur_clinique', 'docteur_labo'])
        .where('actif', true)
        .select('id')
      for (const d of doctorsByRole) {
        if (!doctorIdsToNotify.includes(d.id)) doctorIdsToNotify.push(d.id)
      }
    }
    const uniqueDoctorIds = [...new Set(doctorIdsToNotify)].filter((id) => id !== user.id)
    if (uniqueDoctorIds.length > 0) {
      try {
        await NotificationService.notifyDocumentShared(
          String(document.id),
          document.title,
          uniqueDoctorIds,
          user.nomComplet || user.email || 'Un utilisateur'
        )
      } catch (err) {
        logger.warn({ err, documentId: document.id }, 'Notification de partage de document échouée')
      }
    }

    // Log d'audit - Partage de document
    const sharedWithNames =
      userIds.length > 0
        ? `${userIds.length} utilisateur(s)`
        : roleIds.length > 0
          ? `Rôle(s): ${roleIds.join(', ')}`
          : '—'
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
      throw AppException.badRequest("L'ID de l'accès est requis")
    }

    // Trouver l'accès et le supprimer
    const access = await DocumentAccess.findOrFail(accessId)
    await access.load('userProfile', (q) => q.select('nomComplet', 'email'))
    await access.load('document')

    const revokedFromName =
      access.userProfile?.nomComplet || access.userProfile?.email || 'Utilisateur'
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

    return response.json(ApiResponse.success(approvals, "Workflow d'approbation créé"))
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
      throw AppException.badRequest("Le numéro d'étape et le statut sont requis")
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

    return response.json(
      ApiResponse.success(
        DocumentTransformer.transform(document, true),
        `Étape ${stepNumber} ${status === 'approved' ? 'approuvée' : 'rejetée'}`
      )
    )
  }

  /**
   * Archiver/Désarchiver un document
   */
  public async toggleArchive({ params, request, response, auth }: HttpContext) {
    const action = request.input('action') // 'archive' ou 'unarchive'
    const user = auth.user as UserProfile

    const document =
      action === 'archive'
        ? await DocumentService.archiveDocument(params.id)
        : await DocumentService.unarchiveDocument(params.id)

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

    return response.json(
      ApiResponse.success(
        DocumentTransformer.transform(document, true),
        `Document ${action === 'archive' ? 'archivé' : 'désarchivé'} avec succès`
      )
    )
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
        logger.warn({ err: error, documentId: doc.id }, "Document non inclus dans l'export")
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    response.header('Content-Type', 'application/zip')
    response.header(
      'Content-Disposition',
      `attachment; filename="documents_export_${DateTime.now().toFormat('yyyy-MM-dd')}.zip"`
    )

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

    return response.json(
      ApiResponse.paginated(
        DocumentTransformer.transformMany(documents.all(), true),
        documents.currentPage,
        documents.perPage,
        documents.total
      )
    )
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
   * Statistiques complètes des documents (sans cache : données toujours fraîches)
   */
  public async stats({ response }: HttpContext) {
    try {
      const [
        totalRes,
        archivedRes,
        pendingRes,
        signedRes,
        signedTodayRes,
        viewsRes,
        downloadsRes,
        storageRes,
      ] = await Promise.all([
        db.rawQuery(`SELECT COUNT(*) as total FROM documents`),
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_archived = true`),
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_signed = false`),
        db.rawQuery(`SELECT COUNT(*) as total FROM documents WHERE is_signed = true`),
        db.rawQuery(`
          SELECT COUNT(*) as total FROM documents
          WHERE is_signed = true AND DATE(updated_at) = CURRENT_DATE
        `),
        db.rawQuery(`SELECT COALESCE(SUM(view_count), 0)::bigint as total FROM documents`),
        db.rawQuery(`SELECT COALESCE(SUM(download_count), 0)::bigint as total FROM documents`),
        db.rawQuery(`SELECT COALESCE(SUM(size), 0)::bigint as total FROM documents`),
      ])

      const firstRow = (r: any) => (r?.rows && r.rows[0]) || (Array.isArray(r) && r[0]) || null
      const num = (r: any) => {
        const row = firstRow(r)
        const v = row?.total
        if (v === undefined || v === null) return 0
        return Number(v)
      }

      const totalDocuments = num(totalRes)
      const archivedDocuments = num(archivedRes)
      const pendingSignatures = num(pendingRes)
      const totalSigned = num(signedRes)
      const signedToday = num(signedTodayRes)
      const totalViews = num(viewsRes)
      const totalDownloads = num(downloadsRes)
      const totalStorageBytes = num(storageRes)

      const stats = {
        totalDocuments,
        archivedDocuments,
        pendingSignatures,
        totalSigned,
        signedToday,
        totalViews,
        totalDownloads,
        storageUsed: `${(totalStorageBytes / (1024 * 1024)).toFixed(1)} MB`,
      }
      return response.json(ApiResponse.success(stats))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques des documents')
      throw AppException.internal('Erreur lors du chargement des statistiques.')
    }
  }
}
