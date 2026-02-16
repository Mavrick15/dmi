#!/usr/bin/env node
/**
 * Vérifie la connexion au serveur Redis (config .env du backend).
 * Usage: depuis backend/ → node scripts/check-redis.js
 *        ou: REDIS_HOST=... REDIS_PORT=... REDIS_PASSWORD=... node scripts/check-redis.js
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Redis from 'ioredis'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

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

console.log(`Connexion à Redis ${host}:${port} (db ${db})...`)

const redis = new Redis({
  host,
  port,
  password: password || undefined,
  db,
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
})

redis
  .ping()
  .then((r) => {
    console.log('Redis: PONG — connexion OK.')
    return redis.quit()
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Redis: échec —', err.message)
    process.exit(1)
  })
