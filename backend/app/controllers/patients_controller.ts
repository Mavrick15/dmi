import Consultation from '#models/Consultation'
import Medecin from '#models/Medecin'
import Patient from '#models/Patient'
import RendezVous from '#models/RendezVous'
import UserProfile from '#models/UserProfile'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
// Import des validateurs
import AuditService from '#services/AuditService'
import CacheService from '#services/CacheService'
import NotificationService from '#services/NotificationService'
import { createPatientValidator, updatePatientValidator } from '#validators/patient'
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import { AppException } from '../exceptions/AppException.js'
import { PatientTransformer } from '../transformers/PatientTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { PaginationHelper } from '../utils/PaginationHelper.js'

export default class PatientsController {
  /**
   * Génère un numéro de patient au format "PAT-yymjsec"
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * sec: secondes de la minute (3 chiffres, 000-059)
   */
  private generatePatientNumber(): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2) // 2 derniers chiffres de l'année
    const month = now.month
    const day = now.day
    const seconds = now.second

    // Conversion du mois : 1-9 pour janvier-septembre, A-C pour octobre-décembre
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9) // A=10, B=11, C=12

    // Conversion du jour : 1-9 pour 1-9, A-V pour 10-31
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9) // A=10, B=11, ..., V=31

    // Secondes avec padding à 3 chiffres
    const secStr = seconds.toString().padStart(3, '0')

    return `PAT-${year}${monthChar}${dayChar}${secStr}`
  }

  // --- UTILITAIRE DE FORMATAGE (déprécié - utiliser PatientTransformer) ---
  private serializePatient(p: Patient, detailed = false) {
    let age = null
    if (p.dateNaissance) {
      age = Math.floor(Math.abs(p.dateNaissance.diffNow('years').years))
    }

    let genderDisplay = 'Non spécifié'
    if (p.sexe === 'masculin') genderDisplay = 'Homme'
    if (p.sexe === 'feminin') genderDisplay = 'Femme'
    if (p.sexe === 'autre') genderDisplay = 'Autre'

    const birthDate = p.dateNaissance ? p.dateNaissance.toFormat('dd/MM/yyyy') : 'N/A'
    const lastVisit = p.updatedAt ? p.updatedAt.toFormat('dd/MM/yyyy') : 'Jamais'

    const allergies = p.allergies
      ? Array.isArray(p.allergies)
        ? p.allergies
        : Object.values(p.allergies)
      : []
    const medicalHistory = p.antecedentsMedicaux || 'Aucun antécédent noté'

    const baseData = {
      id: p.id,
      userId: p.userId,
      name: p.user ? p.user.nomComplet : 'Dossier Incomplet',
      email: p.user?.email || 'Non renseigné',
      phone: p.user?.telephone || p.contactUrgenceTelephone || 'Non renseigné',
      address: p.user?.adresse || 'Non renseignée',
      avatar: p.user?.photoProfil || null,
      age: age,
      birthDate: birthDate,
      gender: genderDisplay,
      bloodType: p.groupeSanguin || 'N/A',
      insurance: p.assuranceMaladie || 'Aucune',
      insuranceNumber: p.numeroAssurance || '',
      medicalHistory: medicalHistory,
      allergies: allergies,
      status: p.user?.actif ? 'Active' : 'Inactive',
      lastVisit: lastVisit,
      numeroPatient: p.numeroPatient,
      // Champs bruts pour édition
      contactUrgenceNom: p.contactUrgenceNom,
      contactUrgenceTelephone: p.contactUrgenceTelephone,
    }

    if (detailed) {
      const rendezVous = Array.isArray(p.$preloaded.rendezVous) ? p.$preloaded.rendezVous : []
      const consultations = Array.isArray(p.$preloaded.consultations)
        ? p.$preloaded.consultations
        : []
      const documents = Array.isArray(p.$preloaded.documents) ? p.$preloaded.documents : []

      return {
        ...baseData,
        appointments: rendezVous.map((r: any) => ({
          date: r.dateHeure.toISODate(),
          time: r.dateHeure.toFormat('HH:mm'),
          type: r.motif || r.statut,
          status: r.statut,
        })),
        consultations: consultations.map((c: any) => ({
          id: c.id,
          date: c.dateConsultation.toISODate(),
          diagnostic: c.diagnosticPrincipal,
          notes: c.examenPhysique,
        })),
        documents: documents.map((d: any) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          createdAt: d.createdAt.toISODate(),
          mimeType: d.mimeType,
          size: d.size,
        })),
      }
    }

    return baseData
  }

  // --- STATISTIQUES --- (cache Redis 1 min, requêtes répétitives)
  public async stats({ response }: HttpContext) {
    const cacheKey = 'patients:stats'
    const cached = await CacheService.getAsync(cacheKey)
    if (cached) {
      return response.json({ success: true, data: cached })
    }

    const today = DateTime.now().toSQLDate()
    const startOfMonth = DateTime.now().startOf('month').toSQLDate()

    const [total, active, newPatients, rdvToday, critical] = await Promise.all([
      UserProfile.query().where('role', 'patient').count('* as total'),
      UserProfile.query().where('role', 'patient').where('actif', true).count('* as total'),
      Patient.query().where('created_at', '>=', startOfMonth).count('* as total'),
      RendezVous.query().whereRaw('DATE(date_heure) = ?', [today]).count('* as total'),
      RendezVous.query()
        .where('priorite', 'urgente')
        .andWhereIn('statut', ['programme', 'en_cours'])
        .count('* as total'),
    ])

    const data = {
      totalPatients: Number(total[0].$extras.total),
      activePatients: Number(active[0].$extras.total),
      newPatients: Number(newPatients[0].$extras.total),
      todayAppointments: Number(rdvToday[0].$extras.total),
      criticalPatients: Number(critical[0].$extras.total),
      unreadMessages: 0,
    }
    await CacheService.setAsync(cacheKey, data, 60)
    return response.json({ success: true, data })
  }

  // --- 1. LISTER ---
  public async index({ request, response, auth }: HttpContext) {
    const { page, limit } = PaginationHelper.fromRequest(request, 12, 50)
    const search = request.input('search')
    const establishmentId = request.input('establishmentId')

    // Récupérer l'utilisateur authentifié
    const user = auth.user as UserProfile
    if (!user) {
      throw AppException.unauthorized('Non authentifié')
    }

    // Déterminer si l'utilisateur est admin ou gestionnaire (voient tous les patients)
    const isAdmin = user.role === 'admin'
    const isGestionnaire = user.role === 'gestionnaire'
    const isInfirmiere = user.role === 'infirmiere'
    const isPharmacien = user.role === 'pharmacien'

    // Si admin, gestionnaire, infirmière ou pharmacien : voir tous les patients
    const canSeeAllPatients = isAdmin || isGestionnaire || isInfirmiere || isPharmacien

    const query = Patient.query().preload('user').orderBy('createdAt', 'desc')

    // Si c'est un docteur, filtrer pour ne voir que ses patients
    if (!canSeeAllPatients && user.role === 'docteur') {
      // Récupérer le profil médecin associé
      const medecin = await Medecin.findBy('userId', user.id)

      if (medecin) {
        // Récupérer les IDs des patients qui ont :
        // 1. Des consultations avec ce médecin
        // 2. OU des rendez-vous avec ce médecin
        const consultations = await Consultation.query()
          .where('medecinId', medecin.id)
          .select('patientId')
          .exec()

        const rendezVous = await RendezVous.query()
          .where('medecinId', medecin.id)
          .select('patientId')
          .exec()

        // Combiner les IDs uniques
        const patientIds = new Set([
          ...consultations.map((c) => c.patientId),
          ...rendezVous.map((r) => r.patientId),
        ])

        // Si aucun patient trouvé, retourner une liste vide
        if (patientIds.size === 0) {
          return response.json({
            success: true,
            meta: {
              total: 0,
              per_page: limit,
              current_page: page,
              last_page: 1,
              first_page: 1,
              first_page_url: '',
              last_page_url: '',
              next_page_url: null,
              previous_page_url: null,
            },
            data: [],
          })
        }

        // Filtrer les patients par leurs IDs
        query.whereIn('id', Array.from(patientIds))
      } else {
        // Si le docteur n'a pas de profil Medecin, retourner une liste vide
        logger.warn(
          { userId: user.id, role: user.role },
          'Docteur sans profil Medecin associé - aucun patient retourné'
        )
        return response.json({
          success: true,
          meta: {
            total: 0,
            per_page: limit,
            current_page: page,
            last_page: 1,
            first_page: 1,
            first_page_url: '',
            last_page_url: '',
            next_page_url: null,
            previous_page_url: null,
          },
          data: [],
        })
      }
    }

    // Filtre par établissement : patients ayant au moins un RDV ou une consultation avec un médecin de cet établissement
    if (establishmentId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(establishmentId)) {
        throw AppException.badRequest('Format UUID invalide pour establishmentId')
      }
      query.where((q) => {
        q.whereHas('rendezVous', (rv) =>
          rv.whereHas('medecin', (m) => m.where('etablissementId', establishmentId))
        ).orWhereHas('consultations', (c) =>
          c.whereHas('medecin', (m) => m.where('etablissementId', establishmentId))
        )
      })
    }

    if (search) {
      query.where((q) => {
        q.where('numeroPatient', 'ilike', `%${search}%`)
          .orWhere('numeroAssurance', 'ilike', `%${search}%`)
          .orWhereHas('user', (userQuery) => {
            userQuery
              .where('nomComplet', 'ilike', `%${search}%`)
              .orWhere('email', 'ilike', `%${search}%`)
              .orWhere('telephone', 'ilike', `%${search}%`)
          })
      })
    }

    const patients = await query.paginate(page, limit)
    const formattedData = PatientTransformer.transformMany(patients.all(), false)
    const meta = patients.getMeta()

    return response.json(
      ApiResponse.paginated(
        formattedData,
        meta.currentPage || page,
        meta.perPage || limit,
        meta.total || 0
      )
    )
  }

  // --- 2. CRÉER ---
  public async store({ request, response, auth }: HttpContext) {
    // Gestion de l'upload d'avatar (doit être fait avant la validation pour FormData)
    const avatarFile = request.file('file') || request.file('avatar')
    let avatarPath: string | null = null

    if (avatarFile && avatarFile.isValid) {
      const key = `avatars/${cuid()}.${avatarFile.extname}`
      await avatarFile.moveToDisk(key)
      avatarPath = key
    }

    // 1. VALIDATION VINEJS
    const payload = await request.validateUsing(createPatientValidator)

    const trx = await db.transaction()

    try {
      // 2. Vérification Doublon EMAIL (si fourni)
      // On le fait ici manuellement car Vine 'unique' est complexe avec l'optionnel
      if (payload.email) {
        const existingUser = await UserProfile.query({ client: trx })
          .where('email', payload.email)
          .first()
        if (existingUser) {
          const error: any = new Error('Cette adresse email est déjà utilisée.')
          error.code = 'E_USER_EXISTS'
          error.status = 409
          throw error
        }
      }

      // 3. Création User Profile
      // Si pas d'email fourni (cas fréquent pour patient), on génère un email technique unique
      const emailToUse =
        payload.email || `patient-${Date.now()}-${Math.floor(Math.random() * 1000)}@system.local`

      const user = await UserProfile.create(
        {
          email: emailToUse,
          password: 'Patient123!', // Mot de passe par défaut (à changer par l'user)
          nomComplet: payload.nomComplet,
          telephone: payload.telephone || null,
          adresse: payload.adresse || null,
          role: 'patient',
          actif: true,
          photoProfil: avatarPath,
        },
        { client: trx }
      )

      // Génération du numéro de patient au format "yymjsec" avec vérification d'unicité
      let numeroPatient = this.generatePatientNumber()
      let attempts = 0
      const maxAttempts = 10

      // Vérifier l'unicité du numéro (éviter les collisions si plusieurs patients créés dans la même seconde)
      while (attempts < maxAttempts) {
        const existing = await Patient.query({ client: trx })
          .where('numeroPatient', numeroPatient)
          .first()
        if (!existing) {
          break // Numéro unique trouvé
        }
        // Attendre quelques millisecondes et régénérer
        await new Promise((resolve) => setTimeout(resolve, 100))
        numeroPatient = this.generatePatientNumber()
        attempts++
      }

      if (attempts >= maxAttempts) {
        // En cas d'échec, ajouter un suffixe aléatoire tout en gardant le format PAT-
        const baseNumber = this.generatePatientNumber()
        numeroPatient = `${baseNumber}${Math.floor(Math.random() * 10)}`
      }

      // 4. Création Patient
      const patient = await Patient.create(
        {
          userId: user.id,
          numeroPatient: numeroPatient,
          // Conversion Date JS (Vine) -> DateTime (Luxon)
          dateNaissance: payload.dateNaissance ? DateTime.fromJSDate(payload.dateNaissance) : null,
          sexe: payload.sexe as any,
          assuranceMaladie: payload.assuranceMaladie || null,
          numeroAssurance: payload.numeroAssurance || null,
          contactUrgenceNom: payload.contactUrgenceNom || null,
          contactUrgenceTelephone: payload.contactUrgenceTelephone || null,
          contactUrgenceRelation: (payload as any).contactUrgenceRelation || null,
          antecedentsMedicaux: payload.antecedentsMedicaux || null,
          groupeSanguin: payload.groupeSanguin || null,
          allergies: payload.allergies || null,
          // Nouveaux champs
          lieuNaissance: (payload as any).lieuNaissance || null,
          ville: (payload as any).ville || null,
          codePostal: (payload as any).codePostal || null,
          pays: (payload as any).pays || 'France',
          profession: (payload as any).profession || null,
          situationFamiliale: (payload as any).situationFamiliale || null,
          langue: (payload as any).langue || 'li',
          medicamentsActuels: (payload as any).medicamentsActuels || null,
          antecedentsFamiliaux: (payload as any).antecedentsFamiliaux || null,
          vaccinations: (payload as any).vaccinations || null,
          handicaps: (payload as any).handicaps || null,
          donneurOrganes: (payload as any).donneurOrganes || false,
        },
        { client: trx }
      )

      await trx.commit()
      await patient.load('user')

      // Créer une notification pour les admins et gestionnaires
      const currentUser = auth.user as UserProfile
      if (currentUser) {
        await NotificationService.notifyNewPatient(
          patient.id,
          patient.user?.nomComplet || 'Nouveau patient',
          currentUser.id
        )
      }

      // Log d'audit RGPD - Création de patient
      await AuditService.logPatientCreated(
        { auth, request, response } as HttpContext,
        patient.id,
        patient.user?.nomComplet || 'Nouveau patient',
        patient.numeroPatient
      )

      // Log d'audit pour upload de photo si présente
      if (avatarPath) {
        await AuditService.logPatientPhotoUploaded(
          { auth, request, response } as HttpContext,
          patient.id,
          patient.user?.nomComplet || 'Nouveau patient',
          patient.numeroPatient,
          avatarFile?.size
        )
      }

      // Invalider le cache dashboard (mémoire + Redis) pour afficher le nouveau patient dans "Patients récents"
      await CacheService.deleteByPrefixAsync('dashboard:data:')
      await CacheService.deleteAsync('patients:stats')
      await CacheService.deleteAsync('stats:overview')
      await CacheService.deleteAsync('admin:stats:overview')

      return response.created(
        ApiResponse.success(
          PatientTransformer.transform(patient, false),
          'Dossier créé avec succès'
        )
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // --- 3. METTRE À JOUR ---
  public async update({ params, request, response, auth }: HttpContext) {
    // Gestion de l'upload d'avatar (doit être fait avant la validation pour FormData)
    const avatarFile = request.file('file') || request.file('avatar')
    const avatarInput = request.input('avatar')
    const clearAvatar = avatarInput === null || avatarInput === 'null' || avatarInput === ''
    let avatarPath: string | null | undefined
    let oldAvatarPath: string | null = null

    // Charger le patient pour récupérer l'ancien avatar si nécessaire
    const patientBefore = await Patient.query().where('id', params.id).preload('user').firstOrFail()
    const userBefore = patientBefore.user

    if (avatarFile && avatarFile.isValid) {
      const key = `avatars/${cuid()}.${avatarFile.extname}`
      await avatarFile.moveToDisk(key)
      avatarPath = key
      // Sauvegarder l'ancien chemin pour suppression ultérieure
      oldAvatarPath = userBefore?.photoProfil || null
    } else if (clearAvatar && userBefore?.photoProfil) {
      // Si on veut supprimer l'avatar et qu'il y en a un
      oldAvatarPath = userBefore.photoProfil
      avatarPath = null
    }

    // 1. VALIDATION VINEJS
    const payload = await request.validateUsing(updatePatientValidator)

    const trx = await db.transaction()

    try {
      // Optimisation : Précharger la relation 'user' pour éviter une requête supplémentaire
      const patient = await Patient.query({ client: trx })
        .where('id', params.id)
        .preload('user')
        .firstOrFail()
      const user = patient.user

      // 2. Vérification Email si modifié
      if (payload.email && payload.email !== user.email) {
        const exists = await UserProfile.query({ client: trx })
          .where('email', payload.email)
          .where('id', '!=', user.id)
          .first()

        if (exists) {
          const error: any = new Error('Cette adresse email est déjà utilisée.')
          error.code = 'E_USER_EXISTS'
          error.status = 409
          throw error
        }
      }

      // 3. Mise à jour UserProfile
      user.useTransaction(trx)
      user.merge({
        email: payload.email ?? user.email,
        nomComplet: payload.nomComplet ?? user.nomComplet,
        telephone: payload.telephone ?? user.telephone,
        adresse: payload.adresse ?? user.adresse,
        photoProfil: avatarPath !== undefined ? avatarPath : user.photoProfil,
      })
      await user.save()

      // Supprimer l'ancien avatar après la mise à jour réussie
      if (oldAvatarPath && oldAvatarPath !== avatarPath) {
        try {
          await drive.use().delete(oldAvatarPath)
        } catch (err) {
          logger.warn(
            { err, path: oldAvatarPath },
            "Erreur lors de la suppression de l'ancien avatar"
          )
        }
      }

      // 4. Mise à jour Patient
      // L'opérateur ?? garde la valeur actuelle si la nouvelle est undefined (non envoyée)
      patient.merge({
        dateNaissance: payload.dateNaissance
          ? DateTime.fromJSDate(payload.dateNaissance)
          : patient.dateNaissance,
        sexe: (payload.sexe as any) ?? patient.sexe,
        assuranceMaladie: payload.assuranceMaladie ?? patient.assuranceMaladie,
        numeroAssurance: payload.numeroAssurance ?? patient.numeroAssurance,
        contactUrgenceNom: payload.contactUrgenceNom ?? patient.contactUrgenceNom,
        contactUrgenceTelephone: payload.contactUrgenceTelephone ?? patient.contactUrgenceTelephone,
        contactUrgenceRelation:
          (payload as any).contactUrgenceRelation ?? patient.contactUrgenceRelation,
        groupeSanguin: payload.groupeSanguin ?? patient.groupeSanguin,
        allergies: payload.allergies !== undefined ? payload.allergies : patient.allergies,
        antecedentsMedicaux: payload.antecedentsMedicaux ?? patient.antecedentsMedicaux,
        // Nouveaux champs
        lieuNaissance: (payload as any).lieuNaissance ?? patient.lieuNaissance,
        ville: (payload as any).ville ?? patient.ville,
        codePostal: (payload as any).codePostal ?? patient.codePostal,
        pays: (payload as any).pays ?? patient.pays,
        profession: (payload as any).profession ?? patient.profession,
        situationFamiliale: (payload as any).situationFamiliale ?? patient.situationFamiliale,
        langue: (payload as any).langue ?? patient.langue,
        medicamentsActuels: (payload as any).medicamentsActuels ?? patient.medicamentsActuels,
        antecedentsFamiliaux: (payload as any).antecedentsFamiliaux ?? patient.antecedentsFamiliaux,
        vaccinations: (payload as any).vaccinations ?? patient.vaccinations,
        handicaps: (payload as any).handicaps ?? patient.handicaps,
        donneurOrganes: (payload as any).donneurOrganes ?? patient.donneurOrganes,
      })
      await patient.save()

      await trx.commit()
      await patient.load('user')

      // Supprimer l'ancien avatar après la mise à jour réussie
      if (oldAvatarPath && oldAvatarPath !== avatarPath) {
        try {
          await drive.use().delete(oldAvatarPath)
        } catch (err) {
          logger.warn(
            { err, path: oldAvatarPath },
            "Erreur lors de la suppression de l'ancien avatar"
          )
        }
      }

      // Log d'audit RGPD - Modification de patient
      await AuditService.logPatientUpdated(
        { auth, request, response } as HttpContext,
        params.id,
        patient.user?.nomComplet || patient.numeroPatient,
        patient.numeroPatient,
        payload
      )

      // Log d'audit pour upload de photo si nouvelle photo
      if (avatarFile && avatarFile.isValid) {
        await AuditService.logPatientPhotoUploaded(
          { auth, request, response } as HttpContext,
          params.id,
          patient.user?.nomComplet || patient.numeroPatient,
          patient.numeroPatient,
          avatarFile.size
        )
      }

      return response.json(
        ApiResponse.success(
          PatientTransformer.transform(patient, false),
          'Dossier mis à jour avec succès'
        )
      )
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  // --- 4. DÉTAILS ---
  public async show({ params, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest("Format UUID invalide pour l'ID du patient")
      }

      const patient = await Patient.query()
        .where('id', params.id)
        .preload('user')
        .preload('rendezVous', (q) => q.orderBy('dateHeure', 'desc').limit(5))
        .preload('consultations', (q) => q.orderBy('dateConsultation', 'desc').limit(10))
        .preload('documents', (q) => q.orderBy('createdAt', 'desc').limit(5))
        .firstOrFail()

      // Log d'audit RGPD - Consultation de dossier patient
      await AuditService.logPatientViewed(
        { auth, request: {} as any, response } as HttpContext,
        patient.id,
        patient.user?.nomComplet || patient.numeroPatient,
        patient.numeroPatient,
        'Consultation détails patient'
      )

      return response.json(ApiResponse.success(PatientTransformer.transform(patient, true)))
    } catch (error: any) {
      logger.error(
        { err: error, patientId: params.id },
        'Erreur lors de la récupération des détails du patient'
      )
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Patient')
      }
      throw AppException.internal('Erreur lors du chargement des détails du patient.')
    }
  }

  // --- 5. SUPPRIMER ---
  public async destroy({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const patient = await Patient.query({ client: trx }).where('id', params.id).firstOrFail()
      await patient.load('user', (query) => {
        query.useTransaction(trx)
      })
      const user = await UserProfile.findOrFail(patient.userId, { client: trx })

      const patientName = patient.user?.nomComplet || patient.numeroPatient

      // Suppression de l'utilisateur (Cascade SQL vers Patient)
      await user.delete()

      await trx.commit()

      // Log d'audit RGPD - Suppression de patient (Droit à l'oubli)
      await AuditService.logPatientDeleted(
        { auth, request: {} as any, response } as HttpContext,
        params.id,
        patientName,
        patient.numeroPatient,
        'Suppression demandée par utilisateur autorisé'
      )

      return response.json(ApiResponse.success(null, 'Dossier supprimé'))
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
