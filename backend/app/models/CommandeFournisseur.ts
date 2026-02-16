import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Fournisseur from '#models/Fournisseur'
import UserProfile from '#models/UserProfile'
import LigneCommandeFournisseur from '#models/LigneCommandeFournisseur'

export default class CommandeFournisseur extends BaseModel {
  public static table = 'commandes_fournisseurs'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'numero_commande' })
  declare numeroCommande: string

  @column({ columnName: 'fournisseur_id' })
  declare fournisseurId: string

  @column()
  declare statut: 'brouillon' | 'commandee' | 'partiellement_recue' | 'recue' | 'annulee'

  @column.date({ columnName: 'date_commande' })
  declare dateCommande: DateTime

  @column.date({ columnName: 'date_livraison_estimee' })
  declare dateLivraisonEstimee: DateTime | null

  @column({ columnName: 'montant_total' })
  declare montantTotal: number

  @column({ columnName: 'cree_par' })
  declare creePar: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Fournisseur)
  declare fournisseur: BelongsTo<typeof Fournisseur>

  @belongsTo(() => UserProfile, { foreignKey: 'creePar' })
  declare createur: BelongsTo<typeof UserProfile>

  @hasMany(() => LigneCommandeFournisseur, { foreignKey: 'commandeId' })
  declare lignes: HasMany<typeof LigneCommandeFournisseur>
}
