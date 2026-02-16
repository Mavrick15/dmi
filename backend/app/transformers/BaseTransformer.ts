/**
 * Classe de base pour tous les transformers
 * Fournit des méthodes utilitaires communes
 */
export abstract class BaseTransformer {
  /**
   * Formate une date pour l'API
   */
  protected formatDate(date: any, format: string = 'dd/MM/yyyy'): string | null {
    if (!date) return null
    if (typeof date === 'string') return date
    if (date.toFormat) return date.toFormat(format)
    return null
  }

  /**
   * Formate un nombre avec séparateurs
   */
  protected formatNumber(value: number | null | undefined, decimals: number = 0): string {
    if (value === null || value === undefined) return '0'
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  /**
   * Normalise un tableau (gère les cas null/undefined)
   */
  protected normalizeArray<T>(value: any): T[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === 'object') return Object.values(value) as T[]
    return []
  }

  /**
   * Extrait une valeur ou retourne une valeur par défaut
   */
  protected getValue<T>(value: T | null | undefined, defaultValue: T): T {
    return value !== null && value !== undefined ? value : defaultValue
  }
}

