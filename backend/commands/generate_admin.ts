import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserProfile from '#models/UserProfile'
import hash from '@adonisjs/core/services/hash'

export default class GenerateAdmin extends BaseCommand {
  static commandName = 'make:admin'
  static description = 'Créer un utilisateur administrateur'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email de l\'administrateur' })
  declare email: string

  @args.string({ description: 'Nom complet' })
  declare nomComplet: string

  @flags.string({ alias: 'p', description: 'Mot de passe (optionnel, généré si non fourni)' })
  declare password: string

  async run() {
    // Vérifier que la table user_profiles existe (migrations exécutées)
    const db = (await import('@adonisjs/lucid/services/db')).default
    const hasTable = await db.connection().schema.hasTable('user_profiles')
    if (!hasTable) {
      this.logger.error('La table "user_profiles" n\'existe pas en base.')
      this.logger.info('Exécutez d\'abord les migrations : node ace migration:run')
      return
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = await UserProfile.findBy('email', this.email)
    if (existing) {
      this.logger.error(`❌ Un utilisateur avec l'email ${this.email} existe déjà`)
      return
    }

    // Générer un mot de passe si non fourni
    const password = this.password || this.generatePassword()

    // Créer l'administrateur
    const admin = await UserProfile.create({
      email: this.email,
      password: password,
      nomComplet: this.nomComplet,
      role: 'admin',
      actif: true,
    })

    this.logger.success(`✅ Administrateur créé avec succès!`)
    this.logger.info(`   Email: ${admin.email}`)
    this.logger.info(`   Nom: ${admin.nomComplet}`)
    if (!this.password) {
      this.logger.warning(`   Mot de passe: ${password}`)
      this.logger.warning(`   ⚠️  Notez ce mot de passe, il ne sera plus affiché!`)
    }
  }

  private generatePassword(): string {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }
}

