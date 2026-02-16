import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,

  /**
   * Les origines autorisées.
   * On autorise :
   * 1. Le domaine de production (Nginx)
   * 2. L'environnement de dev local (Vite)
   */
  origin: [
    'https://openclinic.cd',
    'https://www.openclinic.cd',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],

  headers: true,

  exposeHeaders: [
    'cache-control',
    'content-language',
    'content-type',
    'expires',
    'last-modified',
    'pragma',
  ],

  credentials: true,

  maxAge: 90,
})

export default corsConfig