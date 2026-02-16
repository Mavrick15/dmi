import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/Document'
import UserProfile from '#models/UserProfile'

export default class DocumentApproval extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare documentId: number

  @column()
  declare stepNumber: number

  @column()
  declare approverId: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare comment: string | null

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>

  @belongsTo(() => UserProfile, { foreignKey: 'approverId' })
  declare approver: BelongsTo<typeof UserProfile>
}
