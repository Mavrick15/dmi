import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CommonSymptom extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare code: string | null

  @column()
  declare category: string | null

  @column()
  declare description: string | null

  @column()
  declare actif: boolean

  @column()
  declare ordreAffichage: number

  @column()
  declare frequenceUtilisation: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

