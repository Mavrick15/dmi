import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

export interface PermissionDefinition {
  name: string
  category: string
  description: string
  isActive?: boolean
}

const PERMISSIONS_FILE = join(app.makePath('config'), 'permissions.json')

/**
 * Charger les permissions depuis le fichier JSON
 */
export async function loadPermissions(): Promise<PermissionDefinition[]> {
  try {
    const content = await readFile(PERMISSIONS_FILE, 'utf-8')
    const permissions = JSON.parse(content) as PermissionDefinition[]
    // Filtrer les permissions actives (par défaut toutes sont actives)
    return permissions.filter(p => p.isActive !== false)
  } catch (error) {
    // Si le fichier n'existe pas, retourner un tableau vide
    return []
  }
}

/**
 * Sauvegarder les permissions dans le fichier JSON
 */
export async function savePermissions(permissions: PermissionDefinition[]): Promise<void> {
  await writeFile(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2), 'utf-8')
}

/**
 * Trouver une permission par son nom
 */
export async function findPermissionByName(name: string): Promise<PermissionDefinition | null> {
  const permissions = await loadPermissions()
  return permissions.find(p => p.name === name) || null
}

/**
 * Ajouter une nouvelle permission
 */
export async function addPermission(permission: PermissionDefinition): Promise<void> {
  const permissions = await loadPermissions()
  
  // Vérifier si la permission existe déjà
  if (permissions.find(p => p.name === permission.name)) {
    throw new Error('Une permission avec ce nom existe déjà.')
  }
  
  permissions.push({
    ...permission,
    isActive: permission.isActive !== false
  })
  
  await savePermissions(permissions)
}

/**
 * Mettre à jour une permission
 */
export async function updatePermission(
  name: string,
  updates: Partial<Omit<PermissionDefinition, 'name'>>
): Promise<void> {
  const permissions = await loadPermissions()
  const index = permissions.findIndex(p => p.name === name)
  
  if (index === -1) {
    throw new Error('Permission non trouvée.')
  }
  
  permissions[index] = {
    ...permissions[index],
    ...updates
  }
  
  await savePermissions(permissions)
}

/**
 * Supprimer une permission (vérifier d'abord si elle est utilisée)
 */
export async function deletePermission(name: string, isUsed: boolean): Promise<void> {
  const permissions = await loadPermissions()
  const index = permissions.findIndex(p => p.name === name)
  
  if (index === -1) {
    throw new Error('Permission non trouvée.')
  }
  
  if (isUsed) {
    // Désactiver au lieu de supprimer
    permissions[index].isActive = false
  } else {
    // Supprimer définitivement
    permissions.splice(index, 1)
  }
  
  await savePermissions(permissions)
}

