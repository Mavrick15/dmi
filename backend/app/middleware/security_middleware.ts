import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import { AppException } from '../exceptions/AppException.js'

/**
 * Middleware de sécurité pour les routes protégées
 * Protège contre les attaques courantes : path traversal, injection SQL, requêtes suspectes
 */
export default class SecurityMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const request = ctx.request
    const url = request.url()
    const method = request.method()
    const ip = request.ip()
    const userAgent = request.header('user-agent') || ''

    // 1. Protection contre le path traversal
    if (url.includes('../') || url.includes('..\\') || url.includes('%2e%2e') || url.includes('%2f') || url.includes('%5c')) {
      logger.warn({ ip, url, method, userAgent }, 'Tentative de path traversal détectée')
      throw AppException.forbidden('Requête suspecte détectée')
    }

    // 2. Protection contre les injections SQL dans les URLs et paramètres
    // Liste des chemins légitimes qui peuvent contenir des mots similaires aux mots-clés SQL
    const allowedPaths = [
      '/prescriptions/pending',
      '/prescriptions/select',
      '/orders/pending',
      '/analytics/select',
      '/reports/select'
    ]
    
    // Vérifier si l'URL contient un chemin autorisé
    const isAllowedPath = allowedPaths.some(path => url.toLowerCase().includes(path.toLowerCase()))
    
    if (!isAllowedPath) {
      // Mots-clés SQL dangereux (uniquement ceux qui sont vraiment suspects)
      const dangerousSqlKeywords = [
        'union select',
        'union all select',
        '; drop',
        '; delete',
        '; truncate',
        '; drop table',
        '; drop database',
        'exec(',
        'execute(',
        'sp_executesql',
        'xp_cmdshell',
        '--',
        '/*',
        '*/',
        '1=1',
        '1\'=\'1',
        'or 1=1',
        'or \'1\'=\'1'
      ]
      
      const urlLower = url.toLowerCase()
      const hasDangerousPattern = dangerousSqlKeywords.some(pattern => urlLower.includes(pattern.toLowerCase()))
      
      if (hasDangerousPattern) {
        logger.warn({ ip, url, method, userAgent, pattern: dangerousSqlKeywords.find(p => urlLower.includes(p.toLowerCase())) }, 'Tentative d\'injection SQL détectée dans l\'URL')
        throw AppException.forbidden('Requête suspecte détectée')
      }
      
      // Vérifier les paramètres de requête pour des patterns suspects
      const queryParams = request.qs()
      for (const [key, value] of Object.entries(queryParams)) {
        if (typeof value === 'string') {
          // Détecter les patterns d'injection SQL dans les valeurs
          const sqlInjectionPatterns = [
            /(\bunion\b.*\bselect\b)/i,
            /(\bdrop\b.*\btable\b)/i,
            /(\bdrop\b.*\bdatabase\b)/i,
            /(\bdelete\b.*\bfrom\b)/i,
            /(\binsert\b.*\binto\b)/i,
            /(\bupdate\b.*\bset\b)/i,
            /(\bexec\b|\bexecute\b)/i,
            /(;\s*(drop|delete|truncate|alter|create))/i,
            /(--|\/\*|\*\/)/,
            /(or\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
            /(or\s+['"]?1['"]?\s*=\s*['"]?1['"]?)/i
          ]
          
          const hasInjection = sqlInjectionPatterns.some(pattern => pattern.test(value))
          if (hasInjection) {
            logger.warn({ ip, url, method, userAgent, param: key, value: value.substring(0, 100) }, 'Tentative d\'injection SQL détectée dans les paramètres')
            throw AppException.forbidden('Requête suspecte détectée')
          }
        }
      }
    }

    // 3. Protection contre les méthodes HTTP non autorisées
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    if (!allowedMethods.includes(method)) {
      logger.warn({ ip, url, method, userAgent }, 'Méthode HTTP non autorisée')
      throw AppException.methodNotAllowed(`Méthode ${method} non autorisée`)
    }

    // 4. Protection contre les User-Agents suspects
    const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp', 'w3af', 'acunetix']
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      logger.warn({ ip, url, method, userAgent }, 'User-Agent suspect détecté')
      throw AppException.forbidden('Requête suspecte détectée')
    }

    // 5. Validation de la taille des paramètres (protection contre les attaques de buffer overflow)
    const queryParams = request.qs()
    for (const [key, value] of Object.entries(queryParams)) {
      if (typeof value === 'string' && value.length > 10000) {
        logger.warn({ ip, url, method, param: key }, 'Paramètre trop long détecté')
        throw AppException.badRequest('Paramètre trop long')
      }
    }

    // 6. Headers de sécurité pour les réponses
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-Frame-Options', 'SAMEORIGIN')
    ctx.response.header('X-XSS-Protection', '1; mode=block')
    ctx.response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 7. Logging des requêtes pour audit
    const userId = (ctx.auth?.user as any)?.id || 'anonymous'
    logger.info({
      ip,
      method,
      url,
      userAgent,
      userId,
      timestamp: new Date().toISOString()
    }, 'Requête API protégée')

    await next()
  }
}

