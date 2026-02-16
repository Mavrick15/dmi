import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// Créer le dossier logs s'il n'existe pas (uniquement en production)
if (app.inProduction) {
  try {
    const logsDir = join(process.cwd(), 'logs')
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true })
    }
  } catch (error) {
    // Ignorer l'erreur si le dossier ne peut pas être créé
    console.warn('Could not create logs directory:', error)
  }
}

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME') || 'openclinic',
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ 
            destination: 1, // stdout - PM2 capturera ces logs
            // En production, PM2 gère la rotation des logs
          }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
