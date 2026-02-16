import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      pool: {
        min: 1,
        max: 8, // Réduire encore plus pour éviter la saturation PostgreSQL
        acquireTimeoutMillis: 60000, // Augmenter le timeout pour attendre une connexion disponible
        createTimeoutMillis: 30000,
        idleTimeoutMillis: 20000, // Garder les connexions inactives un peu plus longtemps
        reapIntervalMillis: 1000, // Vérifier régulièrement les connexions inactives
        createRetryIntervalMillis: 200,
        propagateCreateError: false,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig