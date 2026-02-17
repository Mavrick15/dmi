// openclinic/backend/app/controllers/users_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import UserProfile from '#models/UserProfile'
import Medecin from '#models/Medecin'
import db from '@adonisjs/lucid/services/db'
import { randomBytes, randomUUID } from 'crypto'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import { UserTransformer } from '../transformers/UserTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import { FileHelper } from '../utils/FileHelper.js'

export default class UsersController {
  
  // Nettoie les données : convertit les chaînes vides et "null" en vrai null
  private cleanPayload(data: Record<string, any>) {
    const cleaned: Record<string, any> = {}
    for (const key in data) {
      const value = data[key]
      if (value === '' || value === undefined || value === 'null') {
        cleaned[key] = null
      } else if (typeof value === 'string') {
        cleaned[key] = value.trim()
      } else {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  public async index({ request, response }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 10, 100)
    
    const search = request.input('search')
    const role = request.input('role')
    const status = request.input('status')

    // Validation de la recherche
    if (search) {
      const searchTrimmed = search.trim()
      if (searchTrimmed.length < 2) {
        throw AppException.badRequest('La recherche doit contenir au moins 2 caractères')
      }
      if (searchTrimmed.length > 100) {
        throw AppException.badRequest('La recherche ne peut pas dépasser 100 caractères')
      }
    }

    // Validation du rôle
    const validRoles = ['admin', 'docteur', 'infirmiere', 'gestionnaire', 'pharmacien', 'patient', 'all']
    if (role && !validRoles.includes(role)) {
      throw AppException.badRequest('Rôle invalide')
    }

    const query = UserProfile.query()
      .leftJoin('medecins', 'user_profiles.id', 'medecins.user_id')
      .leftJoin('etablissements', 'medecins.etablissement_id', 'etablissements.id')
      .leftJoin('departments', 'medecins.department_id', 'departments.id')
      .select('user_profiles.*')
      .select('etablissements.nom as nom_etablissement')
      .select('departments.id as department_id')
      .select('departments.nom as department_nom')
      .select('departments.code as department_code')
      .orderBy('user_profiles.date_creation', 'desc')

    if (search) {
      const searchTerm = search.trim()
      query.where((q) => {
        q.where('user_profiles.nom_complet', 'ilike', `%${searchTerm}%`)
         .orWhere('user_profiles.email', 'ilike', `%${searchTerm}%`)
      })
    }

    if (role && role !== 'all') {
        query.where('user_profiles.role', role)
    }

    if (status && status !== 'all') {
        const isActive = status === 'Active'
        query.where('user_profiles.actif', isActive)
    }

    const users = await query.paginate(page, limit)

    const transformedUsers = UserTransformer.transformMany(users.all(), true)
    
    // Ajouter les informations supplémentaires (department, etc.)
    const enrichedData = transformedUsers.map((user, index) => {
      const originalUser = users.all()[index]
      let departmentDisplay = 'Général'
      
      if ((originalUser as any).$extras?.nom_etablissement) {
        departmentDisplay = (originalUser as any).$extras.nom_etablissement
      } else {
        if (user.role === 'admin') departmentDisplay = 'Administration'
        if (user.role === 'pharmacien') departmentDisplay = 'Pharmacie'
        if (user.role === 'infirmiere') departmentDisplay = 'Soins Infirmiers'
      }

      return {
        ...user,
        department: departmentDisplay,
        lastLogin: originalUser.derniereConnexion ? originalUser.derniereConnexion.toRelative() : 'Jamais',
      }
    })

    return response.json(
      ApiResponse.paginated(
        enrichedData,
        users.currentPage,
        users.perPage,
        users.total
      )
    )
  }

  public async store({ request, response, auth }: HttpContext) {
    // Gestion de l'upload d'avatar (doit être fait avant request.only pour FormData)
    const avatarFile = request.file('file') || request.file('avatar')
    let avatarPath: string | null = null

    if (avatarFile && avatarFile.isValid) {
      const key = `avatars/${cuid()}.${avatarFile.extname}`
      await avatarFile.moveToDisk(key)
      avatarPath = key
    }

    // Récupérer les données (fonctionne avec JSON et FormData)
    const rawData = {
      nomComplet: request.input('nomComplet'),
      email: request.input('email'),
      password: request.input('password'),
      telephone: request.input('telephone'),
      adresse: request.input('adresse'),
      role: request.input('role'),
      actif: request.input('actif'),
      numeroOrdre: request.input('numeroOrdre'),
      etablissementId: request.input('etablissementId'),
      departmentId: request.input('departmentId')
    }

    const data = this.cleanPayload(rawData)

    if (!data.email || !data.nomComplet || !data.role) {
        throw AppException.badRequest("Le Nom, l'Email et le Rôle sont obligatoires.")
    }

    const finalPassword = data.password || randomBytes(8).toString('hex')

    try {
      const result = await db.transaction(async (trx) => {
        
        // Vérification de l'email AVANT la création
        const existingUser = await UserProfile.query({ client: trx }).where('email', data.email).first()
        if (existingUser) {
            throw AppException.duplicate('Cette adresse email')
        }

        const user = await UserProfile.create({
          email: data.email, 
          password: finalPassword, 
          nomComplet: data.nomComplet, 
          role: data.role || 'patient', 
          telephone: data.telephone, 
          adresse: data.adresse,
          actif: data.actif !== false,
          photoProfil: avatarPath,
        }, { client: trx })

        if (data.role === 'docteur') {
          const uniqueOrdre = data.numeroOrdre || `TEMP-${randomUUID().substring(0, 8).toUpperCase()}`
          
          await Medecin.create({
              userId: user.id,
              numeroOrdre: uniqueOrdre,
              specialite: data.specialite?.trim() || 'Non spécifiée', // requis NOT NULL en base
              etablissementId: data.etablissementId,
              departmentId: data.departmentId || null,
              disponible: true
          }, { client: trx }) 
        }

        return user
      })

      // Log d'audit - Création d'utilisateur
      const creator = auth.user as UserProfile
      const creatorName = creator?.nomComplet || creator?.email || 'Système'
      await AuditService.logUserCreated(
        { auth, request, response } as HttpContext,
        result.id,
        result.nomComplet,
        result.role,
        creatorName
      )

      return response.created({ 
          success: true, 
          message: 'Utilisateur créé avec succès.', 
          data: result 
      })

    } catch (error: any) {
      logger.error({ err: error }, 'Erreur lors de la création de l\'utilisateur')
      if (error.code === '23505') {
          throw error
      }
      
      throw error 
    }
  }

  public async show({ params, response }: HttpContext) {
      try { 
          const user = await UserProfile.findOrFail(params.id);
          
          // Charger les données du médecin si l'utilisateur est un docteur
          let medecinData: any = null;
          if (user.role === 'docteur') {
            const medecin = await Medecin.query()
              .where('userId', user.id)
              .preload('department')
              .first();
            
            if (medecin) {
              medecinData = {
                numeroOrdre: medecin.numeroOrdre,
                departmentId: medecin.departmentId,
                etablissementId: medecin.etablissementId,
                department: medecin.department ? {
                  id: medecin.department.id,
                  nom: medecin.department.nom
                } : null
              };
            }
          }
          
          // Utiliser le transformer pour avoir une structure cohérente
          const userData = UserTransformer.transform(user, true);
          
          // Ajouter les données du médecin si disponible
          if (medecinData) {
            userData.numeroOrdre = medecinData.numeroOrdre;
            userData.departmentId = medecinData.departmentId;
            userData.etablissementId = medecinData.etablissementId;
            if (medecinData.department) {
              userData.department = medecinData.department;
            }
          }
          
          // Construire l'URL complète de l'avatar si disponible
          if (user.photoProfil) {
            try {
              const avatarUrl = await FileHelper.getFileUrl(user.photoProfil);
              if (avatarUrl) {
                userData.avatar = avatarUrl;
                userData.photoProfil = avatarUrl;
              }
            } catch (error) {
              logger.warn({ err: error, photoProfil: user.photoProfil }, 'Erreur lors de la récupération de l\'URL de l\'avatar');
            }
          }
          
          return response.json({ success: true, data: userData }) 
      } catch (error) { 
          throw error 
      }
  }

  public async update({ params, request, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide pour l\'ID de l\'utilisateur')
      }

      // Récupérer les données (fonctionne avec JSON et FormData)
      const rawData = {
        nomComplet: request.input('nomComplet'),
        email: request.input('email'),
        password: request.input('password'),
        telephone: request.input('telephone'),
        adresse: request.input('adresse'),
      role: request.input('role'),
      actif: request.input('actif'),
      numeroOrdre: request.input('numeroOrdre'),
      etablissementId: request.input('etablissementId'),
      departmentId: request.input('departmentId')
    }
      const data = this.cleanPayload(rawData)
      
      // Pour une mise à jour partielle (ex: juste actif), on ne valide que si les champs sont présents
      // Si un champ est fourni, il doit être valide
      if (data.email !== undefined && data.email !== null && !data.email.trim()) {
          throw AppException.badRequest("L'Email ne peut pas être vide si fourni.")
      }
      if (data.nomComplet !== undefined && data.nomComplet !== null && !data.nomComplet.trim()) {
          throw AppException.badRequest("Le Nom ne peut pas être vide si fourni.")
      }
      if (data.role !== undefined && data.role !== null && !data.role.trim()) {
          throw AppException.badRequest("Le Rôle ne peut pas être vide si fourni.")
      }

      // Récupérer l'utilisateur avant modification pour capturer les anciennes valeurs
      const userBefore = await UserProfile.findOrFail(params.id)
      const oldValues = {
        nomComplet: userBefore.nomComplet,
        email: userBefore.email,
        role: userBefore.role,
        telephone: userBefore.telephone,
        adresse: userBefore.adresse,
        actif: userBefore.actif
      }

      // Gestion de l'upload d'avatar
      const avatarFile = request.file('file') || request.file('avatar')
      const avatarInput = request.input('avatar')
      const clearAvatar = avatarInput === null || avatarInput === 'null' || avatarInput === ''
      let avatarPath: string | null = undefined
      let oldAvatarPath: string | null = null

      if (avatarFile && avatarFile.isValid) {
        const key = `avatars/${cuid()}.${avatarFile.extname}`
        await avatarFile.moveToDisk(key)
        avatarPath = key
        // Sauvegarder l'ancien chemin pour suppression ultérieure
        oldAvatarPath = userBefore.photoProfil
      } else if (clearAvatar && userBefore.photoProfil) {
        // Si on veut supprimer l'avatar et qu'il y en a un
        oldAvatarPath = userBefore.photoProfil
        avatarPath = null
      }

      await db.transaction(async (trx) => {
        const user = await UserProfile.findOrFail(params.id, { client: trx })

        // 1. Vérification Doublon Email
        if (data.email && data.email !== user.email) {
            const exists = await UserProfile.query({ client: trx })
                .where('email', data.email)
                .where('id', '!=', params.id)
                .first()
            if (exists) {
                const error: any = new Error("Cette adresse email est déjà utilisée.")
                error.code = '23505'
                error.status = 409
                throw error
            }
        }

        const mergeData: any = {
            nomComplet: data.nomComplet ?? user.nomComplet,
            email: data.email ?? user.email,
            role: data.role ?? user.role,
            telephone: data.telephone ?? user.telephone,
            adresse: data.adresse ?? user.adresse,
            actif: data.actif ?? user.actif,
        }
        
        // Mettre à jour photoProfil seulement si on a un nouveau fichier ou si on veut le supprimer
        if (avatarPath !== undefined) {
          mergeData.photoProfil = avatarPath
        }
        
        user.merge(mergeData)

        if (data.password) {
          user.password = data.password
        }
        
        await user.save()

        // Supprimer l'ancien avatar après la mise à jour réussie
        if (oldAvatarPath && oldAvatarPath !== avatarPath) {
          try {
            await drive.use().delete(oldAvatarPath)
          } catch (err) {
            logger.warn({ err, path: oldAvatarPath }, 'Erreur lors de la suppression de l\'ancien avatar')
          }
        }

        // 2. Gestion de l'entité Médecin (CORRECTION APPLIQUÉE ICI)
        if (user.role === 'docteur') {
            const medecinUpdateData: any = {
                disponible: true,
                specialite: data.specialite?.trim() || 'Non spécifiée', // requis NOT NULL en base
            };

            if (data.numeroOrdre !== undefined && data.numeroOrdre !== null) {
                medecinUpdateData.numeroOrdre = data.numeroOrdre || null;
            }
            if (data.etablissementId !== undefined && data.etablissementId !== null) {
                medecinUpdateData.etablissementId = data.etablissementId;
            }
            if (data.departmentId !== undefined && data.departmentId !== null) {
                medecinUpdateData.departmentId = data.departmentId || null;
            }

            // Vérification : ne faire l'update que s'il y a quelque chose à mettre à jour
            if (Object.keys(medecinUpdateData).length > 0) {
                await Medecin.updateOrCreate(
                    { userId: user.id },
                    medecinUpdateData,
                    { client: trx }
                )
            }
        } else {
          const existingMedecin = await Medecin.query({ client: trx }).where('userId', user.id).first()
          if (existingMedecin) {
             // Si le rôle n'est plus docteur, on supprime l'enregistrement médecin
             await Medecin.query({ client: trx }).where('userId', user.id).delete()
          }
        }
      })

      // Récupérer l'utilisateur après modification pour comparer
      const userAfter = await UserProfile.findOrFail(params.id)

      // Construire l'objet des changements pour le log d'audit
      const changes: Record<string, any> = {}
      
      if (oldValues.nomComplet !== userAfter.nomComplet) {
        changes.nomComplet = { ancien: oldValues.nomComplet, nouveau: userAfter.nomComplet }
      }
      if (oldValues.email !== userAfter.email) {
        changes.email = { ancien: oldValues.email, nouveau: userAfter.email }
      }
      if (oldValues.role !== userAfter.role) {
        changes.role = { ancien: oldValues.role, nouveau: userAfter.role }
      }
      if (oldValues.telephone !== userAfter.telephone) {
        changes.telephone = { ancien: oldValues.telephone, nouveau: userAfter.telephone }
      }
      if (oldValues.adresse !== userAfter.adresse) {
        changes.adresse = { ancien: oldValues.adresse, nouveau: userAfter.adresse }
      }
      if (oldValues.actif !== userAfter.actif) {
        changes.actif = { ancien: oldValues.actif, nouveau: userAfter.actif }
      }
      if (data.password) {
        changes.password = { modifie: true } // Ne pas logger le mot de passe
      }
      
      // Ajouter les changements liés au médecin si applicable
      if (data.numeroOrdre !== undefined || data.etablissementId !== undefined || data.departmentId !== undefined) {
        changes.medecin = {}
        // specialite est déprécié - utiliser departmentId à la place
        // if (data.specialite !== undefined) changes.medecin.specialite = data.specialite
        if (data.numeroOrdre !== undefined) changes.medecin.numeroOrdre = data.numeroOrdre
        if (data.etablissementId !== undefined) changes.medecin.etablissementId = data.etablissementId
        if (data.departmentId !== undefined) changes.medecin.departmentId = data.departmentId
      }

      // Log d'audit avec détails des changements
      const updater = auth.user as UserProfile
      const updaterName = updater?.nomComplet || updater?.email || 'Système'
      
      // Log principal de modification
      await AuditService.logUserUpdated(
        { auth, request, response } as HttpContext,
        params.id,
        userAfter.nomComplet,
        changes,
        updaterName
      )
      
      // Log spécifique si changement de rôle
      if (oldValues.role !== userAfter.role) {
        await AuditService.logRoleChanged(
          { auth, request, response } as HttpContext,
          params.id,
          userAfter.nomComplet,
          oldValues.role,
          userAfter.role,
          updaterName
        )
      }
      
      // Log spécifique si activation/désactivation
      if (oldValues.actif !== userAfter.actif) {
        if (userAfter.actif) {
          await AuditService.logUserActivated(
            { auth, request, response } as HttpContext,
            params.id,
            userAfter.nomComplet,
            updaterName
          )
        } else {
          await AuditService.logUserDeactivated(
            { auth, request, response } as HttpContext,
            params.id,
            userAfter.nomComplet,
            updaterName,
            'Désactivation par un administrateur'
          )
        }
      }
      
      // Log spécifique si changement de mot de passe
      if (data.password) {
        await AuditService.logPasswordChanged(
          { auth, request, response } as HttpContext,
          params.id,
          userAfter.nomComplet,
          updaterName,
          params.id !== updater?.id // isReset si modifié par quelqu'un d'autre
        )
      }

      return response.json({ success: true, message: 'Utilisateur mis à jour' })

    } catch (error: any) {
        throw error
    }
  }

