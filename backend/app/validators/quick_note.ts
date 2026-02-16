import vine from '@vinejs/vine'

export const createQuickNoteValidator = vine.compile(
  vine.object({
    text: vine.string()
      .trim()
      .minLength(3, 'Le texte de la note doit contenir au moins 3 caractères')
      .maxLength(1000, 'Le texte de la note ne peut pas dépasser 1000 caractères'),
    category: vine.string()
      .trim()
      .maxLength(50, 'Le nom de catégorie ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom de catégorie contient des caractères invalides'),
    isPublic: vine.boolean().optional(),
  })
)

export const updateQuickNoteValidator = vine.compile(
  vine.object({
    text: vine.string()
      .trim()
      .minLength(3, 'Le texte de la note doit contenir au moins 3 caractères')
      .maxLength(1000, 'Le texte de la note ne peut pas dépasser 1000 caractères')
      .optional(),
    category: vine.string()
      .trim()
      .maxLength(50, 'Le nom de catégorie ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom de catégorie contient des caractères invalides')
      .optional(),
    isPublic: vine.boolean().optional(),
  })
)

