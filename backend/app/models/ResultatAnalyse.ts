import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Analyse from '#models/Analyse'
import UserProfile from '#models/UserProfile'

export default class ResultatAnalyse extends BaseModel {
  public static table = 'resultats_analyse'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'analyse_id' })
  declare analyseId: string

  @column()
  declare parametre: string

  @column()
  declare valeur: string

  @column()
  declare unite: string | null

  @column({ columnName: 'valeur_normale_min' })
  declare valeurNormaleMin: number | null

  @column({ columnName: 'valeur_normale_max' })
  declare valeurNormaleMax: number | null

  @column()
  declare interpretation: 'normal' | 'anormal_bas' | 'anormal_haut' | 'critique'

  @column()
  declare commentaire: string | null

  @column()
  declare annotation: string | null

  @column()
  declare signature: string | null

  @column({ columnName: 'valide_par' })
  declare validePar: string | null

  @column.dateTime({ columnName: 'date_validation' })
  declare dateValidation: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // --- RELATIONS ---
  @belongsTo(() => Analyse)
  declare analyse: BelongsTo<typeof Analyse>

  @belongsTo(() => UserProfile, {
    foreignKey: 'validePar',
  })
  declare valideur: BelongsTo<typeof UserProfile>
}

