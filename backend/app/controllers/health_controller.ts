import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

/**
 * Contrôleur pour les health checks
 */
export default class HealthController {
  /**
   * Health check simple
   * @route GET /
   * @access Public
   */
  async index({ response }: HttpContext) {
    return response.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: DateTime.now().toISO(),
    })
  }

  /**
   * Health check détaillé (avec vérification DB)
   * @route GET /health
   * @access Public
   */
  async detailed({ response }: HttpContext) {
    const checks = {
      database: false,
      timestamp: DateTime.now().toISO(),
    }

    try {
      await db.rawQuery('SELECT 1')
      checks.database = true
    } catch (error) {
      logger.error({ err: error }, 'Health check failed: Database connection error')
      return response.status(503).json({
        status: 'error',
        checks,
        message: 'Database connection failed',
      })
    }

    return response.json({
      status: 'ok',
      checks,
      version: '1.0.0',
    })
  }

  /**
   * Health check pour monitoring (liveness probe)
   * @route GET /health/live
   * @access Public
   */
  async liveness({ response }: HttpContext) {
    return response.json({
      status: 'alive',
      timestamp: DateTime.now().toISO(),
    })
  }

  /**
   * Health check pour readiness (readiness probe)
   * @route GET /health/ready
   * @access Public
   */
  async readiness({ response }: HttpContext) {
    try {
      await db.rawQuery('SELECT 1')
      return response.json({
        status: 'ready',
        timestamp: DateTime.now().toISO(),
      })
    } catch (error) {
      logger.error({ err: error }, 'Readiness check failed: Database not available')
      return response.status(503).json({
        status: 'not ready',
        timestamp: DateTime.now().toISO(),
        error: 'Database not available',
      })
    }
  }
}

