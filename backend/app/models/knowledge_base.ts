import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class KnowledgeBase extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare type: 'protocols' | 'medications' | 'diagnostics' | 'procedures' | 'guidelines'

  @column()
  declare title: string | null

  @column()
  declare name: string | null

  @column()
  declare description: string | null

  @column()
  declare category: string | null

  @column()
  declare code: string | null

  @column()
  declare urgency: 'standard' | 'priority' | 'urgent'

  // Champs spécifiques aux médicaments
  @column()
  declare dosage: string | null

  @column()
  declare contraindications: string | null

  @column()
  declare interactions: string | null

  @column()
  declare sideEffects: string | null

  // Champs spécifiques aux diagnostics
  @column()
  declare criteria: string | null

  @column()
  declare examinations: string | null

  @column()
  declare differential: string | null

  // Champs spécifiques aux procédures
  @column()
  declare indication: string | null

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null;
      
      // Si c'est déjà un tableau, le retourner tel quel
      if (Array.isArray(value)) return value;
      
      // Essayer de parser comme JSON
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        // Si le JSON parsé n'est pas un tableau, le convertir en tableau
        return [String(parsed)];
      } catch {
        // Si le parsing JSON échoue, traiter comme une chaîne simple
        // Pour les steps, on peut séparer par des retours à la ligne ou des points-virgules
        // ou simplement retourner un tableau avec la chaîne complète
        const lines = value.split(/\n|;|\./).map(step => step.trim()).filter(step => step.length > 0);
        return lines.length > 0 ? lines : [value];
      }
    },
  })
  declare steps: string[] | null

  @column()
  declare complications: string | null

  // Champs spécifiques aux directives
  @column({
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null;
      
      // Si c'est déjà un objet, le retourner tel quel
      if (typeof value === 'object' && !Array.isArray(value)) return value;
      
      // Essayer de parser comme JSON
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
        // Si le JSON parsé n'est pas un objet, créer un objet avec la valeur
        return { content: String(parsed) };
      } catch {
        // Si le parsing JSON échoue, traiter comme une chaîne simple
        // Créer un objet avec la chaîne comme valeur
        return { content: value };
      }
    },
  })
  declare content: Record<string, any> | null

  // Tags pour la recherche
  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null;
      
      // Si c'est déjà un tableau, le retourner tel quel
      if (Array.isArray(value)) return value;
      
      // Essayer de parser comme JSON
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        // Si le JSON parsé n'est pas un tableau, le convertir en tableau
        return [String(parsed)];
      } catch {
        // Si le parsing JSON échoue, traiter comme une chaîne simple
        // Séparer par virgule et nettoyer les espaces
        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    },
  })
  declare tags: string[] | null

  @column.date()
  declare lastUpdated: DateTime | null

  @column()
  declare actif: boolean

  @column()
  declare ordreAffichage: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

