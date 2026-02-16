import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'

export default class SessionInventaire extends BaseModel {
  public static table = 'sessions_inventaire'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare titre: string

  @column()
  declare statut: 'en_cours' | 'valide' | 'annule'

  @column.date({ columnName: 'date_debut' })
  declare dateDebut: DateTime

  @column.date({ columnName: 'date_fin' })
  declare dateFin: DateTime | null

  @column({ columnName: 'responsable_id' })
  declare responsableId: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relation vers le responsable
  @belongsTo(() => UserProfile, { foreignKey: 'responsableId' })
  declare responsable: BelongsTo<typeof UserProfile>
}
