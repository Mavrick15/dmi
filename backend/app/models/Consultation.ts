import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Patient from '#models/Patient'
import Medecin from '#models/Medecin'
import RendezVous from '#models/RendezVous'
import Cim10Code from '#models/Cim10Code' 

export default class Consultation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'rendez_vous_id' })
  declare rendezVousId: string | null

  @column({ columnName: 'patient_id' })
  declare patientId: string

  @column({ columnName: 'medecin_id' })
  declare medecinId: string
  
  // --- NOUVEAU CHAMP ---
  @column({ columnName: 'duree_consultation' })
  declare dureeConsultation: number | null

  // --- CHAMPS JSON ---
  @column({ 
    columnName: 'motif_principal' 
  })
  declare motifPrincipal: string | null

  @column({ 
    columnName: 'symptomes_associes', 
    serializeAs: 'symptoms',
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      return JSON.stringify(value)
    },
    serialize: (value: string | null) => {
      if (!value || value === 'null') return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    }
  })
  declare symptomesAssocies: object | null 

  @column({ 
    columnName: 'constantes_vitales', 
    serializeAs: 'vitalSigns',
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      return JSON.stringify(value)
    },
    serialize: (value: string | null) => {
      if (!value || value === 'null') return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    }
  })
  declare constantesVitales: object | null 
  
  @column({ 
    columnName: 'examens_demandes', 
    serializeAs: 'requestedExams',
    prepare: (value: any) => {
      if (value === null || value === undefined) return null
      return JSON.stringify(value)
    },
    serialize: (value: string | null) => {
      if (!value || value === 'null') return null
      try {
        return typeof value === 'string' ? JSON.parse(value) : value
      } catch {
        return null
      }
    }
  })
  declare examensDemandes: object | null

  // --- CHAMPS TEXTE ---
  @column({ columnName: 'examen_physique' })
  declare examenPhysique: string | null

  @column({ columnName: 'diagnostic_principal' })
  declare diagnosticPrincipal: string | null

  @column({ columnName: 'plan_traitement' })
  declare planTraitement: string | null

  @column({ columnName: 'instructions_suivi' })
  declare instructionsSuivi: string | null
  
  @column({ columnName: 'notes_consultation' })
  declare notesConsultation: string | null

  // --- CODE CIM-10 ---
  @column({ columnName: 'diagnosis_code' })
  declare diagnosisCode: string | null

  @column({ columnName: 'diagnosis_code_id' })
  declare diagnosisCodeId: string | null

  // --- CHAMPS COMPATIBILITÉ ---
  @column()
  declare diagnostic: string | null 

  @column()
  declare symptomes: string | null
  
  @column({ columnName: 'traitement_prescrit' })
  declare traitementPrescrit: string | null

  @column.dateTime({ columnName: 'date_consultation' })
  declare dateConsultation: DateTime

  // Nouveaux champs - Données anthropométriques
  @column()
  declare poids: number | null

  @column()
  declare taille: number | null

  @column()
  declare imc: number | null

  @column()
  declare temperature: number | null

  @column({ columnName: 'pression_arterielle_systolique' })
  declare pressionArterielleSystolique: number | null

  @column({ columnName: 'pression_arterielle_diastolique' })
  declare pressionArterielleDiastolique: number | null

  @column({ columnName: 'frequence_cardiaque' })
  declare frequenceCardiaque: number | null

  @column({ columnName: 'frequence_respiratoire' })
  declare frequenceRespiratoire: number | null

  @column({ columnName: 'saturation_o2' })
  declare saturationO2: number | null

  // Informations supplémentaires
  @column({ columnName: 'evolution_depuis_derniere_consultation' })
  declare evolutionDepuisDerniereConsultation: string | null

  @column({ columnName: 'observations_generales' })
  declare observationsGenerales: string | null

  @column({ columnName: 'consultation_urgente' })
  declare consultationUrgente: boolean

  @column({ columnName: 'contexte_urgence' })
  declare contexteUrgence: string | null

  // Suivi et rappels
  @column.date({ columnName: 'date_prochaine_consultation' })
  declare dateProchaineConsultation: DateTime | null

  @column({ columnName: 'raison_prochaine_consultation' })
  declare raisonProchaineConsultation: string | null

  @column({ columnName: 'rappels_envoies' })
  declare rappelsEnvoies: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // --- RELATIONS ---
  @belongsTo(() => Patient)
  declare patient: BelongsTo<typeof Patient>

  @belongsTo(() => Medecin)
  declare medecin: BelongsTo<typeof Medecin>
  
  @belongsTo(() => RendezVous)
  declare rendezVous: BelongsTo<typeof RendezVous>

  @belongsTo(() => Cim10Code, { foreignKey: 'diagnosisCodeId' })
  declare cim10Code: BelongsTo<typeof Cim10Code>

  /**
   * Calcule et définit l'IMC automatiquement si poids et taille sont disponibles
   */
  public calculateIMC(): void {
    if (this.poids && this.taille && this.taille > 0) {
      // Taille en mètres (convertir depuis cm si nécessaire)
      const tailleEnMetres = this.taille > 3 ? this.taille / 100 : this.taille
      this.imc = Number((this.poids / (tailleEnMetres * tailleEnMetres)).toFixed(2))
    } else {
      this.imc = null
    }
  }

  @beforeSave()
  public static async calculateIMCHook(consultation: Consultation) {
    if (consultation.$dirty.poids || consultation.$dirty.taille) {
      consultation.calculateIMC()
    }
  }
}