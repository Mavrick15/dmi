import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile' 

export default class ActivityLog extends BaseModel {
  public static table = 'activity_logs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare type: string 

  @column()
  declare description: string

  @column({ columnName: 'user_id' })
  declare userId: string | null

  @column()
  declare targetId: string | null 

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => UserProfile, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof UserProfile>
}