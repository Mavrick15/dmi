/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| and the router.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to a HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * The server middleware stack runs middleware on all the requests with
 * no exception.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
  // SUPPRIMEZ LA LIGNE TRANSMIT ICI (Elle n'est pas nécessaire)
])

/**
 * The router middleware stack runs middleware on specific routes
 * decided by the router.
 */
router.use([
  () => import('@adonisjs/auth/initialize_auth_middleware')
])

/**
 * Named middleware collection to use within the routes.
 */
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  role: () => import('#middleware/role_middleware'),
  rateLimit: () => import('#middleware/rate_limit_middleware'),
  permission: () => import('#middleware/permission_middleware'),
  security: () => import('#middleware/security_middleware')
})