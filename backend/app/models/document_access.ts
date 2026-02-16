import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/Document'
import UserProfile from '#models/UserProfile'

export default class DocumentAccess extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare documentId: number

  @column()
  declare userId: string | null

  @column()
  declare role: string | null

  @column()
  declare permission: 'read' | 'write' | 'delete'

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare grantedAt: DateTime

  @column()
  declare grantedBy: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>

  @belongsTo(() => UserProfile, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof UserProfile> | null

  @belongsTo(() => UserProfile, { foreignKey: 'grantedBy' })
  declare granter: BelongsTo<typeof UserProfile> | null
}
