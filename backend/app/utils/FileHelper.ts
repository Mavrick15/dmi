import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'
import { randomBytes } from 'crypto'

/**
 * Utilitaires pour la gestion des fichiers
 */
export class FileHelper {
  /**
   * Générer un nom de fichier unique
   */
  static generateUniqueFileName(originalName: string): string {
    const extension = originalName.split('.').pop()
    const timestamp = Date.now()
    const random = randomBytes(4).toString('hex')
    return `${timestamp}-${random}.${extension}`
  }

  /**
   * Valider le type MIME d'un fichier
   */
  static isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType)
  }

  /**
   * Valider la taille d'un fichier
   */
  static isValidFileSize(size: number, maxSizeBytes: number): boolean {
    return size <= maxSizeBytes
  }

  /**
   * Obtenir l'extension d'un fichier
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * Formater la taille d'un fichier en format lisible
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Supprimer un fichier du storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const disk = drive.use()
      const exists = await disk.exists(filePath)
      if (exists) {
        await disk.delete(filePath)
        return true
      }
      return false
    } catch (error) {
      logger.error({ err: error, filePath }, 'Erreur lors de la suppression du fichier')
      return false
    }
  }

  /**
   * Vérifier si un fichier existe
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      return await drive.use().exists(filePath)
    } catch (error) {
      return false
    }
  }

  /**
   * Obtenir l'URL publique d'un fichier
   */
  static async getFileUrl(filePath: string): Promise<string | null> {
    try {
      const disk = drive.use()
      const exists = await disk.exists(filePath)
      if (!exists) {
        return null
      }
      return await disk.getUrl(filePath)
    } catch (error) {
      logger.error({ err: error, filePath }, 'Erreur lors de la récupération de l\'URL du fichier')
      return null
    }
  }
}

