import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/Document'
import UserProfile from '#models/UserProfile'

export default class DocumentComment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare documentId: number

  @column()
  declare userId: string

  @column()
  declare content: string

  @column()
  declare parentCommentId: number | null

  @column()
  declare annotations: Record<string, any> | null

  @column()
  declare isResolved: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>

  @belongsTo(() => UserProfile, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof UserProfile>

  @belongsTo(() => DocumentComment, { foreignKey: 'parentCommentId' })
  declare parentComment: BelongsTo<typeof DocumentComment>
}
