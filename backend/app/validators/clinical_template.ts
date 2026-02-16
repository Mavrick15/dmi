import vine from '@vinejs/vine'

export const createTemplateValidator = vine.compile(
  vine.object({
    name: vine.string()
      .trim()
      .minLength(3, 'Le nom du template doit contenir au moins 3 caractères')
      .maxLength(255, 'Le nom du template ne peut pas dépasser 255 caractères'),
    category: vine.string()
      .trim()
      .maxLength(100, 'Le nom de catégorie ne peut pas dépasser 100 caractères')
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom de catégorie contient des caractères invalides'),
    description: vine.string()
      .trim()
      .maxLength(500, 'La description ne peut pas dépasser 500 caractères')
      .optional(),
    isPublic: vine.boolean().optional(),
    templateData: vine.object({
      symptoms: vine.array(vine.string().maxLength(200)).maxLength(50).optional(),
      commonExams: vine.array(vine.string().maxLength(200)).maxLength(50).optional(),
      chiefComplaint: vine.string().maxLength(500).optional(),
      examination: vine.string().maxLength(2000).optional(),
      diagnosis: vine.string().maxLength(500).optional(),
      treatment: vine.string().maxLength(2000).optional(),
    }),
  })
)

export const updateTemplateValidator = vine.compile(
  vine.object({
    name: vine.string()
      .trim()
      .minLength(3, 'Le nom du template doit contenir au moins 3 caractères')
      .maxLength(255, 'Le nom du template ne peut pas dépasser 255 caractères')
      .optional(),
    category: vine.string()
      .trim()
      .maxLength(100, 'Le nom de catégorie ne peut pas dépasser 100 caractères')
      .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom de catégorie contient des caractères invalides')
      .optional(),
    description: vine.string()
      .trim()
      .maxLength(500, 'La description ne peut pas dépasser 500 caractères')
      .optional(),
    isPublic: vine.boolean().optional(),
    templateData: vine.object({
      symptoms: vine.array(vine.string().maxLength(200)).maxLength(50).optional(),
      commonExams: vine.array(vine.string().maxLength(200)).maxLength(50).optional(),
      chiefComplaint: vine.string().maxLength(500).optional(),
      examination: vine.string().maxLength(2000).optional(),
      diagnosis: vine.string().maxLength(500).optional(),
      treatment: vine.string().maxLength(2000).optional(),
    }).optional(),
  })
)

