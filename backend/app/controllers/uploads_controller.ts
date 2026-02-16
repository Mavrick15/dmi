import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import logger from '@adonisjs/core/services/logger'

/**
 * Contrôleur pour servir les fichiers uploadés (avatars, etc.)
 */
export default class UploadsController {
  /**
   * Servir un fichier depuis storage/uploads
   * Routes: GET /api/v1/uploads/avatars/:file, /api/v1/uploads/:folder/:file
   */
  async serve({ params, request, response }: HttpContext) {
    try {
      // Construire le chemin du fichier depuis les paramètres de la route
      // Si on a un paramètre 'folder', on l'utilise, sinon on utilise 'avatars' par défaut
      const folder = params.folder || 'avatars'
      const file = params.file
      
      logger.info({ params, folder, file, url: request.url() }, 'Tentative de chargement de fichier')
      
      if (!file) {
        logger.warn({ params, url: request.url() }, 'Nom de fichier manquant')
        return response.status(404).json({ error: 'Nom de fichier manquant' })
      }
      
      // Construire le chemin complet du fichier
      // Drive est configuré pour pointer vers storage/uploads/, donc le chemin relatif est avatars/xxx.jpg
      const filePath = `${folder}/${file}`
      
      logger.info({ filePath, driveLocation: 'storage/uploads' }, 'Vérification de l\'existence du fichier')
      
      // Vérifier que le fichier existe
      const exists = await drive.use().exists(filePath)
      if (!exists) {
        logger.warn({ 
          filePath, 
          url: request.url(),
          expectedFullPath: `storage/uploads/${filePath}`,
          driveConfig: 'storage/uploads'
        }, 'Fichier non trouvé dans le storage')
        return response.status(404).json({ error: `Fichier non trouvé: ${filePath}` })
      }
      
      logger.info({ filePath }, 'Fichier trouvé, préparation du stream')
      
      // Obtenir le stream du fichier
      const stream = await drive.use().getStream(filePath)
      
      // Déterminer le type MIME basé sur l'extension
      const ext = filePath.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      
      const contentType = mimeTypes[ext || ''] || 'application/octet-stream'
      
      // Servir le fichier avec les headers appropriés
      response.header('Content-Type', contentType)
      response.header('Cache-Control', 'public, max-age=31536000') // Cache 1 an
      
      logger.info({ filePath, contentType }, 'Envoi du fichier')
      
      return response.stream(stream)
    } catch (error) {
      logger.error({ err: error, params, url: request.url() }, 'Erreur lors du service du fichier')
      return response.status(500).json({ error: 'Erreur lors du chargement du fichier' })
    }
  }
}

