import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Patient from '#models/Patient'
import Consultation from '#models/Consultation'
import Transaction from '#models/Transaction'
import Analyse from '#models/Analyse'

export default class Facture extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare patientId: string

  @column()
  declare consultationId: string | null

  @column()
  declare numeroFacture: string

  @column()
  declare montantTotal: number

  @column()
  declare montantPaye: number

  @column()
  declare statut: 'en_attente' | 'payee' | 'en_retard' | 'annulee'

  @column.date()
  declare dateEmission: DateTime

  @column.date()
  declare dateEcheance: DateTime | null

  @column()
  declare notes: string | null

  // Nouveaux champs financiers
  @column({ columnName: 'montant_ht' })
  declare montantHt: number | null

  @column({ columnName: 'taux_tva' })
  declare tauxTva: number

  @column({ columnName: 'montant_tva' })
  declare montantTva: number

  @column()
  declare remise: number

  @column({ columnName: 'taux_remise' })
  declare tauxRemise: number

  // Informations de facturation
  @column({ columnName: 'adresse_facturation' })
  declare adresseFacturation: string | null

  @column({ columnName: 'mode_reglement' })
  declare modeReglement: string | null

  @column({ columnName: 'reference_client' })
  declare referenceClient: string | null

  // Champs de suivi
  @column.dateTime({ columnName: 'date_paiement_complet' })
  declare datePaiementComplet: DateTime | null

  @column({ columnName: 'nombre_relances' })
  declare nombreRelances: number

  @column.dateTime({ columnName: 'derniere_relance' })
  declare derniereRelance: DateTime | null

  @column({ columnName: 'motif_annulation' })
  declare motifAnnulation: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @belongsTo(() => Consultation, { foreignKey: 'consultationId' })
  declare consultation: BelongsTo<typeof Consultation> | null

  @hasMany(() => Transaction)
  declare transactions: HasMany<typeof Transaction>

  @manyToMany(() => Analyse, {
    pivotTable: 'facture_analyses',
    localKey: 'id',
    pivotForeignKey: 'facture_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'analyse_id'
  })
  declare analyses: ManyToMany<typeof Analyse>
}
