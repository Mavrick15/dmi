import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations' // Import du type
import { DateTime } from 'luxon'
import UserProfile from '#models/UserProfile'

export default class ApiToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: string

  @column()
  declare token: string

  @column()
  declare userId: string

  @column()
  declare isRevoked: boolean

  @column.dateTime()
  declare expiresAt: DateTime | null

  // Refresh token support
  @column({ columnName: 'refresh_token' })
  declare refreshToken: string | null

  @column.dateTime({ columnName: 'refresh_expires_at' })
  declare refreshExpiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => UserProfile, {
    foreignKey: 'userId', 
  })
  declare user: BelongsTo<typeof UserProfile>
}