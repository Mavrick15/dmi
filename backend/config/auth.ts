import { defineConfig } from '@adonisjs/auth'
import { InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const authConfig = defineConfig({
  default: 'session',
  guards: {
    session: (ctx) => {
      return ctx.auth.createSessionGuard({
        userProvider: () => import('#models/UserProfile'),
      })
    },
  },
})

export default authConfig

declare global {
  namespace App {
    interface Auth extends InferAuthEvents<typeof authConfig> {
      user: Authenticators<typeof authConfig>['session']['user']
    }
  }
}