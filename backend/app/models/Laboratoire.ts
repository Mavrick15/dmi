import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Laboratoire extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nom: string

  @column()
  declare adresse: string

  @column()
  declare telephone: string

  @column()
  declare email: string | null

  @column({ columnName: 'contact_personne' })
  declare contactPersonne: string | null

  @column()
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

