import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    // Disque Local (Développement)
    fs: services.fs({
      location: app.makePath('storage/uploads'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    // Disque Cloud (Production - AWS S3, MinIO, etc.)
    s3: services.s3({
      client: {
        region: env.get('AWS_REGION'),
        credentials: {
          accessKeyId: env.get('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY') || '',
        },
        endpoint: env.get('AWS_ENDPOINT'), // Utile pour MinIO ou DigitalOcean
      },
      bucket: env.get('AWS_BUCKET') || '',
      visibility: 'private', // Sécurité : les liens doivent être signés ou servis par le backend
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}