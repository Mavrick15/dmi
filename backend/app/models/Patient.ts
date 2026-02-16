// backend/app/models/Patient.ts

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers' // <--- IMPORT NÉCESSAIRE
import SoftDeletes from '#models/mixins/SoftDeletes' // <--- IMPORT DU MIXIN

import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'
import RendezVous from '#models/RendezVous'
import Facture from '#models/Facture'
import Consultation from '#models/Consultation'
import Document from '#models/Document'

export default class Patient extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'numero_patient' })
  declare numeroPatient: string

  @column.date({ columnName: 'date_naissance' })
  declare dateNaissance: DateTime | null

  @column()
  declare sexe: 'masculin' | 'feminin' | 'autre' | null

  @column({ columnName: 'groupe_sanguin' })
  declare groupeSanguin: string | null

  @column({
    prepare: (value: string[] | null | undefined) => {
      // Si la valeur est null, undefined, ou un tableau vide, retourner null
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return null
      }
      // Si c'est déjà un tableau, le stringifier
      if (Array.isArray(value)) {
        return JSON.stringify(value)
      }
      // Sinon, créer un tableau avec la valeur et le stringifier
      return JSON.stringify([value])
    },
    serialize: (value: string | null) => {
      if (!value || value === 'null') return null
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        // Si le parsing échoue, retourner un tableau vide plutôt que null
        return []
      }
    }
  })
  declare allergies: string[] | null 

  @column({ columnName: 'antecedents_medicaux' })
  declare antecedentsMedicaux: string | null

  @column({ columnName: 'contact_urgence_nom' })
  declare contactUrgenceNom: string | null

  @column({ columnName: 'contact_urgence_telephone' })
  declare contactUrgenceTelephone: string | null

  @column({ columnName: 'assurance_maladie' })
  declare assuranceMaladie: string | null

  @column({ columnName: 'numero_assurance' })
  declare numeroAssurance: string | null

  @column({ columnName: 'lieu_naissance' })
  declare lieuNaissance: string | null

  @column()
  declare ville: string | null

  @column({ columnName: 'code_postal' })
  declare codePostal: string | null

  @column()
  declare pays: string | null

  @column({ columnName: 'contact_urgence_relation' })
  declare contactUrgenceRelation: string | null

  @column()
  declare profession: string | null

  @column({ columnName: 'situation_familiale' })
  declare situationFamiliale: string | null

  @column()
  declare langue: string | null

  @column({ columnName: 'medicaments_actuels' })
  declare medicamentsActuels: string | null

  @column({ columnName: 'antecedents_familiaux' })
  declare antecedentsFamiliaux: string | null

  @column()
  declare vaccinations: string | null

  @column()
  declare handicaps: string | null

  @column({ columnName: 'donneur_organes' })
  declare donneurOrganes: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => UserProfile, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof UserProfile>

  @hasMany(() => RendezVous)
  declare rendezVous: HasMany<typeof RendezVous>

  @hasMany(() => Consultation)
  declare consultations: HasMany<typeof Consultation>

  @hasMany(() => Facture)
  declare factures: HasMany<typeof Facture>
  
  @hasMany(() => Document)
  declare documents: HasMany<typeof Document>
}