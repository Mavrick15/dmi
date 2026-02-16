import { defineConfig } from '@adonisjs/core/bodyparser'

export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  json: {
    encoding: 'utf-8',
    limit: '8mb',
    strict: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  form: {
    encoding: 'utf-8',
    limit: '8mb',
    queryString: {
      depth: 5,
      parameterLimit: 1000,
    },
    types: ['application/x-www-form-urlencoded'],
  },

  // CORRECTION ICI : On s'assure que la limite est suffisante (20mb)
  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: [],
    encoding: 'utf-8',
    maxFields: 1000,
    limit: '100mb', 
    types: ['multipart/form-data'],
  },

  raw: {
    encoding: 'utf-8',
    limit: '8mb',
    queryString: {
      depth: 5,
      parameterLimit: 1000,
    },
    types: ['text/*'],
  },
})