import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Etablissement extends BaseModel {
  public static table = 'etablissements'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nom: string

  @column()
  declare adresse: string

  @column()
  declare telephone: string | null

  @column()
  declare email: string | null

  @column({ columnName: 'type_etablissement' })
  declare typeEtablissement: string

  @column({ columnName: 'numero_agrement' })
  declare numeroAgrement: string | null

  @column()
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
