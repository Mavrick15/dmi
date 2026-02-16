import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TypeAnalyse extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code: string

  @column()
  declare nom: string

  @column()
  declare categorie: 'hematologie' | 'biochimie' | 'serologie' | 'microbiologie' | 'imagerie' | 'autre'

  @column()
  declare description: string | null

  @column({
    columnName: 'parametres_par_defaut',
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      return JSON.stringify(value)
    },
    serialize: (value: string | null) => {
      if (!value || value === 'null') return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    }
  })
  declare parametresParDefaut: object | null

  @column({ columnName: 'duree_moyenne' })
  declare dureeMoyenne: number | null

  @column()
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

