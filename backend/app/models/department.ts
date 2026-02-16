import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Medecin from '#models/Medecin'

export default class Department extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nom: string

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column()
  declare couleur: string

  @column()
  declare actif: boolean

  @column()
  declare ordreAffichage: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relation vers les médecins
  @hasMany(() => Medecin, {
    foreignKey: 'departmentId',
  })
  declare medecins: HasMany<typeof Medecin>
}
