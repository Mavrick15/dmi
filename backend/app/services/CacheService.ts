/**
 * Service de cache : Redis si disponible, sinon mémoire.
 *
 * À utiliser uniquement pour requêtes lourdes ou très répétitives (stats, dashboard, overview).
 * Ne pas cacher les lectures simples par ID ni les listes paginées.
 * Voir backend/docs/CACHING.md pour la politique complète.
 */
import RedisService from '#services/RedisService'

const REDIS_PREFIX = 'cache:'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map()

  constructor() {
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  private async ensureRedis(): Promise<void> {
    if (!RedisService.isAvailable() && !(RedisService as any)._connectionAttempted) {
      ;(RedisService as any)._connectionAttempted = true
      try {
        await RedisService.connect()
      } catch {
        // Fallback mémoire uniquement
      }
    }
  }

  /**
   * Récupération synchrone (mémoire uniquement) — conservée pour compatibilité.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    if (!entry || Date.now() > entry.expiresAt) {
      if (entry) this.cache.delete(key)
      return null
    }
    return entry.value as T
  }

  /**
   * Récupération asynchrone : Redis puis mémoire.
   */
  async getAsync<T>(key: string): Promise<T | null> {
    await this.ensureRedis()
    const redisKey = REDIS_PREFIX + key
    if (RedisService.isAvailable()) {
      try {
        const raw = await RedisService.get(redisKey)
        if (raw !== null) {
          const value = JSON.parse(raw) as T
          this.cache.set(key, { value, expiresAt: Date.now() + 300 * 1000 })
          return value
        }
      } catch {
        /* fallback mémoire */
      }
    }
    return this.get<T>(key)
  }

  /**
   * Stockage synchrone (mémoire uniquement).
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  /**
   * Stockage asynchrone : Redis + mémoire.
   */
  async setAsync<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    await this.ensureRedis()
    this.set(key, value, ttlSeconds)
    if (RedisService.isAvailable()) {
      try {
        await RedisService.set(REDIS_PREFIX + key, JSON.stringify(value), ttlSeconds)
      } catch {
        /* ignore */
      }
    }
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  async deleteAsync(key: string): Promise<void> {
    this.cache.delete(key)
    if (RedisService.isAvailable()) {
      await RedisService.delete(REDIS_PREFIX + key)
    }
  }

  /**
   * Supprime toutes les entrées dont la clé commence par prefix (mémoire + Redis).
   */
  async deleteByPrefixAsync(prefix: string): Promise<void> {
    for (const k of Array.from(this.cache.keys())) {
      if (k.startsWith(prefix)) this.cache.delete(k)
    }
    if (RedisService.isAvailable()) {
      try {
        const keys = await RedisService.keys(REDIS_PREFIX + prefix + '*')
        for (const k of keys) {
          await RedisService.delete(k)
        }
      } catch {
        /* ignore */
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) this.cache.delete(key)
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export default new CacheService()
