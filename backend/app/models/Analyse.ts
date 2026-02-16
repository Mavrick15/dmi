import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Patient from '#models/Patient'
import Medecin from '#models/Medecin'
import Consultation from '#models/Consultation'
import ResultatAnalyse from '#models/ResultatAnalyse'
import Facture from '#models/Facture'

export default class Analyse extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'numero_analyse' })
  declare numeroAnalyse: string

  @column({ columnName: 'patient_id' })
  declare patientId: string

  @column({ columnName: 'consultation_id' })
  declare consultationId: string | null

  @column({ columnName: 'medecin_id' })
  declare medecinId: string | null

  @column({ columnName: 'type_analyse' })
  declare typeAnalyse: 'hematologie' | 'biochimie' | 'serologie' | 'microbiologie' | 'imagerie' | 'autre'

  @column()
  declare statut: 'prescrite' | 'en_cours' | 'terminee' | 'annulee' | 'en_attente_validation'

  @column.dateTime({ columnName: 'date_prescription', autoCreate: true })
  declare datePrescription: DateTime

  @column.dateTime({ columnName: 'date_prelevement' })
  declare datePrelevement: DateTime | null

  @column.dateTime({ columnName: 'date_reception' })
  declare dateReception: DateTime | null

  @column.dateTime({ columnName: 'date_resultat' })
  declare dateResultat: DateTime | null

  @column()
  declare laboratoire: string | null

  @column({ columnName: 'notes_prescription' })
  declare notesPrescription: string | null

  @column()
  declare priorite: 'normale' | 'urgente' | 'critique'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // --- RELATIONS ---
  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @belongsTo(() => Medecin)
  declare medecin: BelongsTo<typeof Medecin>

  @belongsTo(() => Consultation)
  declare consultation: BelongsTo<typeof Consultation>

  @hasMany(() => ResultatAnalyse)
  declare resultats: HasMany<typeof ResultatAnalyse>

  @manyToMany(() => Facture, {
    pivotTable: 'facture_analyses',
    localKey: 'id',
    pivotForeignKey: 'analyse_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'facture_id'
  })
  declare factures: ManyToMany<typeof Facture>
}

