import { BaseTransformer } from './BaseTransformer.js'
import type Document from '#models/Document'

/**
 * Transformer pour les données Document
 * Structure et organise les données de documents de manière cohérente
 */
export class DocumentTransformer extends BaseTransformer {
  /**
   * Transforme un document
   */
  static transform(document: Document, detailed = false): any {
    const transformer = new DocumentTransformer()
    return transformer.transformSingle(document, detailed)
  }

  /**
   * Transforme une collection de documents
   */
  static transformMany(documents: Document[], detailed = false): any[] {
    const transformer = new DocumentTransformer()
    return documents.map(d => transformer.transformSingle(d, detailed))
  }

  private transformSingle(d: Document, detailed: boolean): any {
    const baseData = {
      id: d.id,
      patientId: d.patientId,
      title: d.title,
      titre: d.title, // Alias pour compatibilité
      category: d.category,
      filePath: d.filePath,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      uploadedBy: d.uploadedBy || null,
      createdAt: d.createdAt?.toISO() || null,
      date: this.formatDate(d.createdAt),
      updatedAt: d.updatedAt?.toISO() || null,
      // Nouvelles propriétés Phase 1-3
      version: d.version || 1,
      description: d.description || null,
      tags: d.getTagsArray(),
      isSigned: d.isSigned || false,
      signedBy: d.signedBy || null,
      signedAt: d.signedAt?.toISO() || null,
      isArchived: d.isArchived || false,
      isWatermarked: d.isWatermarked || false,
      status: d.status || 'draft',
      accessLevel: d.accessLevel || 'private',
      downloadCount: d.downloadCount || 0,
      viewCount: d.viewCount || 0,
      thumbnailPath: d.thumbnailPath || null,
      // Inclure le signer si la relation est chargée (même si detailed=false)
      signer: d.signer ? {
        id: d.signer.id,
        name: d.signer.nomComplet || 'Utilisateur Inconnu',
      } : null,
    }

    if (detailed && d.patient) {
      return {
        ...baseData,
        patient: {
          id: d.patient.id,
          name: d.patient.user?.nomComplet || 'Patient Inconnu',
          numeroPatient: d.patient.numeroPatient || null,
        },
        uploader: d.uploader ? {
          id: d.uploader.id,
          name: d.uploader.nomComplet || 'Utilisateur Inconnu',
          email: d.uploader.email || null,
        } : null,
        approvedBy: d.approver ? {
          id: d.approver.id,
          name: d.approver.nomComplet || 'Utilisateur Inconnu',
        } : null,
        approvedAt: d.approvedAt?.toISO() || null,
        accessPermissions: d.getAccessPermissions(),
      }
    }

    return baseData
  }
}

