import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Cim10Code extends BaseModel {
  public static table = 'cim10_codes'
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare category: string

  @column()
  declare description: string | null

  @column({ columnName: 'parent_code' })
  declare parentCode: string | null

  @column({ columnName: 'usage_count' })
  declare usageCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Cim10Code, { foreignKey: 'parentCode', localKey: 'code' })
  declare parent: BelongsTo<typeof Cim10Code>
}

