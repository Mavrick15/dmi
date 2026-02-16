import logger from '@adonisjs/core/services/logger'
import type { Redis as RedisType } from 'ioredis'
import { Redis } from 'ioredis'

class RedisService {
  private client: RedisType | null = null
  private isConnected: boolean = false
  private connectionPromise: Promise<void> | null = null

  /**
   * Initialise la connexion Redis (lazy initialization)
   * Se connecte automatiquement à la première utilisation
   */
  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return
    }

    // Éviter les connexions multiples simultanées
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this._connect()
    return this.connectionPromise
  }

  /**
   * Méthode interne de connexion
   * Utilise REDIS_HOST (vide = désactivé), REDIS_PORT, REDIS_PASSWORD, REDIS_DB
   * Option : REDIS_ENABLED=false pour désactiver sans modifier REDIS_HOST
   * Option : REDIS_REQUIRED=true pour forcer l'utilisation de Redis (pas de fallback mémoire, erreur si indisponible)
   */
  private async _connect(): Promise<void> {
    const redisRequired = process.env.REDIS_REQUIRED === 'true' || process.env.REDIS_REQUIRED === '1'
    const redisEnabled = process.env.REDIS_ENABLED !== 'false' && process.env.REDIS_ENABLED !== '0'
    const redisHost = (process.env.REDIS_HOST || 'localhost').trim()

    if (!redisEnabled || !redisHost) {
      if (redisRequired) {
        throw new Error('Redis requis (REDIS_REQUIRED=true) mais REDIS_ENABLED ou REDIS_HOST désactive Redis.')
      }
      logger.debug(
        'Redis: Désactivé (REDIS_ENABLED ou REDIS_HOST), utilisation du cache en mémoire'
      )
      this.connectionPromise = null
      return
    }

    try {
      const redisConfig = {
        host: redisHost,
        port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: Number.parseInt(process.env.REDIS_DB || '0', 10),
        connectTimeout: 5000,
        retryStrategy: (times: number) => {
          if (times > 5) return null
          const delay = Math.min(times * 100, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
      }

      const redisClient = new Redis(redisConfig)
      this.client = redisClient

      redisClient.on('connect', () => {
        logger.info('Redis: Connexion établie')
        this.isConnected = true
      })

      redisClient.on('ready', () => {
        logger.info('Redis: Prêt à recevoir des commandes')
      })

      redisClient.on('error', (error: Error & { code?: string }) => {
        if (!this.isConnected) {
          if (!redisRequired && error.code === 'ECONNREFUSED') {
            logger.debug('Redis: Connexion refusée, utilisation du cache en mémoire')
          } else if (
            !redisRequired &&
            (error.message?.includes('Connection is closed') || error.code === 'NR_CLOSED')
          ) {
            logger.debug('Redis: Connexion fermée avant établissement')
          } else {
            logger.warn({ err: error }, 'Redis: Erreur de connexion')
          }
        }
        this.isConnected = false
      })

      redisClient.on('close', () => {
        if (this.isConnected) {
          logger.warn('Redis: Connexion fermée (réessai automatique par ioredis si activé)')
        }
        this.isConnected = false
      })

      await this.client.connect()
      this.connectionPromise = null
    } catch (error: unknown) {
      if (this.client) {
        try {
          await this.client.quit()
        } catch {
          /* ignore */
        }
        this.client = null
      }
      this.isConnected = false
      this.connectionPromise = null

      if (redisRequired) {
        logger.error({ err: error }, 'Redis requis indisponible')
        throw error
      }
      const err = error as Error & { code?: string }
      const silent =
        err.code === 'ECONNREFUSED' ||
        err.message === 'Connection is closed.' ||
        err.message?.includes('Connection is closed')
      if (silent) {
        logger.debug('Redis: Non disponible, utilisation du cache en mémoire')
      } else {
        logger.warn({ err: error }, 'Redis: Échec de la connexion')
      }
    }
  }

  /**
   * Indique si Redis est requis (pas de fallback mémoire)
   */
  isRequired(): boolean {
    return process.env.REDIS_REQUIRED === 'true' || process.env.REDIS_REQUIRED === '1'
  }

  /**
   * Vérifie si Redis est disponible
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null
  }

  /**
   * Récupère une valeur
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null
    }

    try {
      return await this.client!.get(key)
    } catch (error) {
      logger.error({ err: error, key }, 'Redis: Erreur lors de la récupération')
      return null
    }
  }

  /**
   * Définit une valeur avec expiration
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value)
      } else {
        await this.client!.set(key, value)
      }
      return true
    } catch (error) {
      logger.error({ err: error, key }, 'Redis: Erreur lors de la définition')
      return false
    }
  }

  /**
   * Incrémente une valeur et retourne le nouveau compteur
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }

    try {
      const count = await this.client!.incr(key)

      // Si c'est la première fois qu'on incrémente, définir l'expiration
      if (count === 1 && ttlSeconds) {
        await this.client!.expire(key, ttlSeconds)
      }

      return count
    } catch (error) {
      logger.error({ err: error, key }, "Redis: Erreur lors de l'incrémentation")
      return 0
    }
  }

  /**
   * Supprime une clé
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      await this.client!.del(key)
      return true
    } catch (error) {
      logger.error({ err: error, key }, 'Redis: Erreur lors de la suppression')
      return false
    }
  }

  /**
   * Retourne les clés correspondant au motif (ex: cache:dashboard:*)
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return []
    }
    try {
      return await this.client!.keys(pattern)
    } catch (error) {
      logger.error({ err: error, pattern }, 'Redis: Erreur lors de la récupération des clés')
      return []
    }
  }

  /**
   * Définit l'expiration d'une clé
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      await this.client!.expire(key, seconds)
      return true
    } catch (error) {
      logger.error({ err: error, key }, "Redis: Erreur lors de la définition de l'expiration")
      return false
    }
  }

  /**
   * Récupère le TTL (Time To Live) d'une clé
   */
  async ttl(key: string): Promise<number> {
    if (!this.isAvailable()) {
      return -1
    }

    try {
      return await this.client!.ttl(key)
    } catch (error) {
      logger.error({ err: error, key }, 'Redis: Erreur lors de la récupération du TTL')
      return -1
    }
  }

  /**
   * Ferme la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }
}

export default new RedisService()
