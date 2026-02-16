import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Facture from '#models/Facture'

export default class Transaction extends BaseModel {
  public static table = 'transactions_financieres'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'facture_id' })
  declare factureId: string

  @column({ columnName: 'type_transaction' })
  declare typeTransaction: 'consultation' | 'traitement' | 'medicament' | 'analyse'

  @column()
  declare montant: number

  @column({ columnName: 'methode_paiement' })
  declare methodePaiement: string | null

  @column({ columnName: 'numero_transaction' })
  declare numeroTransaction: string | null

  @column.dateTime({ columnName: 'date_transaction' })
  declare dateTransaction: DateTime

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Facture)
  declare facture: BelongsTo<typeof Facture>
}
