import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CommandeFournisseur from '#models/CommandeFournisseur' // Assurez-vous de la casse
import Medicament from '#models/Medicament' // <--- CORRECTION DE LA CASSE

export default class LigneCommandeFournisseur extends BaseModel {
  public static table = 'lignes_commande_fournisseur'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'commande_id' })
  declare commandeId: string

  @column({ columnName: 'medicament_id' })
  declare medicamentId: string

  @column({ columnName: 'quantite_commandee' })
  declare quantiteCommandee: number

  @column({ columnName: 'quantite_recue' })
  declare quantiteRecue: number

  @column({ columnName: 'prix_unitaire_achat' })
  declare prixUnitaireAchat: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => CommandeFournisseur, { foreignKey: 'commandeId' })
  declare commande: BelongsTo<typeof CommandeFournisseur>

  @belongsTo(() => Medicament)
  declare medicament: BelongsTo<typeof Medicament>
}