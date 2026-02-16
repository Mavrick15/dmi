import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Consultation from '#models/Consultation'
import Medicament from '#models/Medicament'

export default class Prescription extends BaseModel {
  // On pointe vers votre table existante
  public static table = 'prescriptions'

  @column({ isPrimary: true })
  declare id: string // UUID

  @column({ columnName: 'consultation_id' })
  declare consultationId: string

  @column({ columnName: 'medicament_id' })
  declare medicamentId: string

  @column()
  declare quantite: number

  @column()
  declare posologie: string // Correspond au champ frontend "frequency"

  @column({ columnName: 'duree_traitement' })
  declare dureeTraitement: string | null // Correspond au champ frontend "duration"

  @column({ columnName: 'instructions_speciales' })
  declare instructionsSpeciales: string | null

  @column()
  declare delivre: boolean // Pour savoir si la pharmacie a donné le médicament

  @column.dateTime({ columnName: 'date_prescription', autoCreate: true })
  declare datePrescription: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // --- RELATIONS ---

  @belongsTo(() => Consultation, {
    foreignKey: 'consultationId',
  })
  declare consultation: BelongsTo<typeof Consultation>

  @belongsTo(() => Medicament, {
    foreignKey: 'medicamentId',
  })
  declare medicament: BelongsTo<typeof Medicament>
}