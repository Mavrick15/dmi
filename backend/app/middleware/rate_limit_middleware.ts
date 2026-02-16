import RedisService from '#services/RedisService'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { ApiResponse } from '../utils/ApiResponse.js'

/**
 * Middleware de rate limiting avec support Redis et fallback mémoire
 *
 * Améliorations:
 * - Utilise Redis en production pour la scalabilité
 * - Fallback automatique en mémoire si Redis n'est pas disponible
 * - Identification par utilisateur si authentifié (plus précis que IP seule)
 * - Headers standards RFC 6585
 * - Gestion des erreurs améliorée
 */
interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
    firstRequest: number
  }
}

// Store en mémoire pour le fallback
const store: RateLimitStore = {}
const MAX_STORE_SIZE = 10000 // Limite pour éviter la consommation excessive de mémoire

/**
 * Nettoie les entrées expirées toutes les 5 minutes (fallback mémoire uniquement)
 * Optimisé pour éviter de bloquer le thread principal
 */
setInterval(
  () => {
    const now = Date.now()
    const keys = Object.keys(store)

    // Si le store devient trop grand, nettoyer plus agressivement
    if (keys.length > MAX_STORE_SIZE) {
      // Supprimer les 20% les plus anciennes
      const sortedKeys = keys
        .map((key) => ({ key, resetAt: store[key].resetAt }))
        .sort((a, b) => a.resetAt - b.resetAt)
        .slice(0, Math.floor(keys.length * 0.2))
        .map((item) => item.key)

      sortedKeys.forEach((key) => delete store[key])
    } else {
      // Nettoyage normal des entrées expirées
      keys.forEach((key) => {
        if (store[key].resetAt < now) {
          delete store[key]
        }
      })
    }
  },
  5 * 60 * 1000
)

export default class RateLimitMiddleware {
  /**
   * @param maxRequests - Nombre maximum de requêtes
   * @param windowMs - Fenêtre de temps en millisecondes
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { maxRequests?: number; windowMs?: number } = {}
  ) {
    const maxRequests = options.maxRequests || 100
    const windowMs = options.windowMs || 15 * 60 * 1000 // 15 minutes par défaut
    const windowSeconds = Math.ceil(windowMs / 1000)

    // Identifier la requête : utilisateur authentifié > IP + route
    // Cela permet un rate limiting plus précis et équitable
    const userId = (ctx.auth?.user as any)?.id
    const identifier = userId
      ? `ratelimit:user:${userId}:${ctx.request.url()}`
      : `ratelimit:ip:${ctx.request.ip()}:${ctx.request.url()}`

    const now = Date.now()

    // Essayer d'utiliser Redis en premier, sinon fallback en mémoire (sauf si REDIS_REQUIRED)
    const redisRequired = RedisService.isRequired()
    if (!RedisService.isAvailable() && !(RedisService as any)._connectionAttempted) {
      ;(RedisService as any)._connectionAttempted = true
      try {
        await RedisService.connect()
      } catch (error) {
        if (redisRequired) {
          return ctx.response.status(503).json(
            ApiResponse.error(
              'Service temporairement indisponible (Redis requis).',
              'REDIS_UNAVAILABLE'
            )
          )
        }
        // Sinon on utilisera le fallback mémoire
      }
    }

    if (RedisService.isAvailable()) {
      try {
        // Utiliser Redis pour le rate limiting
        const count = await RedisService.increment(identifier, windowSeconds)
        const ttl = await RedisService.ttl(identifier)
        const resetAt = now + (ttl > 0 ? ttl * 1000 : windowMs)

        // Vérifier la limite
        if (count > maxRequests) {
          const retryAfter = ttl > 0 ? ttl : windowSeconds

          // Ajouter les headers même en cas de limite dépassée
          ctx.response.header('X-RateLimit-Limit', maxRequests.toString())
          ctx.response.header('X-RateLimit-Remaining', '0')
          ctx.response.header('X-RateLimit-Reset', new Date(resetAt).toISOString())
          ctx.response.header('Retry-After', retryAfter.toString())

          return ctx.response.status(429).json(
            ApiResponse.error(
              `Trop de requêtes. Limite de ${maxRequests} requêtes atteinte. Réessayez dans ${retryAfter} seconde(s).`,
              'RATE_LIMIT_EXCEEDED',
              {
                retryAfter,
                limit: maxRequests,
                window: windowSeconds,
              }
            )
          )
        }

        // Ajouter les headers de rate limiting (RFC 6585)
        const remaining = Math.max(0, maxRequests - count)
        ctx.response.header('X-RateLimit-Limit', maxRequests.toString())
        ctx.response.header('X-RateLimit-Remaining', remaining.toString())
        ctx.response.header('X-RateLimit-Reset', new Date(resetAt).toISOString())

        await next()
        return
      } catch (error) {
        if (redisRequired) {
          return ctx.response.status(503).json(
            ApiResponse.error(
              'Service temporairement indisponible (Redis requis).',
              'REDIS_UNAVAILABLE'
            )
          )
        }
        // Sinon basculer en mode mémoire
      }
    }

    // Redis requis mais indisponible : ne pas utiliser le fallback mémoire
    if (redisRequired) {
      return ctx.response.status(503).json(
        ApiResponse.error(
          'Service temporairement indisponible (Redis requis).',
          'REDIS_UNAVAILABLE'
        )
      )
    }

    // Fallback : Mode mémoire (uniquement si Redis non requis)
    // Vérifier ou créer l'entrée
    if (!store[identifier] || store[identifier].resetAt < now) {
      store[identifier] = {
        count: 1,
        resetAt: now + windowMs,
        firstRequest: now,
      }
    } else {
      store[identifier].count++

      // Vérifier la limite
      if (store[identifier].count > maxRequests) {
        const retryAfter = Math.ceil((store[identifier].resetAt - now) / 1000)

        // Ajouter les headers même en cas de limite dépassée
        ctx.response.header('X-RateLimit-Limit', maxRequests.toString())
        ctx.response.header('X-RateLimit-Remaining', '0')
        ctx.response.header('X-RateLimit-Reset', new Date(store[identifier].resetAt).toISOString())
        ctx.response.header('Retry-After', retryAfter.toString())

        return ctx.response.status(429).json(
          ApiResponse.error(
            `Trop de requêtes. Limite de ${maxRequests} requêtes atteinte. Réessayez dans ${retryAfter} seconde(s).`,
            'RATE_LIMIT_EXCEEDED',
            {
              retryAfter,
              limit: maxRequests,
              window: windowSeconds,
            }
          )
        )
      }
    }

    // Ajouter les headers de rate limiting (RFC 6585)
    const remaining = Math.max(0, maxRequests - store[identifier].count)
    ctx.response.header('X-RateLimit-Limit', maxRequests.toString())
    ctx.response.header('X-RateLimit-Remaining', remaining.toString())
    ctx.response.header('X-RateLimit-Reset', new Date(store[identifier].resetAt).toISOString())

    await next()
  }
}
