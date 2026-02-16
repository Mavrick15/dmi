import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/Document'
import UserProfile from '#models/UserProfile'

export default class DocumentVersion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare documentId: number

  @column()
  declare versionNumber: number

  @column()
  declare filePath: string

  @column()
  declare changeSummary: string | null

  @column()
  declare createdBy: string | null

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>

  @belongsTo(() => UserProfile, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof UserProfile>
}