  public async destroy({ params, response, auth }: HttpContext) {
    try {
      let userName = 'Utilisateur inconnu'
      let userRole = 'patient'
      await db.transaction(async (trx) => {
        const user = await UserProfile.findOrFail(params.id, { client: trx })
        userName = user.nomComplet
        userRole = user.role
        // Suppression en cascade appliquée par la DB (ou Lucid si configuré)
        await user.delete() 
      })

      // Log d'audit - Suppression d'utilisateur
      const deleter = auth.user as UserProfile
      const deleterName = deleter?.nomComplet || deleter?.email || 'Système'
      await AuditService.logUserDeleted(
        { auth, request: {} as any, response } as HttpContext,
        params.id,
        userName,
        userRole,
        deleterName,
        'Suppression par un administrateur'
      )

      return response.json({ success: true, message: 'Utilisateur supprimé' })
    } catch (error) {
      throw error 
    }
  }

  // Accorder une permission à un utilisateur
  public async grantPermission({ params, request, response, auth }: HttpContext) {
    try {
      const { permission } = request.only(['permission'])
      
      if (!permission) {
        throw AppException.badRequest('La permission est requise.')
      }

      const user = await UserProfile.findOrFail(params.id)
      const userName = user.nomComplet
      
      // Log d'audit - Permission accordée
      const grantor = auth.user as UserProfile
      const grantorName = grantor?.nomComplet || grantor?.email || 'Système'
      
      await AuditService.logPermissionGranted(
        { auth, request, response } as HttpContext,
        params.id,
        userName,
        permission,
        grantorName
      )

      return response.json({ success: true, message: 'Permission accordée' })
    } catch (error) {
      throw error
    }
  }

