import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une consultation
 */
export const createConsultationValidator = vine.compile(
  vine.object({
    patientId: vine.string().uuid(),
    rendezVousId: vine.string().uuid().optional(),
    
    consultationData: vine.object({
      // Motif principal
      chiefComplaint: vine.string().trim().minLength(3).maxLength(500).optional(),
      
      // Durée en minutes (minimum 1 minute pour permettre les consultations très courtes)
      duration: vine.number().min(1).max(180).optional(),
      
      // Symptômes (tableau)
      symptoms: vine.array(
        vine.string().trim().minLength(2).maxLength(200)
      ).optional(),
      
      // Constantes vitales (objet)
      vitalSigns: vine.object({
        temperature: vine.number().min(30).max(45).optional(),
        bloodPressure: vine.string().regex(/^\d{2,3}\/\d{2,3}$/).optional(),
        heartRate: vine.number().min(30).max(200).optional(),
        respiratoryRate: vine.number().min(10).max(40).optional(),
        oxygenSaturation: vine.number().min(0).max(100).optional(),
        weight: vine.number().min(1).max(300).optional(),
        height: vine.number().min(50).max(250).optional(),
        bmi: vine.number().min(10).max(60).optional(),
      }).optional(),
      
      // Examen physique
      examination: vine.string().trim().maxLength(2000).optional(),
      
      // Diagnostic
      diagnosis: vine.string().trim().minLength(3).maxLength(500).optional(),
      diagnosisCode: vine.string().maxLength(20).optional(), // Code CIM-10
      diagnosisCodeId: vine.string().uuid().optional(), // ID du code CIM-10
      
      // Plan de traitement
      treatment: vine.string().trim().maxLength(2000).optional(),
      
      // Examens demandés
      requestedExams: vine.array(
        vine.string().trim().minLength(2).maxLength(200)
      ).optional(),
      
      // Médicaments prescrits
      medications: vine.array(
        vine.object({
          id: vine.string().uuid(),
          name: vine.string().trim().minLength(2),
          dosage: vine.string().trim().optional(),
          frequency: vine.string().trim().optional(),
          duration: vine.string().trim().optional(),
        })
      ).optional(),
      
      // Instructions de suivi
      followUp: vine.string().trim().maxLength(1000).optional(),
      
      // Notes de consultation
      consultationNotes: vine.string().trim().maxLength(2000).optional(),
    })
  })
)

/**
 * Validateur pour la mise à jour d'une consultation
 */
export const updateConsultationValidator = vine.compile(
  vine.object({
    consultationData: vine.object({
      // Motif principal
      chiefComplaint: vine.string().trim().minLength(3).maxLength(500).optional(),
      
      // Durée en minutes
      duration: vine.number().min(1).max(180).optional(),
      
      // Symptômes (tableau)
      symptoms: vine.array(
        vine.string().trim().minLength(2).maxLength(200)
      ).optional(),
      
      // Constantes vitales (objet)
      vitalSigns: vine.object({
        temperature: vine.number().min(30).max(45).optional(),
        bloodPressure: vine.string().regex(/^\d{2,3}\/\d{2,3}$/).optional(),
        heartRate: vine.number().min(30).max(200).optional(),
        respiratoryRate: vine.number().min(10).max(40).optional(),
        oxygenSaturation: vine.number().min(0).max(100).optional(),
        weight: vine.number().min(1).max(300).optional(),
        height: vine.number().min(50).max(250).optional(),
        bmi: vine.number().min(10).max(60).optional(),
      }).optional(),
      
      // Examen physique
      examination: vine.string().trim().maxLength(2000).optional(),
      
      // Diagnostic
      diagnosis: vine.string().trim().minLength(3).maxLength(500).optional(),
      diagnosisCode: vine.string().maxLength(20).optional(), // Code CIM-10
      diagnosisCodeId: vine.string().uuid().optional(), // ID du code CIM-10
      
      // Plan de traitement
      treatment: vine.string().trim().maxLength(2000).optional(),
      
      // Examens demandés
      requestedExams: vine.array(
        vine.string().trim().minLength(2).maxLength(200)
      ).optional(),
      
      // Médicaments prescrits
      medications: vine.array(
        vine.object({
          id: vine.string().uuid(),
          name: vine.string().trim().minLength(2),
          dosage: vine.string().trim().optional(),
          frequency: vine.string().trim().optional(),
          duration: vine.string().trim().optional(),
        })
      ).optional(),
      
      // Instructions de suivi
      followUp: vine.string().trim().maxLength(1000).optional(),
      
      // Notes de consultation
      consultationNotes: vine.string().trim().maxLength(2000).optional(),
    })
  })
)

