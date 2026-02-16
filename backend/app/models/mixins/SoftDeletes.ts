import { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { BaseModel, column, beforeFind, beforeFetch } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
// Import avec "type" pour éviter l'erreur précédente
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export default function composeSoftDeletes<T extends NormalizeConstructor<typeof BaseModel>>(
  superclass: T
) {
  class SoftDeletesModel extends superclass {
    @column.dateTime()
    declare deletedAt: DateTime | null

    @beforeFind()
    public static softDeletesFind(query: ModelQueryBuilderContract<typeof SoftDeletesModel>) {
      // On applique directement le filtre sans passer par .via()
      query.whereNull('deleted_at')
    }

    @beforeFetch()
    public static softDeletesFetch(query: ModelQueryBuilderContract<typeof SoftDeletesModel>) {
      // Idem ici
      query.whereNull('deleted_at')
    }

    // Méthode pour supprimer (soft)
    public async delete() {
      this.deletedAt = DateTime.now()
      await this.save()
    }

    // Méthode pour restaurer
    public async restore() {
      this.deletedAt = null
      await this.save()
    }

    // Méthode pour forcer la suppression réelle
    public async forceDelete() {
      await super.delete()
    }
  }

  return SoftDeletesModel
}