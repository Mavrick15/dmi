import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Patient from '#models/Patient'
import User from '#models/UserProfile'
import DocumentVersion from './document_version.js'
import DocumentComment from './document_comment.js'
import DocumentAccess from './document_access.js'
import DocumentApproval from './document_approval.js'

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare patientId: string 

  @column()
  declare uploadedBy: string | null

  @column()
  declare title: string

  @column()
  declare category: string

  @column()
  declare filePath: string

  @column()
  declare originalName: string

  @column()
  declare mimeType: string

  @column()
  declare size: number

  // Nouvelles colonnes Phase 1-3
  @column()
  declare version: number

  @column()
  declare parentDocumentId: number | null

  @column()
  declare description: string | null

  @column()
  declare tags: string | null // JSON array

  @column()
  declare extractedText: string | null

  @column()
  declare isSigned: boolean

  @column()
  declare signedBy: string | null

  @column.dateTime()
  declare signedAt: DateTime | null

  @column()
  declare isArchived: boolean

  @column()
  declare isWatermarked: boolean

  @column()
  declare status: 'draft' | 'pending_approval' | 'approved' | 'rejected'

  @column()
  declare approvalStep: number

  @column()
  declare approvedBy: string | null

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime()
  declare archivedAt: DateTime | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column()
  declare accessLevel: 'private' | 'shared' | 'public'

  @column()
  declare accessPermissions: string | null // JSON

  @column()
  declare metadata: Record<string, any> | null

  @column()
  declare thumbnailPath: string | null

  @column()
  declare downloadCount: number

  @column()
  declare viewCount: number

  @column.dateTime()
  declare lastViewedAt: DateTime | null

  @column()
  declare lastViewedBy: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations existantes
  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>

  @belongsTo(() => Document, { foreignKey: 'parentDocumentId' })
  declare parentDocument: BelongsTo<typeof Document>

  @belongsTo(() => User, { foreignKey: 'approvedBy' })
  declare approver: BelongsTo<typeof User> | null

  @belongsTo(() => User, { foreignKey: 'signedBy' })
  declare signer: BelongsTo<typeof User> | null

  @belongsTo(() => User, { foreignKey: 'lastViewedBy' })
  declare lastViewer: BelongsTo<typeof User> | null

  // Nouvelles relations
  @hasMany(() => DocumentVersion)
  declare versions: HasMany<typeof DocumentVersion>

  @hasMany(() => DocumentComment)
  declare comments: HasMany<typeof DocumentComment>

  @hasMany(() => DocumentAccess)
  declare accesses: HasMany<typeof DocumentAccess>

  @hasMany(() => DocumentApproval)
  declare approvals: HasMany<typeof DocumentApproval>

  // Helpers
  getTagsArray(): string[] {
    if (!this.tags) return []
    try {
      return JSON.parse(this.tags)
    } catch {
      return []
    }
  }

  setTagsArray(tags: string[]) {
    this.tags = JSON.stringify(tags)
  }

  getAccessPermissions(): { userIds?: string[], roleIds?: string[] } {
    if (!this.accessPermissions) return {}
    try {
      return JSON.parse(this.accessPermissions)
    } catch {
      return {}
    }
  }

  setAccessPermissions(permissions: { userIds?: string[], roleIds?: string[] }) {
    this.accessPermissions = JSON.stringify(permissions)
  }
}