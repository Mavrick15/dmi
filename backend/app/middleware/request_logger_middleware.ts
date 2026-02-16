import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

/**
 * Middleware pour logger les requêtes HTTP
 * Utile pour le debugging et le monitoring
 */
export default class RequestLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const start = Date.now()
    const method = ctx.request.method()
    const url = ctx.request.url()
    const ip = ctx.request.ip()

    // Logger la requête entrante
    const user = ctx.auth?.user as any
    logger.info({
      method,
      url,
      ip,
      userAgent: ctx.request.header('user-agent'),
      userId: user?.id || null,
    }, `${method} ${url}`)

    await next()

    // Logger la réponse
    const duration = Date.now() - start
    const status = ctx.response.response.statusCode

    const responseUser = ctx.auth?.user as any
    logger.info({
      method,
      url,
      status,
      duration,
      ip,
      userId: responseUser?.id || null,
    }, `${method} ${url} ${status} ${duration}ms`)
  }
}

