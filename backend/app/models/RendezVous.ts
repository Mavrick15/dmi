import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Patient from '#models/Patient'
import Medecin from '#models/Medecin'

export default class RendezVous extends BaseModel {
  // Nom de la table explicite car "RendezVous" -> "rendez_vouses" par défaut, 
  // or ta migration a créé "rendez_vous"
  public static table = 'rendez_vous'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare patientId: string

  @column()
  declare medecinId: string

  @column.dateTime()
  declare dateHeure: DateTime

  @column()
  declare dureeMinutes: number

  @column()
  declare statut: 'programme' | 'en_cours' | 'termine' | 'annule'

  @column()
  declare motif: string | null

  @column()
  declare notes: string | null

  @column()
  declare salle: string | null

  @column()
  declare priorite: 'faible' | 'normale' | 'elevee' | 'urgente'

  // Nouveaux champs
  @column({ columnName: 'motif_annulation' })
  declare motifAnnulation: string | null

  @column({ columnName: 'annule_par' })
  declare annulePar: string | null

  @column.dateTime({ columnName: 'date_annulation' })
  declare dateAnnulation: DateTime | null

  @column({ columnName: 'rappel_envoye_24h' })
  declare rappelEnvoye24h: boolean

  @column({ columnName: 'rappel_envoye_1h' })
  declare rappelEnvoye1h: boolean

  @column.dateTime({ columnName: 'date_dernier_rappel' })
  declare dateDernierRappel: DateTime | null

  @column({ columnName: 'nombre_modifications' })
  declare nombreModifications: number

  @column.dateTime({ columnName: 'date_derniere_modification' })
  declare dateDerniereModification: DateTime | null

  @column({ columnName: 'notes_personnelles_medecin' })
  declare notesPersonnellesMedecin: string | null

  @column({ columnName: 'confirme_par_patient' })
  declare confirmeParPatient: boolean

  @column.dateTime({ columnName: 'date_confirmation_patient' })
  declare dateConfirmationPatient: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relation vers le Patient
  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  // Relation vers le Médecin
  @belongsTo(() => Medecin)
  declare medecin: BelongsTo<typeof Medecin>
}
