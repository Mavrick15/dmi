import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'

export default class Notification extends BaseModel {
  public static table = 'notifications'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string | null

  @column()
  declare type: 'info' | 'success' | 'warning' | 'error' | 'critical'

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare category: string | null // 'patient', 'appointment', 'pharmacy', 'finance', 'system', etc.

  @column({ columnName: 'target_id' })
  declare targetId: string | null

  @column({ columnName: 'target_type' })
  declare targetType: string | null

  @column({ columnName: 'action_url' })
  declare actionUrl: string | null

  @column({ columnName: 'is_read' })
  declare isRead: boolean

  @column({ columnName: 'is_archived' })
  declare isArchived: boolean

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ columnName: 'read_at' })
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => UserProfile, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof UserProfile>

  /**
   * Marquer comme lu
   */
  async markAsRead() {
    this.isRead = true
    this.readAt = DateTime.now()
    await this.save()
  }

  /**
   * Archiver
   */
  async archive() {
    this.isArchived = true
    await this.save()
  }
}

