import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'

export default class ConsultationTemplate extends BaseModel {
  public static table = 'consultation_templates'
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare category: string

  @column()
  declare description: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column({ columnName: 'is_public' })
  declare isPublic: boolean

  @column({ 
    columnName: 'template_data',
    prepare: (value: any) => JSON.stringify(value),
    serialize: (value: string) => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return {}
      }
    }
  })
  declare templateData: object

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => UserProfile, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof UserProfile>
}

