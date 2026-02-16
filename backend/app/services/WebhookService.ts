import logger from '@adonisjs/core/services/logger'

interface WebhookPayload {
  event: string
  data: any
  timestamp: string
}

/**
 * Service pour gérer les webhooks
 */
export default class WebhookService {
  private static webhooks: Map<string, string[]> = new Map()

  /**
   * Enregistrer une URL de webhook pour un événement
   */
  static registerWebhook(event: string, url: string) {
    if (!this.webhooks.has(event)) {
      this.webhooks.set(event, [])
    }
    this.webhooks.get(event)!.push(url)
  }

  /**
   * Déclencher un webhook
   */
  static async triggerWebhook(event: string, data: any) {
    const urls = this.webhooks.get(event) || []

    if (urls.length === 0) {
      return
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    }

    // Envoyer à toutes les URLs enregistrées
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OpenClinic-Webhook/1.0',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          logger.warn(`Webhook failed for ${url}: ${response.statusText}`)
        } else {
          logger.info(`Webhook sent successfully to ${url}`)
        }
      } catch (error) {
        logger.error({ err: error }, `Error sending webhook to ${url}`)
      }
    }
  }

  /**
   * Lister les webhooks enregistrés
   */
  static listWebhooks(): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    for (const [event, urls] of this.webhooks.entries()) {
      result[event] = urls
    }
    return result
  }

  /**
   * Supprimer un webhook
   */
  static removeWebhook(event: string, url: string) {
    const urls = this.webhooks.get(event)
    if (urls) {
      const index = urls.indexOf(url)
      if (index > -1) {
        urls.splice(index, 1)
      }
    }
  }
}

