import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Medicament from '#models/Medicament' // <--- CORRECTION DE LA CASSE
import CommandeFournisseur from '#models/CommandeFournisseur'
import UserProfile from '#models/UserProfile'

export default class InventaireMouvement extends BaseModel {
  public static table = 'inventaire_mouvements'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'medicament_id' })
  declare medicamentId: string

  @column({ columnName: 'type_mouvement' })
  declare typeMouvement: 'entree' | 'sortie' | 'ajustement'

  @column()
  declare quantite: number

  @column({ columnName: 'prix_unitaire' })
  declare prixUnitaire: number | null

  @column()
  declare raison: string | null

  @column({ columnName: 'numero_lot' })
  declare numeroLot: string | null

  @column({ columnName: 'date_expiration' })
  declare dateExpiration: DateTime | null

  @column({ columnName: 'utilisateur_id' })
  declare utilisateurId: string | null

  @column({ columnName: 'commande_fournisseur_id' })
  declare commandeFournisseurId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Medicament)
  declare medicament: BelongsTo<typeof Medicament>

  @belongsTo(() => CommandeFournisseur)
  declare commande: BelongsTo<typeof CommandeFournisseur>

  @belongsTo(() => UserProfile, { foreignKey: 'utilisateurId' })
  declare utilisateur: BelongsTo<typeof UserProfile>
}