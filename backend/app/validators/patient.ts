import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'un patient
 */
export const createPatientValidator = vine.compile(
  vine.object({
    // --- Infos UserProfile ---
    nomComplet: vine.string().trim().minLength(2).maxLength(100),
    
    // Email optionnel pour un patient (ex: enfant), mais s'il est là, il doit être valide
    email: vine.string().email().optional(), 
    
    telephone: vine.string().optional(),
    adresse: vine.string().optional(),

    // --- Infos Patient ---
    // VineJS gère le parsing des dates ISO (YYYY-MM-DD) et renvoie un objet Date JS
    dateNaissance: vine.date({ formats: ['YYYY-MM-DD', 'x'] }).optional(),
    
    sexe: vine.enum(['masculin', 'feminin', 'autre']),
    
    assuranceMaladie: vine.string().optional(),
    numeroAssurance: vine.string().optional(),
    
    contactUrgenceNom: vine.string().optional(),
    contactUrgenceTelephone: vine.string().optional(),
    
    antecedentsMedicaux: vine.string().optional(),
    groupeSanguin: vine.string().optional(),
    allergies: vine.any().optional().transform((value) => {
      // Accepter null, undefined ou string vide
      if (value === null || value === undefined || value === '') {
        return null
      }
      // Si c'est déjà un array, le retourner
      if (Array.isArray(value)) {
        return value
      }
      // Si c'est une string, la convertir en array
      if (typeof value === 'string') {
        return [value]
      }
      return null
    }),
    
    // Nouveaux champs complets
    lieuNaissance: vine.string().optional(),
    ville: vine.string().optional(),
    codePostal: vine.string().optional(),
    pays: vine.string().optional(),
    contactUrgenceRelation: vine.string().optional(),
    profession: vine.string().optional(),
    situationFamiliale: vine.string().optional(),
    langue: vine.string().optional(),
    medicamentsActuels: vine.string().optional(),
    antecedentsFamiliaux: vine.string().optional(),
    vaccinations: vine.string().optional(),
    handicaps: vine.string().optional(),
    donneurOrganes: vine.boolean().optional(),
  })
)

/**
 * Validateur pour la mise à jour (tous les champs deviennent optionnels)
 */
export const updatePatientValidator = vine.compile(
  vine.object({
    nomComplet: vine.string().trim().minLength(2).optional(),
    email: vine.string().email().optional(),
    telephone: vine.string().optional(),
    adresse: vine.string().optional(),
    
    dateNaissance: vine.date({ formats: ['YYYY-MM-DD', 'x'] }).optional(),
    sexe: vine.enum(['masculin', 'feminin', 'autre']).optional(),
    
    assuranceMaladie: vine.string().optional(),
    numeroAssurance: vine.string().optional(),
    contactUrgenceNom: vine.string().optional(),
    contactUrgenceTelephone: vine.string().optional(),
    antecedentsMedicaux: vine.string().optional(),
    groupeSanguin: vine.string().optional(),
    allergies: vine.any().optional().transform((value) => {
      // Accepter null, undefined ou string vide
      if (value === null || value === undefined || value === '') {
        return null
      }
      // Si c'est déjà un array, le retourner
      if (Array.isArray(value)) {
        return value
      }
      // Si c'est une string, la convertir en array
      if (typeof value === 'string') {
        return [value]
      }
      return null
    }),
    
    // Nouveaux champs complets
    lieuNaissance: vine.string().optional(),
    ville: vine.string().optional(),
    codePostal: vine.string().optional(),
    pays: vine.string().optional(),
    contactUrgenceRelation: vine.string().optional(),
    profession: vine.string().optional(),
    situationFamiliale: vine.string().optional(),
    langue: vine.string().optional(),
    medicamentsActuels: vine.string().optional(),
    antecedentsFamiliaux: vine.string().optional(),
    vaccinations: vine.string().optional(),
    handicaps: vine.string().optional(),
    donneurOrganes: vine.boolean().optional(),
  })
)