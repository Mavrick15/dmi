import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave } from '@adonisjs/lucid/orm'
import hash from '@adonisjs/core/services/hash'

export default class UserProfile extends BaseModel {
  public static table = 'user_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  // MAPPING : Code (nomComplet) <-> DB (nom_complet)
  @column({ columnName: 'nom_complet' })
  declare nomComplet: string

  @column()
  declare telephone: string | null

  @column()
  declare adresse: string | null

  @column()
  declare role: 'admin' | 'docteur' | 'infirmiere' | 'pharmacien' | 'gestionnaire' | 'patient'

  @column()
  declare specialite: string | null

  @column({ columnName: 'numero_licence' })
  declare numeroLicence: string | null

  @column({ columnName: 'photo_profil' })
  declare photoProfil: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare actif: boolean

  // MAPPING DES DATES
  @column.dateTime({ autoCreate: true, columnName: 'date_creation' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'date_modification' })
  declare updatedAt: DateTime 

  @column.dateTime({ columnName: 'derniere_connexion' })
  declare derniereConnexion: DateTime | null

  // Protection contre la force brute
  @column({ columnName: 'failed_login_attempts' })
  declare failedLoginAttempts: number | null

  @column.dateTime({ columnName: 'locked_until' })
  declare lockedUntil: DateTime | null

  @beforeSave()
  public static async hashPassword(user: UserProfile) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }
}