#!/usr/bin/env node
/**
 * Liste les clés actuellement en cache (Redis).
 * Les clés du projet ont le préfixe "cache:" (dashboard, stats, etc.).
 *
 * Usage (depuis backend/) :
 *   node scripts/list-cache-keys.js
 *   node scripts/list-cache-keys.js --show-values   # affiche un extrait des valeurs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Redis from 'ioredis'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const showValues = process.argv.includes('--show-values')

function loadEnv() {
  if (process.env.REDIS_HOST) return
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*REDIS_(HOST|PORT|PASSWORD|DB)\s*=\s*(.+)\s*$/)
    if (m) process.env[`REDIS_${m[1]}`] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

loadEnv()

const host = process.env.REDIS_HOST || 'localhost'
const port = parseInt(process.env.REDIS_PORT || '6379', 10)
const password = process.env.REDIS_PASSWORD || undefined
const db = parseInt(process.env.REDIS_DB || '0', 10)

const redis = new Redis({
  host,
  port,
  password: password || undefined,
  db,
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
})

const PREFIX = 'cache:'

async function main() {
  const keys = await redis.keys(`${PREFIX}*`)
  if (keys.length === 0) {
    console.log('Aucune clé en cache (préfixe "%s").', PREFIX)
    await redis.quit()
    return
  }

  console.log('%d clé(s) en cache :\n', keys.length)
  for (const key of keys.sort()) {
    const ttl = await redis.ttl(key)
    const ttlStr = ttl === -1 ? 'pas d\'expiration' : `${ttl}s`
    const shortKey = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key
    process.stdout.write(`  ${shortKey}  (TTL: ${ttlStr})`)
    if (showValues) {
      const raw = await redis.get(key)
      if (raw) {
        try {
          const obj = JSON.parse(raw)
          const preview = typeof obj === 'object' && obj !== null
            ? JSON.stringify(obj).slice(0, 120) + (JSON.stringify(obj).length > 120 ? '...' : '')
            : String(obj).slice(0, 80)
          console.log('\n    → %s', preview)
        } catch {
          console.log('\n    → (valeur non JSON)')
        }
      } else {
        console.log('')
      }
    } else {
      console.log('')
    }
  }
  await redis.quit()
}

main().catch((err) => {
  console.error('Erreur:', err.message)
  process.exit(1)
})
