import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import CommandeFournisseur from '#models/CommandeFournisseur'

export default class Fournisseur extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nom: string

  @column({ columnName: 'contact_nom' })
  declare contactNom: string | null

  @column()
  declare email: string | null

  @column()
  declare telephone: string | null

  @column()
  declare adresse: string | null

  @column({ columnName: 'delai_livraison_moyen' })
  declare delaiLivraisonMoyen: number

  @column()
  declare actif: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Un fournisseur peut avoir plusieurs commandes
  @hasMany(() => CommandeFournisseur)
  declare commandes: HasMany<typeof CommandeFournisseur>
}
