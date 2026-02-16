import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'

export default class QuickNote extends BaseModel {
  public static table = 'quick_notes'
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare text: string

  @column()
  declare category: string

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column({ columnName: 'is_public' })
  declare isPublic: boolean

  @column({ columnName: 'usage_count' })
  declare usageCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => UserProfile, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof UserProfile>
}

