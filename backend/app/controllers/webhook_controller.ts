import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import WebhookService from '#services/WebhookService'
import AuditService from '#services/AuditService'
import { AppException } from '../exceptions/AppException.js'
import vine from '@vinejs/vine'

const registerWebhookValidator = vine.compile(
  vine.object({
    event: vine.string()
      .trim()
      .minLength(3)
      .maxLength(100)
      .regex(/^[a-zA-Z0-9_\-\.]+$/),
    url: vine.string()
      .trim()
      .url()
      .maxLength(500),
  })
)

const deleteWebhookValidator = vine.compile(
  vine.object({
    event: vine.string()
      .trim()
      .minLength(3)
      .maxLength(100),
    url: vine.string()
      .trim()
      .url()
      .maxLength(500),
  })
)

/**
 * Contrôleur pour gérer les webhooks
 */
export default class WebhookController {
  /**
   * Enregistrer un webhook
   * @route POST /api/v1/webhooks
   * @access Admin
   */
  async register({ request, response, auth }: HttpContext) {
    try {
      const { event, url } = await request.validateUsing(registerWebhookValidator)

      WebhookService.registerWebhook(event, url)

      // Log d'audit - Webhook créé
      await AuditService.logWebhookCreated(
        { auth, request, response } as HttpContext,
        event,
        url
      )

      logger.info({ event, url }, 'Webhook enregistré avec succès')

      return response.created({
        success: true,
        message: 'Webhook enregistré avec succès',
        data: { event, url },
      })
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de l\'enregistrement du webhook')
      throw AppException.internal('Erreur lors de l\'enregistrement du webhook.')
    }
  }

  /**
   * Lister les webhooks
   * @route GET /api/v1/webhooks
   * @access Admin
   */
  async index({ response }: HttpContext) {
    try {
      const webhooks = WebhookService.listWebhooks()

      return response.json({
        success: true,
        data: webhooks,
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des webhooks')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la récupération des webhooks.'
      })
    }
  }

  /**
   * Supprimer un webhook
   * @route DELETE /api/v1/webhooks
   * @access Admin
   */
  async delete({ request, response, auth }: HttpContext) {
    try {
      const { event, url } = await request.validateUsing(deleteWebhookValidator)

      const webhooks = WebhookService.listWebhooks()
      const eventWebhooks = webhooks[event] || []
      
      if (!eventWebhooks.includes(url)) {
        throw AppException.notFound('Webhook non trouvé pour cet événement et cette URL')
      }

      WebhookService.removeWebhook(event, url)

      // Log d'audit - Webhook supprimé
      await AuditService.logWebhookDeleted(
        { auth, request, response } as HttpContext,
        event,
        url
      )

      logger.info({ event, url }, 'Webhook supprimé avec succès')

      return response.json({
        success: true,
        message: 'Webhook supprimé avec succès',
      })
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la suppression du webhook')
      throw AppException.internal('Erreur lors de la suppression du webhook.')
    }
  }
}