  // Révoquer une permission d'un utilisateur
  public async revokePermission({ params, request, response, auth }: HttpContext) {
    try {
      const { permission } = request.only(['permission'])
      
      if (!permission) {
        throw AppException.badRequest('La permission est requise.')
      }

      const user = await UserProfile.findOrFail(params.id)
      const userName = user.nomComplet
      
      // Log d'audit - Permission révoquée
      const revoker = auth.user as UserProfile
      const revokerName = revoker?.nomComplet || revoker?.email || 'Système'
      
      await AuditService.logPermissionRevoked(
        { auth, request, response } as HttpContext,
        params.id,
        userName,
        permission,
        revokerName
      )

      return response.json({ success: true, message: 'Permission révoquée' })
    } catch (error) {
      throw error
    }
  }

  // Expirer la session d'un utilisateur
  public async expireSession({ params, request, response, auth }: HttpContext) {
    try {
      const { reason } = request.only(['reason'])
      
      const user = await UserProfile.findOrFail(params.id)
      const userName = user.nomComplet
      
      // Log d'audit - Session expirée
      await AuditService.logSessionExpired(
        { auth, request, response } as HttpContext,
        params.id,
        userName,
        reason || 'Session expirée manuellement'
      )

      return response.json({ success: true, message: 'Session expirée' })
    } catch (error) {
      throw error
    }
  }

  // Mettre à jour la liste blanche IP
  public async updateIpWhitelist({ request, response, auth }: HttpContext) {
    try {
      const { ipAddress, action } = request.only(['ipAddress', 'action'])
      
      if (!ipAddress || !action) {
        throw AppException.badRequest('L\'adresse IP et l\'action sont requises.')
      }

      if (action !== 'add' && action !== 'remove') {
        throw AppException.badRequest('L\'action doit être "add" ou "remove".')
      }

      const user = auth.user as UserProfile
      const userName = user?.nomComplet || user?.email || 'Système'
      
      // Log d'audit - Liste blanche IP mise à jour
      await AuditService.logIpWhitelistUpdated(
        { auth, request, response } as HttpContext,
        ipAddress,
        action as 'add' | 'remove',
        userName
      )

      return response.json({ 
        success: true, 
        message: `Adresse IP ${action === 'add' ? 'ajoutée à' : 'retirée de'} la liste blanche` 
      })
    } catch (error) {
      throw error
    }
  }
}