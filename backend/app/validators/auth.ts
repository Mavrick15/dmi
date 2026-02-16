import vine from '@vinejs/vine'

/**
 * Validateur pour l'inscription (Register)
 */
export const registerValidator = vine.compile(
  vine.object({
    nomComplet: vine.string().trim().minLength(3).maxLength(100),
    
    // Vérifie le format email ET s'il est unique dans la table 'user_profiles'
    email: vine.string().email().unique(async (db, value) => {
      const user = await db
        .from('user_profiles')
        .where('email', value)
        .first()
      return !user
    }),

    password: vine.string().minLength(8).maxLength(32),
    
    // Force le rôle à être une des valeurs autorisées
    role: vine.enum(['admin', 'docteur', 'infirmiere', 'pharmacien', 'gestionnaire', 'patient', 'it_specialist']),
    
    telephone: vine.string().optional(),
    adresse: vine.string().optional(),

    // Champs spécifiques docteur (optionnels dans le payload global)
    specialite: vine.string().optional(),
    numeroOrdre: vine.string().optional(),
    etablissementId: vine.string().uuid().optional(),
    
    actif: vine.boolean().optional()
  })
)

/**
 * Validateur pour la connexion (Login)
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
    rememberMe: vine.boolean().optional(), // Option "Se souvenir de moi"
  })
)

/**
 * Validateur pour la mise à jour du profil (Mon compte)
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    nomComplet: vine.string().trim().minLength(2).maxLength(100).optional(),
    telephone: vine.string().trim().maxLength(20).optional(),
    adresse: vine.string().trim().maxLength(255).optional(),
    photoProfil: vine.string().trim().maxLength(500).optional(),
  })
)

/**
 * Validateur pour le changement de mot de passe
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8).maxLength(32),
  })
)