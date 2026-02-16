import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RolePermission extends BaseModel {
  public static table = 'role_permissions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare role: string

  @column()
  declare permission: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Obtenir toutes les permissions d'un rôle
   */
  public static async getRolePermissions(role: string): Promise<string[]> {
    const permissions = await this.query()
      .where('role', role)
      .select('permission')
    
    return permissions.map(p => p.permission)
  }

  /**
   * Définir les permissions d'un rôle (remplace les anciennes)
   */
  public static async setRolePermissions(role: string, permissions: string[]): Promise<void> {
    // Supprimer les anciennes permissions
    await this.query().where('role', role).delete()
    
    // Ajouter les nouvelles permissions
    if (permissions.length > 0) {
      await this.createMany(
        permissions.map(permission => ({
          role,
          permission
        }))
      )
    }
  }

  /**
   * Ajouter une permission à un rôle
   */
  public static async addPermission(role: string, permission: string): Promise<void> {
    await this.firstOrCreate(
      { role, permission },
      { role, permission }
    )
  }

  /**
   * Retirer une permission d'un rôle
   */
  public static async removePermission(role: string, permission: string): Promise<void> {
    await this.query()
      .where('role', role)
      .where('permission', permission)
      .delete()
  }

  /**
   * Vérifier si un rôle a une permission
   */
  public static async hasPermission(role: string, permission: string): Promise<boolean> {
    const result = await this.query()
      .where('role', role)
      .where('permission', permission)
      .first()
    
    return !!result
  }
}

