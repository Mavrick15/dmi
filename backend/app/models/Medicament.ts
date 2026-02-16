import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Medicament extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nom: string

  @column({ columnName: 'principe_actif' })
  declare principeActif: string | null

  @column()
  declare dosage: string | null

  @column()
  declare forme: string | null

  @column()
  declare fabricant: string | null

  @column({ columnName: 'code_barre' })
  declare codeBarre: string | null

  @column({ columnName: 'prix_unitaire' })
  declare prixUnitaire: number | null

  @column({ columnName: 'stock_actuel' })
  declare stockActuel: number

  @column({ columnName: 'stock_minimum' })
  declare stockMinimum: number

  @column({ columnName: 'statut_stock' })
  declare statutStock: 'en_stock' | 'stock_faible' | 'rupture_stock'

  @column.date({ columnName: 'date_expiration' })
  declare dateExpiration: DateTime | null

  @column({ columnName: 'prescription_requise' })
  declare prescriptionRequise: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}