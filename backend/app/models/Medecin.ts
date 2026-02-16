import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import UserProfile from '#models/UserProfile'
import Department from '#models/department'

export default class Medecin extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare numeroOrdre: string

  @column()
  declare specialite: string

  @column()
  declare departmentId: string | null

  @column()
  declare etablissementId: string | null

  @column()
  declare disponible: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relation vers le profil utilisateur (pour avoir le nom du médecin)
  @belongsTo(() => UserProfile, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof UserProfile>

  // Relation vers le département
  @belongsTo(() => Department, {
    foreignKey: 'departmentId',
  })
  declare department: BelongsTo<typeof Department>
}
