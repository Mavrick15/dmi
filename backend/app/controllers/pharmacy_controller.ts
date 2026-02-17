// openclinic/backend/app/controllers/pharmacy_controller.ts

import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Medicament from '#models/Medicament'
import CommandeFournisseur from '#models/CommandeFournisseur'
import LigneCommandeFournisseur from '#models/LigneCommandeFournisseur'
import InventaireMouvement from '#models/InventaireMouvement'
import Fournisseur from '#models/Fournisseur'
import UserProfile from '#models/UserProfile'
import transmit from '@adonisjs/transmit/services/main'
import NotificationService from '#services/NotificationService'
import AuditService from '#services/AuditService'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { PharmacyTransformer } from '../transformers/PharmacyTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
export default class PharmacyController {
  
  /**
   * Génère un numéro de commande au format "CMD-yymjXXX"
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * XXX: nombre aléatoire (3 chiffres, 000-999)
   */
  private generateOrderNumber(): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2) // 2 derniers chiffres de l'année
    const month = now.month
    const day = now.day
    
    // Conversion du mois : 1-9 pour janvier-septembre, A-C pour octobre-décembre
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9) // A=10, B=11, C=12
    
    // Conversion du jour : 1-9 pour 1-9, A-V pour 10-31
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9) // A=10, B=11, ..., V=31
    
    // Nombre aléatoire sur 3 chiffres
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `CMD-${year}${monthChar}${dayChar}${randomNum}`
  }
  
  /**
   * Génère un numéro de lot au format "LOT-yymjXXX"
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * XXX: nombre aléatoire (3 chiffres, 000-999)
   */
  private generateLotNumber(): string {
    const now = DateTime.now()
    const year = now.year.toString().slice(-2) // 2 derniers chiffres de l'année
    const month = now.month
    const day = now.day
    
    // Conversion du mois : 1-9 pour janvier-septembre, A-C pour octobre-décembre
    const monthChar = month <= 9 ? month.toString() : String.fromCharCode(64 + month - 9) // A=10, B=11, C=12
    
    // Conversion du jour : 1-9 pour 1-9, A-V pour 10-31
    const dayChar = day <= 9 ? day.toString() : String.fromCharCode(64 + day - 9) // A=10, B=11, ..., V=31
    
    // Nombre aléatoire sur 3 chiffres
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `LOT-${year}${monthChar}${dayChar}${randomNum}`
  }
  
  // ----------------------------------------------------------------------
  // 1. GESTION DE L'INVENTAIRE (CRUD & LISTING)
  // ----------------------------------------------------------------------

  /**
   * Lister l'inventaire avec pagination, filtres et tri
   */
  public async inventory({ request, response }: HttpContext) {
    try {
      const { page, limit } = PaginationHelper.fromRequest(request, 10, 100)
      const search = request.input('search')
      const category = request.input('category')
      const sort = request.input('sort', 'name')

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

    const query = Medicament.query()

    if (search) {
      const searchTerm = search.trim()
      query.where((q) => {
        q.where('nom', 'ilike', `%${searchTerm}%`)
         .orWhere('codeBarre', 'ilike', `%${searchTerm}%`)
         .orWhere('principeActif', 'ilike', `%${searchTerm}%`)
      })
    }

    if (category && category !== 'all') {
        query.where('forme', category)
    }

    // Gestion du tri avec validation pour éviter les injections SQL
    const validSortFields = ['stockActuel', 'dateExpiration', 'nom', 'prix_unitaire', 'created_at']
    const sortField = validSortFields.includes(sort) ? sort : 'nom'
    const sortDirection = request.input('sortDirection', 'asc')
    const validDirections = ['asc', 'desc']
    const direction = validDirections.includes(sortDirection.toLowerCase()) ? sortDirection.toLowerCase() : 'asc'
    
    if (sortField === 'stockActuel') query.orderBy('stock_actuel', direction as 'asc' | 'desc')
    else if (sortField === 'dateExpiration') query.orderBy('date_expiration', direction as 'asc' | 'desc')
    else query.orderBy('nom', direction as 'asc' | 'desc')

    const inventory = await query.paginate(page, limit)

    const transformedData = PharmacyTransformer.transformMedications(inventory.all())

      return response.json(
        ApiResponse.paginated(
          transformedData,
          inventory.currentPage,
          inventory.perPage,
          inventory.total
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération de l\'inventaire')
      throw AppException.internal('Erreur lors du chargement de l\'inventaire.')
    }
  }

  /**
   * Détails d'un médicament + historique des mouvements
   */
  public async details({ params, response }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        return response.badRequest({
          success: false,
          message: 'Format UUID invalide pour l\'ID du médicament'
        })
      }

      const medicament = await Medicament.findOrFail(params.id)
  
      const movements = await InventaireMouvement.query()
        .where('medicamentId', medicament.id)
        .preload('utilisateur', (q) => q.select('nomComplet'))
        .orderBy('createdAt', 'desc')
        .limit(10)
  
      return response.json({
        success: true,
        data: {
          medicament: medicament,
          movements: movements.map(m => ({
            date: m.createdAt.toFormat('dd/MM/yy HH:mm'),
            type: m.typeMouvement,
            quantity: m.typeMouvement === 'sortie' ? -m.quantite : m.quantite,
            unitPrice: m.prixUnitaire,
            reason: m.raison,
            user: m.utilisateur?.nomComplet || 'Système',
          })),
        }
      })
    } catch (error) {
       throw error
    }
  }

  /**
   * Créer un médicament
   * @route POST /api/v1/pharmacy/medications
   * @access Admin, Pharmacien
   */
  public async store({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(
      (await import('#validators/pharmacy')).createMedicamentValidator
    )

    try {
      const stockActuel = data.stockActuel || 0
      const stockMinimum = data.stockMinimum || 10
      
      const medicament = await Medicament.create({
        nom: data.nom,
        principeActif: data.principeActif || null,
        dosage: data.dosage || null,
        forme: data.forme || null,
        fabricant: data.fabricant || null,
        codeBarre: data.codeBarre || null,
        prixUnitaire: data.prixUnitaire || 0,
        stockActuel: stockActuel,
        stockMinimum: stockMinimum,
        statutStock: stockActuel > stockMinimum ? 'en_stock' : (stockActuel <= 0 ? 'rupture_stock' : 'stock_faible'),
        dateExpiration: data.dateExpiration ? DateTime.fromJSDate(data.dateExpiration) : null,
        prescriptionRequise: data.prescriptionRequise || false
      })

      // Notification SSE
      await transmit.broadcast('pharmacy_channel', {
          message: `Nouveau médicament ajouté : ${medicament.nom}`,
          type: 'inventory_update'
      })

      // Log d'audit - Création de médicament
      await AuditService.logMedicamentCreated(
        { auth, request, response } as HttpContext,
        medicament.id,
        medicament.nom,
        data.codeBarre
      )

      const transformedMedicament = PharmacyTransformer.transformMedication(medicament, true)

      return response.status(201).json(
        ApiResponse.created(
          transformedMedicament,
          'Médicament ajouté avec succès.'
        )
      )
    } catch (error) {
      logger.error({ err: error, payload: data }, 'Erreur lors de la création du médicament')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la création du médicament.')
    }
  }

  /**
   * Mettre à jour un médicament
   * @route PUT /api/v1/pharmacy/medications/:id
   * @access Admin, Pharmacien
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        return response.badRequest({
          success: false,
          message: 'Format UUID invalide pour l\'ID du médicament'
        })
      }

      const medicament = await Medicament.findOrFail(params.id)

      const data = await request.validateUsing(
        (await import('#validators/pharmacy')).updateMedicamentValidator
      )
      const stockActuel = data.stockActuel ?? medicament.stockActuel
      const stockMinimum = data.stockMinimum ?? medicament.stockMinimum

      medicament.merge({
        nom: data.nom ?? medicament.nom,
        principeActif: data.principeActif ?? medicament.principeActif,
        dosage: data.dosage ?? medicament.dosage,
        forme: data.forme ?? medicament.forme,
        fabricant: data.fabricant ?? medicament.fabricant,
        codeBarre: data.codeBarre ?? medicament.codeBarre,
        prixUnitaire: data.prixUnitaire ?? medicament.prixUnitaire,
        stockActuel: stockActuel,
        stockMinimum: stockMinimum,
        statutStock: stockActuel > stockMinimum ? 'en_stock' : (stockActuel <= 0 ? 'rupture_stock' : 'stock_faible'),
        dateExpiration: data.dateExpiration ? DateTime.fromJSDate(data.dateExpiration) : medicament.dateExpiration,
        prescriptionRequise: data.prescriptionRequise ?? medicament.prescriptionRequise
      })

      const oldData = {
        nom: medicament.nom,
        stockActuel: medicament.stockActuel,
        prixUnitaire: medicament.prixUnitaire
      }

      await medicament.save()

      await transmit.broadcast('pharmacy_channel', {
          message: `Médicament mis à jour : ${medicament.nom}`,
          type: 'inventory_update'
      })

      // Log d'audit - Modification de médicament
      await AuditService.logMedicamentUpdated(
        { auth, request, response } as HttpContext,
        params.id,
        medicament.nom,
        data
      )

      return response.ok({ success: true, message: 'Médicament mis à jour.' })
    } catch (error) {
      logger.error({ err: error, medicamentId: params.id }, 'Erreur lors de la mise à jour du médicament')
      throw error 
    }
  }

  /**
   * Supprimer un médicament
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        return response.badRequest({
          success: false,
          message: 'Format UUID invalide pour l\'ID du médicament'
        })
      }

      const medicament = await Medicament.findOrFail(params.id)
      const name = medicament.nom
      await medicament.delete()
      
      await transmit.broadcast('pharmacy_channel', {
          message: `Médicament supprimé : ${name}`,
          type: 'inventory_update'
      })

      // Log d'audit - Suppression de médicament
      await AuditService.logMedicamentDeleted(
        { auth, request: {} as any, response } as HttpContext,
        params.id,
        name,
        'Suppression demandée par utilisateur autorisé'
      )

      return response.ok({ success: true, message: 'Médicament supprimé.' })
    } catch (error) {
      throw error
    }
  }

  // ----------------------------------------------------------------------
  // 2. GESTION DES STOCKS & COMMANDES
  // ----------------------------------------------------------------------

  /**
   * Créer une commande fournisseur
   * @route POST /api/v1/pharmacy/orders
   * @access Admin, Pharmacien
   */
  public async createOrder({ request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile 
    const trx = await db.transaction()

    try {
      const { fournisseurId, items } = await request.validateUsing(
        (await import('#validators/pharmacy')).createOrderValidator
      )
      
      // Génération du numéro de commande au format "CMD-yymjXXX" avec vérification d'unicité
      let orderNumber = this.generateOrderNumber()
      let attempts = 0
      const maxAttempts = 10
      
      // Vérifier l'unicité du numéro (éviter les collisions)
      while (attempts < maxAttempts) {
        const existing = await CommandeFournisseur.query({ client: trx })
          .where('numeroCommande', orderNumber)
          .first()
        if (!existing) {
          break // Numéro unique trouvé
        }
        // Régénérer un nouveau numéro
        orderNumber = this.generateOrderNumber()
        attempts++
      }
      
      if (attempts >= maxAttempts) {
        // En cas d'échec, ajouter un suffixe supplémentaire
        const baseNumber = this.generateOrderNumber()
        orderNumber = `${baseNumber}${Math.floor(Math.random() * 10)}`
      }
      
      let totalAmount = 0

      // Vérif existence fournisseur
      await Fournisseur.findOrFail(fournisseurId)

      const order = await CommandeFournisseur.create({
        numeroCommande: orderNumber,
        fournisseurId: fournisseurId,
        statut: 'commandee',
        dateCommande: DateTime.now(),
        creePar: user.id,
        montantTotal: 0
      }, { client: trx })

      // Optimisation : Récupérer tous les médicaments en une seule requête pour éviter N+1
      const medicamentIds = items.map(item => item.medicamentId)
      const medicaments = await Medicament.query({ client: trx })
        .whereIn('id', medicamentIds)
        .exec()
      
      const medicamentMap = new Map(medicaments.map(m => [m.id, m]))
      
      // Vérifier que tous les médicaments existent
      for (const medicamentId of medicamentIds) {
        if (!medicamentMap.has(medicamentId)) {
          const error: any = new Error(`Médicament avec l'ID ${medicamentId} introuvable`)
          error.status = 404
          throw error
        }
      }

      for (const item of items) {
        const lineTotal = item.quantity * item.price
        totalAmount += lineTotal
        
        await LigneCommandeFournisseur.create({
          commandeId: order.id,
          medicamentId: item.medicamentId,
          quantiteCommandee: item.quantity,
          prixUnitaireAchat: item.price,
          quantiteRecue: 0
        }, { client: trx })
      }

      order.montantTotal = totalAmount
      await order.save()
      await trx.commit()

      await transmit.broadcast('pharmacy_channel', {
          message: `Nouvelle commande créée : ${orderNumber}`,
          type: 'order_update'
      })

      // Log d'audit
      await AuditService.logCreate(
        { auth, request, response } as HttpContext,
        'commande_fournisseur',
        order.id,
        orderNumber
      )

      // Charger les relations pour la réponse
      await order.load('fournisseur')
      await order.load('lignes', (q) => q.preload('medicament'))

      const transformedOrder = PharmacyTransformer.transformOrder(order, true)

      return response.status(201).json(
        ApiResponse.created(
          transformedOrder,
          'Commande envoyée'
        )
      )
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error, userId: user.id }, 'Erreur lors de la création de la commande')
      
      // Les erreurs VineJS sont déjà gérées par le handler, on les laisse passer
      if (error instanceof AppException || (error as any).code === 'E_VALIDATION_ERROR') {
        throw error
      }
      
      // Gérer les erreurs 404 (médicament introuvable)
      if ((error as any).status === 404) {
        throw AppException.notFound((error as any).message || 'Ressource')
      }
      
      throw AppException.internal('Erreur lors de la création de la commande.')
    }
  }

  /**
   * Recevoir une commande (Entrée en stock)
   */
  public async receiveOrder({ params, response, auth }: HttpContext) {
    const user = auth.user as UserProfile 
    const trx = await db.transaction()

    try {
      const orderId = params.id
      
      const order = await CommandeFournisseur.query({ client: trx })
        .where('id', orderId)
        .preload('lignes')
        .firstOrFail()

      if (order.statut === 'recue' || order.statut === 'annulee') {
        throw AppException.badRequest('Commande déjà clôturée.')
      }

      for (const ligne of order.lignes) {
        const qtyToReceive = ligne.quantiteCommandee - ligne.quantiteRecue
        if (qtyToReceive <= 0) continue

        const medicament = await Medicament.query({ client: trx })
          .where('id', ligne.medicamentId)
          .forUpdate()
          .first()
        
        if (medicament) {
          medicament.stockActuel += qtyToReceive
          medicament.prixUnitaire = ligne.prixUnitaireAchat
          
          if (medicament.stockActuel > medicament.stockMinimum) {
             medicament.statutStock = 'en_stock'
          }
          
          await medicament.save()
        }
        
        ligne.quantiteRecue += qtyToReceive
        await ligne.save()

        // Générer un numéro de lot pour cette réception
        const numeroLot = this.generateLotNumber()

        const mouvement = await InventaireMouvement.create({ 
            medicamentId: ligne.medicamentId, 
            typeMouvement: 'entree', 
            quantite: qtyToReceive, 
            prixUnitaire: ligne.prixUnitaireAchat, 
            raison: `Réception Commande ${order.numeroCommande}`, 
            numeroLot: numeroLot,
            commandeFournisseurId: order.id, 
            utilisateurId: user.id 
        }, { client: trx })

        // Log d'audit - Réception de stock
        await AuditService.logStockReceived(
          { auth, request: {} as any, response } as HttpContext,
          ligne.medicamentId,
          medicament?.nom || 'Médicament',
          qtyToReceive,
          order.fournisseur?.nom,
          numeroLot
        )

        // Log d'audit - Création de lot
        await AuditService.logBatchCreated(
          { auth, request: {} as any, response } as HttpContext,
          mouvement.id,
          medicament?.nom || 'Médicament',
          numeroLot,
          qtyToReceive,
          medicament?.dateExpiration?.toFormat('dd/MM/yyyy')
        )

        // Notification pour les pharmaciens (mouvement d'inventaire)
        await NotificationService.notifyInventoryMovement(
          ligne.medicamentId,
          ligne.medicament?.nom || 'Médicament',
          'entree',
          qtyToReceive,
          `Réception Commande ${order.numeroCommande}`,
          order.numeroCommande
        )
      }

      order.statut = 'recue'
      await order.save()
      await trx.commit()

      await transmit.broadcast('pharmacy_channel', {
          message: `Stock mis à jour (Réception ${order.numeroCommande})`,
          type: 'stock_update'
      })

      // Log d'audit
      await AuditService.logUpdate(
        { auth, request: {} as any, response } as HttpContext,
        'commande_fournisseur',
        order.id,
        order.numeroCommande,
        { statut: { ancien: 'commandee', nouveau: 'recue' } }
      )

      // Charger les relations pour la réponse
      await order.load('fournisseur')
      await order.load('lignes', (q) => q.preload('medicament'))

      const transformedOrder = PharmacyTransformer.transformOrder(order, true)

      return response.json(
        ApiResponse.success(
          transformedOrder,
          'Stock mis à jour.'
        )
      )
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error, orderId: params.id, userId: user.id }, 'Erreur lors de la réception de la commande')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la réception de la commande.')
    }
  }

  /**
   * Ajustement manuel du stock (Inv. Physique)
   * @route POST /api/v1/pharmacy/inventory/adjust
   * @access Admin, Pharmacien
   */
  public async adjustStock({ request, response, auth }: HttpContext) {
    const user = auth.user as UserProfile 
    const trx = await db.transaction()

    try {
      const { medicamentId, realQuantity, reason } = await request.validateUsing(
        (await import('#validators/pharmacy')).adjustStockValidator
      )
      const medicament = await Medicament.findOrFail(medicamentId, { client: trx })
      
      const oldStock = medicament.stockActuel
      const newStock = typeof realQuantity === 'string' ? parseInt(realQuantity, 10) : Number(realQuantity)
      const diff = newStock - oldStock

      if (diff === 0) { 
          await trx.commit()
          return response.json({ success: true, message: 'Aucun changement.' }) 
      }
      
      if (diff !== 0 && !reason) {
          const error: any = new Error("Le motif de l'ajustement est obligatoire.")
          error.status = 400
          throw error
      }

      medicament.stockActuel = newStock
      if (newStock <= 0) medicament.statutStock = 'rupture_stock'
      else if (newStock <= medicament.stockMinimum) medicament.statutStock = 'stock_faible'
      else medicament.statutStock = 'en_stock'

      await medicament.save()

      // Log d'audit pour ajustement de stock
      await AuditService.logStockAdjusted(
        { auth, request, response } as HttpContext,
        medicament.id,
        medicament.nom,
        oldStock,
        newStock,
        reason
      )

      const mouvement = await InventaireMouvement.create({
        medicamentId: medicament.id,
        typeMouvement: diff > 0 ? 'entree' : (diff < 0 ? 'sortie' : 'ajustement'),
        quantite: Math.abs(diff),
        raison: `Ajustement: ${reason || 'Inventaire Physique'}`,
        utilisateurId: user.id 
      }, { client: trx })

      await trx.commit()

      // Notification pour les pharmaciens (mouvement d'inventaire)
      const movementType = diff > 0 ? 'entree' : (diff < 0 ? 'sortie' : 'ajustement')
      await NotificationService.notifyInventoryMovement(
        medicament.id,
        medicament.nom,
        movementType,
        Math.abs(diff),
        reason || 'Inventaire Physique'
      )

      await transmit.broadcast('pharmacy_channel', {
        message: `Ajustement stock : ${medicament.nom} (${diff > 0 ? '+' : ''}${diff})`,
        type: 'stock_update'
      })

      // Créer une notification si le stock est faible ou en rupture
      if (newStock <= 0) {
        // Log d'audit pour rupture de stock
        await AuditService.logStockAlert(
          { auth, request, response } as HttpContext,
          medicament.id,
          medicament.nom,
          0,
          medicament.stockMinimum
        )
        
        // Notifier uniquement les pharmaciens (leur domaine)
        const pharmacists = await UserProfile.query()
          .where('role', 'pharmacien')
          .where('actif', true)
        const pharmacistIds = pharmacists.map((u) => u.id)
        
        if (pharmacistIds.length > 0) {
          await NotificationService.createNotification(
            pharmacistIds,
            'Rupture de stock',
            `Le médicament ${medicament.nom} est en rupture de stock`,
            {
              type: 'critical',
              category: 'pharmacy',
              targetId: medicament.id,
              targetType: 'medication',
              actionUrl: `/operations-pharmacie?medication=${medicament.id}`,
              priority: 'urgent',
            }
          )
        }

        // Notifier aussi les admins/gestionnaires (pour information)
        const admins = await UserProfile.query()
          .whereIn('role', ['admin', 'gestionnaire'])
          .where('actif', true)
        const adminIds = admins.map((u) => u.id)

        if (adminIds.length > 0) {
          await NotificationService.createNotification(
            adminIds,
            'Rupture de stock en pharmacie',
            `Le médicament ${medicament.nom} est en rupture de stock`,
            {
              type: 'critical',
              category: 'pharmacy',
              targetId: medicament.id,
              targetType: 'medication',
              actionUrl: `/operations-pharmacie?medication=${medicament.id}`,
              priority: 'high',
              silent: true, // Notification silencieuse pour les admins
            }
          )
        }
      } else if (newStock <= medicament.stockMinimum) {
        // Log d'audit pour stock faible
        await AuditService.logStockAlert(
          { auth, request, response } as HttpContext,
          medicament.id,
          medicament.nom,
          newStock,
          medicament.stockMinimum
        )
        
        await NotificationService.notifyLowStock(medicament.id, medicament.nom)
      }

      return response.json({ success: true, message: 'Stock ajusté.' })
    } catch (error) {
      await trx.rollback()
      const medicamentId = request.input('medicamentId')
      logger.error({ err: error, medicamentId, userId: user.id }, 'Erreur lors de l\'ajustement du stock')
      throw error
    }
  }

  // ----------------------------------------------------------------------
  // 3. STATISTIQUES & ANALYSES
  // ----------------------------------------------------------------------

  /**
   * Statistiques pharmacie (sans cache : données toujours fraîches)
   */
  public async stats({ response }: HttpContext) {
    try {
      const totalItems = await Medicament.query().count('* as total')
      const allMeds = await Medicament.query().select('stock_actuel', 'prix_unitaire')
      const totalValue = allMeds.reduce((acc, med) => acc + ((Number(med.prixUnitaire) || 0) * med.stockActuel), 0)
      const lowStock = await Medicament.query().whereRaw('stock_actuel <= stock_minimum').count('* as total')
      const expiringSoon = await Medicament.query().where('date_expiration', '<=', DateTime.now().plus({ days: 30 }).toSQLDate()).count('* as total')

      const data = {
        totalMedications: Number(totalItems[0].$extras.total),
        totalValue: totalValue,
        lowStock: Number(lowStock[0].$extras.total),
        expiringSoon: Number(expiringSoon[0].$extras.total)
      }
      return response.json({
        success: true,
        data
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des statistiques de la pharmacie')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des statistiques de la pharmacie.'
      })
    }
  }

  /**
   * Analyse prédictive (Mockée avec SQL réel pour démo)
   */
  public async predictiveAnalysis({ response }: HttpContext) {
    try {
      // Forecast basé sur les sorties des 6 derniers mois
      const usageForecastDataRaw = await db.rawQuery(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month, 
        COALESCE(SUM(CASE WHEN type_mouvement = 'sortie' THEN quantite ELSE 0 END), 0) as actual_out
      FROM inventaire_mouvements
      WHERE created_at >= NOW() - INTERVAL '6 months' AND type_mouvement = 'sortie'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `)

    let forecastData = usageForecastDataRaw.rows.map((row: any) => ({
        month: row.month,
        actual: parseInt(row.actual_out) || 0,
        predicted: Math.round((parseInt(row.actual_out) || 0) * 1.1), // Mock simple +10%
        confidence: 90
    }))

    // Si pas de données, mock complet pour l'affichage
    if (forecastData.length === 0) {
        forecastData = [
            { month: 'Oct', actual: 120, predicted: 130 },
            { month: 'Nov', actual: 145, predicted: 150 },
            { month: 'Déc', actual: 180, predicted: 170 },
            { month: 'Jan', actual: 150, predicted: 160 }
        ]
    }

    const distributionDataRaw = await db.rawQuery(`
      SELECT 
        m.forme as name,
        SUM(i.quantite) as value
      FROM inventaire_mouvements i
      JOIN medicaments m ON i.medicament_id = m.id
      WHERE i.created_at >= NOW() - INTERVAL '3 months' AND i.type_mouvement = 'sortie' AND m.forme IS NOT NULL
      GROUP BY m.forme
      ORDER BY value DESC
      LIMIT 5
    `)

    const categoryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    const distributionData = distributionDataRaw.rows.map((row: any, index: number) => ({
        name: row.name,
        value: parseInt(row.value),
        color: categoryColors[index % categoryColors.length]
    }))

    // Recommandations de commande (Basique)
    const reorderRecommendations = await Medicament.query()
        .whereRaw('stock_actuel <= stock_minimum')
        .limit(5)
        .exec()

    const formattedRecs = reorderRecommendations.map(m => ({
        id: m.id,
        medication: m.nom,
        currentStock: m.stockActuel,
        predictedNeed: m.stockMinimum * 3,
        recommendedOrder: (m.stockMinimum * 3) - m.stockActuel,
        urgency: m.stockActuel === 0 ? 'high' : 'medium',
        estimatedStockout: m.stockActuel === 0 ? 'Immédiat' : '2 jours',
        confidence: 85,
        reason: 'Stock sous le seuil minimum'
    }));
    
      return response.json({
        success: true,
        forecastData,
        distributionData,
        reorderRecommendations: formattedRecs
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'analyse prédictive')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement de l\'analyse prédictive.'
      })
    }
  }
  
  // ----------------------------------------------------------------------
  // 4. UTILITAIRES DE RECHERCHE & LISTING
  // ----------------------------------------------------------------------

  public async search({ request, response }: HttpContext) {
    try {
      const term = request.input('q', '').trim()
      
      // Validation de la longueur de la recherche
      if (term.length > 100) {
        return response.badRequest({
          success: false,
          message: 'La recherche ne peut pas dépasser 100 caractères.'
        })
      }

      const meds = await Medicament.query()
        .where('nom', 'ilike', `%${term}%`)
        .orWhere('principeActif', 'ilike', `%${term}%`)
        .limit(20)
        
      return response.json({
          success: true,
          data: meds.map(m => ({ 
              value: m.id, 
              label: `${m.nom} ${m.dosage || ''} - Stock: ${m.stockActuel}` 
          }))
      })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la recherche de médicaments')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de la recherche.'
      })
    }
  }

  public async alerts({ response }: HttpContext) {
    try {
      const expiringSoon = await Medicament.query()
        .where('date_expiration', '<=', DateTime.now().plus({ days: 90 }).toSQLDate())
        .andWhere('stock_actuel', '>', 0)
        .orderBy('date_expiration', 'asc')
        .limit(20)

      const formattedAlerts = expiringSoon.map(item => {
        const daysLeft = Math.ceil(item.dateExpiration!.diff(DateTime.now(), 'days').days)
        let priority = daysLeft <= 30 ? 'high' : daysLeft <= 60 ? 'medium' : 'low'

        return {
          id: item.id,
          medication: `${item.nom} ${item.dosage || ''}`,
          batchNumber: 'LOT-' + item.id.substring(0, 6).toUpperCase(),
          expiryDate: item.dateExpiration!.toISODate(),
          daysUntilExpiry: daysLeft,
          currentStock: item.stockActuel,
          priority: priority,
          action: priority === 'high' ? 'Retirer du stock' : 'Prévoir rotation'
        }
      })

      return response.json({ success: true, data: formattedAlerts })
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des alertes d\'expiration')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors du chargement des alertes.'
      })
    }
  }

  public async pendingOrders({ response }: HttpContext) {
    try {
      const orders = await CommandeFournisseur.query()
        .whereIn('statut', ['commandee', 'partiellement_recue'])
        .preload('fournisseur')
        .preload('lignes', (q) => q.preload('medicament'))
        .orderBy('dateCommande', 'desc')

      const formatted = orders.map(o => ({
        value: o.id,
        label: `${o.numeroCommande} - ${o.fournisseur.nom} (${o.lignes.length} articles)`,
        lines: o.lignes.map(l => ({
          id: l.id,
          medicamentId: l.medicamentId,
          name: l.medicament ? l.medicament.nom : 'Médicament inconnu',
          ordered: l.quantiteCommandee,
          received: l.quantiteRecue
        }))
      }))

      return response.json(ApiResponse.success(formatted))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des commandes en attente')
      throw AppException.internal('Erreur lors du chargement des commandes en attente.')
    }
  }

  public async recentOrders({ response }: HttpContext) {
    try {
        const orders = await CommandeFournisseur.query()
            .preload('fournisseur')
            .preload('lignes')
            .orderBy('dateCommande', 'desc')
            .limit(10)

        const formattedOrders = orders.map(o => ({
            id: o.id,
            orderNumber: o.numeroCommande,
            supplier: o.fournisseur ? o.fournisseur.nom : 'Inconnu',
            date: o.dateCommande.toISODate(),
            items: o.lignes.length,
            totalAmount: Number(o.montantTotal),
            status: o.statut,
            deliveryDate: o.dateLivraisonEstimee ? o.dateLivraisonEstimee.toISODate() : 'N/A',
            trackingNumber: `TRACK-${o.id.substring(0, 8).toUpperCase()}`
        }))

        return response.json({ success: true, data: formattedOrders })
    } catch (error) {
        throw error
    }
  }

  /**
   * Détails d'une commande fournisseur
   * @route GET /api/v1/pharmacy/orders/:id
   */
  public async showOrder({ params, response }: HttpContext) {
    try {
      const order = await CommandeFournisseur.query()
        .where('id', params.id)
        .preload('fournisseur')
        .preload('lignes', (q) => q.preload('medicament'))
        .preload('createur', (q) => q.select('id', 'nomComplet', 'email'))
        .firstOrFail()

      const formattedOrder = {
        id: order.id,
        orderNumber: order.numeroCommande,
        supplier: order.fournisseur ? {
          id: order.fournisseur.id,
          nom: order.fournisseur.nom,
          email: order.fournisseur.email || null,
          telephone: order.fournisseur.telephone || null,
          adresse: order.fournisseur.adresse || null,
        } : null,
        date: order.dateCommande.toISODate(),
        deliveryDate: order.dateLivraisonEstimee ? order.dateLivraisonEstimee.toISODate() : null,
        status: order.statut,
        totalAmount: Number(order.montantTotal),
        createdBy: order.createur ? {
          id: order.createur.id,
          nomComplet: order.createur.nomComplet,
          email: order.createur.email || null,
        } : null,
        createdAt: order.createdAt.toISO(),
        updatedAt: order.updatedAt.toISO(),
        lines: order.lignes.map(l => ({
          id: l.id,
          medicamentId: l.medicamentId,
          medicament: l.medicament ? {
            id: l.medicament.id,
            nom: l.medicament.nom,
            codeBarre: l.medicament.codeBarre || null,
            forme: l.medicament.forme || null,
            dosage: l.medicament.dosage || null,
          } : null,
          quantiteCommandee: l.quantiteCommandee,
          quantiteRecue: l.quantiteRecue,
          prixUnitaireAchat: Number(l.prixUnitaireAchat),
          total: l.quantiteCommandee * Number(l.prixUnitaireAchat),
        })),
      }

      return response.json({ success: true, data: formattedOrder })
    } catch (error: any) {
      logger.error({ err: error, orderId: params.id }, 'Erreur lors de la récupération des détails de la commande')
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ success: false, message: 'Commande introuvable' })
      }
      throw error
    }
  }

  // ----------------------------------------------------------------------
  // 7. GESTION DES PRESCRIPTIONS
  // ----------------------------------------------------------------------

  /**
   * Lister les prescriptions en attente (non délivrées)
   * @route GET /api/v1/pharmacy/prescriptions/pending
   * @access Pharmacien
   */
  public async pendingPrescriptions({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      const { page, limit } = PaginationHelper.fromRequest(request, 20, 100)
      const search = request.input('search')
      const patientId = request.input('patientId')

      // Importer Prescription ici pour éviter les problèmes de dépendances circulaires
      const Prescription = (await import('#models/Prescription')).default
      const Consultation = (await import('#models/Consultation')).default
      const Patient = (await import('#models/Patient')).default
      const Medecin = (await import('#models/Medecin')).default

      const query = Prescription.query()
        .where('delivre', false)
        .preload('consultation', (q) => {
          q.preload('patient', (pq) => pq.preload('user'))
          q.preload('medecin', (mq) => mq.preload('user'))
        })
        .preload('medicament')
        .orderBy('datePrescription', 'desc')

      // Filtre par patient si fourni
      if (patientId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(patientId)) {
          throw AppException.badRequest('Format UUID invalide pour patientId')
        }
        query.whereHas('consultation', (q) => {
          q.where('patientId', patientId)
        })
      }

      // Recherche par nom de patient ou médicament
      if (search) {
        const searchTerm = search.trim()
        query.where((q) => {
          q.whereHas('consultation', (cq) => {
            cq.whereHas('patient', (pq) => {
              pq.whereHas('user', (uq) => {
                uq.where('nomComplet', 'ilike', `%${searchTerm}%`)
              })
            })
          })
          .orWhereHas('medicament', (mq) => {
            mq.where('nom', 'ilike', `%${searchTerm}%`)
          })
        })
      }

      const prescriptions = await query.paginate(page, limit)

      // Transformer les données pour le frontend
      const transformedData = prescriptions.all().map((prescription) => {
        const consultation = prescription.consultation
        const patient = consultation?.patient
        const patientUser = patient?.user
        const medecin = consultation?.medecin
        const medecinUser = medecin?.user
        const medicament = prescription.medicament

        return {
          id: prescription.id,
          consultationId: prescription.consultationId,
          medicamentId: prescription.medicamentId,
          medicament: medicament ? {
            id: medicament.id,
            nom: medicament.nom,
            codeBarre: medicament.codeBarre || null,
            forme: medicament.forme || null,
            dosage: medicament.dosage || null,
          } : null,
          quantite: prescription.quantite,
          posologie: prescription.posologie,
          dureeTraitement: prescription.dureeTraitement,
          instructionsSpeciales: prescription.instructionsSpeciales,
          datePrescription: prescription.datePrescription.toISO(),
          patient: patientUser ? {
            id: patient.id,
            nomComplet: patientUser.nomComplet,
            numeroPatient: patient.numeroPatient || null,
          } : null,
          medecin: medecinUser ? {
            id: medecin.id,
            nomComplet: medecinUser.nomComplet,
          } : null,
          consultationDate: consultation?.dateConsultation?.toISO() || null,
        }
      })

      return response.json(
        ApiResponse.paginated(
          transformedData,
          prescriptions.currentPage,
          prescriptions.perPage,
          prescriptions.total
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des prescriptions en attente')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors du chargement des prescriptions.')
    }
  }

  /**
   * Marquer une prescription comme délivrée
   * @route PATCH /api/v1/pharmacy/prescriptions/:id/deliver
   * @access Pharmacien
   */
  public async markPrescriptionDelivered(ctx: HttpContext) {
    const { params, response, auth, request } = ctx
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide')
      }

      // Importer Prescription ici
      const Prescription = (await import('#models/Prescription')).default

      const prescription = await Prescription.find(params.id)
      if (!prescription) {
        throw AppException.notFound('Prescription introuvable')
      }

      if (prescription.delivre) {
        throw AppException.badRequest('Cette prescription a déjà été délivrée')
      }

      // Charger les relations avant de réduire le stock
      await prescription.load('consultation', (q) => {
        q.preload('patient', (pq) => pq.preload('user'))
        q.preload('medecin', (mq) => mq.preload('user'))
      })
      await prescription.load('medicament')

      const consultation = prescription.consultation
      const patient = consultation?.patient
      const patientUser = patient?.user
      const medecin = consultation?.medecin
      const medecinUser = medecin?.user
      const medicament = prescription.medicament

      // Réduire le stock du médicament prescrit (uniquement lors de la validation par le pharmacien)
      if (medicament && prescription.quantite > 0) {
        const trx = await db.transaction()
        try {
          // Charger le médicament avec verrouillage pour éviter les conflits
          const medicamentToUpdate = await Medicament.query({ client: trx })
            .where('id', medicament.id)
            .forUpdate()
            .firstOrFail()

          const oldStock = medicamentToUpdate.stockActuel
          const newStock = Math.max(0, oldStock - prescription.quantite)
          const diff = newStock - oldStock

          // Mettre à jour le stock
          medicamentToUpdate.stockActuel = newStock
          
          // Mettre à jour le statut du stock
          if (newStock <= 0) {
            medicamentToUpdate.statutStock = 'rupture_stock'
          } else if (newStock <= medicamentToUpdate.stockMinimum) {
            medicamentToUpdate.statutStock = 'stock_faible'
          } else {
            medicamentToUpdate.statutStock = 'en_stock'
          }

          await medicamentToUpdate.save()

          // Créer un mouvement d'inventaire pour la traçabilité
          const InventaireMouvement = (await import('#models/InventaireMouvement')).default
          await InventaireMouvement.create({
            medicamentId: medicament.id,
            typeMouvement: 'sortie',
            quantite: Math.abs(diff),
            raison: `Prescription délivrée - ${medicament.nom} (${prescription.quantite} unité(s)) pour ${patientUser?.nomComplet || 'Patient'}`,
            utilisateurId: user.id
          }, { client: trx })

          await trx.commit()

          // Notification si le stock est faible ou en rupture
          if (newStock <= 0) {
            const pharmacists = await UserProfile.query()
              .where('role', 'pharmacien')
              .where('actif', true)
            const pharmacistIds = pharmacists.map((u) => u.id)
            
            if (pharmacistIds.length > 0) {
              await NotificationService.createNotification(
                pharmacistIds,
                'Rupture de stock',
                `Le médicament ${medicament.nom} est en rupture de stock après délivrance de prescription`,
                {
                  type: 'critical',
                  category: 'pharmacy',
                  targetId: medicament.id,
                  targetType: 'medication',
                  actionUrl: `/operations-pharmacie?medication=${medicament.id}`,
                  priority: 'urgent',
                }
              )
            }
          } else if (newStock <= medicamentToUpdate.stockMinimum) {
            await NotificationService.notifyLowStock(medicament.id, medicament.nom)
          }

          // Diffuser la mise à jour du stock
          await transmit.broadcast('pharmacy_channel', {
            message: `Stock réduit : ${medicament.nom} (${diff} unité(s))`,
            type: 'stock_update',
            medicamentId: medicament.id,
            newStock: newStock
          })
        } catch (stockError) {
          await trx.rollback()
          logger.error({ err: stockError, medicamentId: medicament.id, prescriptionId: prescription.id }, 'Erreur lors de la réduction de stock pour prescription')
          // Ne pas faire échouer la validation de prescription si la réduction de stock échoue
          // Mais logger l'erreur pour investigation
        }
      }

      // Marquer comme délivrée (après la réduction de stock)
      prescription.delivre = true
      await prescription.save()

      // Log d'audit
      await AuditService.logAction(
        ctx,
        'prescription_delivered',
        `Prescription délivrée: ${medicament?.nom || 'Médicament'} (${prescription.quantite} unité(s)) pour ${patientUser?.nomComplet || 'Patient'}`,
        prescription.id,
        {
          prescriptionId: prescription.id,
          medicamentId: prescription.medicamentId,
          medicamentName: medicament?.nom || null,
          quantite: prescription.quantite,
          patientId: patient?.id || null,
          patientName: patientUser?.nomComplet || null,
          medecinId: medecin?.id || null,
          medecinName: medecinUser?.nomComplet || null,
          deliveredBy: user.id,
          deliveredByName: user.nomComplet || user.email,
          deliveredAt: DateTime.now().toISO(),
        }
      )

      // Notification au médecin (optionnel)
      if (medecinUser) {
        await NotificationService.createNotification(
          medecinUser.id,
          'Prescription délivrée',
          `La prescription de ${medicament?.nom || 'médicament'} (${prescription.quantite} unité(s)) pour ${patientUser?.nomComplet || 'le patient'} a été délivrée par la pharmacie.`,
          {
            type: 'success',
            category: 'pharmacy',
            targetId: prescription.id,
            targetType: 'prescription',
            actionUrl: `/operations-pharmacie?prescription=${prescription.id}`,
            priority: 'normal',
            silent: true, // Notification silencieuse
          }
        )
      }

      return response.json(
        ApiResponse.success(
          {
            id: prescription.id,
            delivre: prescription.delivre,
            deliveredAt: DateTime.now().toISO(),
          },
          'Prescription marquée comme délivrée avec succès.'
        )
      )
    } catch (error) {
      logger.error({ err: error, prescriptionId: params.id }, 'Erreur lors du marquage de la prescription comme délivrée')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors du marquage de la prescription.')
    }
  }

  /**
   * Modifier une prescription
   * @route PATCH /api/v1/pharmacy/prescriptions/:id
   * @access Pharmacien
   */
  public async updatePrescription(ctx: HttpContext) {
    const { params, request, response, auth } = ctx
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide')
      }

      const Prescription = (await import('#models/Prescription')).default
      const prescription = await Prescription.find(params.id)
      
      if (!prescription) {
        throw AppException.notFound('Prescription introuvable')
      }

      if (prescription.delivre) {
        throw AppException.badRequest('Impossible de modifier une prescription déjà délivrée')
      }

      // Récupérer les données à modifier
      const { quantite, posologie, dureeTraitement } = request.only(['quantite', 'posologie', 'dureeTraitement'])

      // Mettre à jour uniquement les champs fournis
      if (quantite !== undefined) {
        if (quantite <= 0) {
          throw AppException.badRequest('La quantité doit être supérieure à 0')
        }
        prescription.quantite = quantite
      }
      if (posologie !== undefined) {
        prescription.posologie = posologie
      }
      if (dureeTraitement !== undefined) {
        prescription.dureeTraitement = dureeTraitement
      }

      await prescription.save()

      // Charger les relations pour l'audit
      await prescription.load('consultation', (q) => {
        q.preload('patient', (pq) => pq.preload('user'))
        q.preload('medecin', (mq) => mq.preload('user'))
      })
      await prescription.load('medicament')

      const consultation = prescription.consultation
      const patient = consultation?.patient
      const patientUser = patient?.user
      const medicament = prescription.medicament

      // Log d'audit
      await AuditService.logAction(
        ctx,
        'prescription_updated',
        `Prescription modifiée: ${medicament?.nom || 'Médicament'} (${prescription.quantite} unité(s)) pour ${patientUser?.nomComplet || 'Patient'}`,
        prescription.id,
        {
          prescriptionId: prescription.id,
          medicamentId: prescription.medicamentId,
          medicamentName: medicament?.nom || null,
          quantite: prescription.quantite,
          posologie: prescription.posologie,
          dureeTraitement: prescription.dureeTraitement,
          patientId: patient?.id || null,
          patientName: patientUser?.nomComplet || null,
          updatedBy: user.id,
          updatedByName: user.nomComplet || user.email,
          updatedAt: DateTime.now().toISO(),
        }
      )

      return response.json(
        ApiResponse.success(
          {
            id: prescription.id,
            quantite: prescription.quantite,
            posologie: prescription.posologie,
            dureeTraitement: prescription.dureeTraitement,
          },
          'Prescription modifiée avec succès.'
        )
      )
    } catch (error) {
      logger.error({ err: error, prescriptionId: params.id }, 'Erreur lors de la modification de la prescription')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la modification de la prescription.')
    }
  }

  /**
   * Annuler une prescription
   * @route PATCH /api/v1/pharmacy/prescriptions/:id/cancel
   * @access Pharmacien
   */
  public async cancelPrescription(ctx: HttpContext) {
    const { params, response, auth } = ctx
    try {
      const user = auth.user as UserProfile
      if (!user) {
        throw AppException.unauthorized('Non authentifié')
      }

      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id)) {
        throw AppException.badRequest('Format UUID invalide')
      }

      const Prescription = (await import('#models/Prescription')).default
      const prescription = await Prescription.find(params.id)
      
      if (!prescription) {
        throw AppException.notFound('Prescription introuvable')
      }

      if (prescription.delivre) {
        throw AppException.badRequest('Impossible d\'annuler une prescription déjà délivrée')
      }

      // Charger les relations avant suppression pour l'audit
      await prescription.load('consultation', (q) => {
        q.preload('patient', (pq) => pq.preload('user'))
        q.preload('medecin', (mq) => mq.preload('user'))
      })
      await prescription.load('medicament')

      const consultation = prescription.consultation
      const patient = consultation?.patient
      const patientUser = patient?.user
      const medicament = prescription.medicament

      // Log d'audit avant suppression
      await AuditService.logAction(
        ctx,
        'prescription_cancelled',
        `Prescription annulée: ${medicament?.nom || 'Médicament'} (${prescription.quantite} unité(s)) pour ${patientUser?.nomComplet || 'Patient'}`,
        prescription.id,
        {
          prescriptionId: prescription.id,
          medicamentId: prescription.medicamentId,
          medicamentName: medicament?.nom || null,
          quantite: prescription.quantite,
          patientId: patient?.id || null,
          patientName: patientUser?.nomComplet || null,
          cancelledBy: user.id,
          cancelledByName: user.nomComplet || user.email,
          cancelledAt: DateTime.now().toISO(),
        }
      )

      // Supprimer la prescription
      await prescription.delete()

      return response.json(
        ApiResponse.success(
          { id: params.id, cancelled: true },
          'Prescription annulée avec succès.'
        )
      )
    } catch (error) {
      logger.error({ err: error, prescriptionId: params.id }, 'Erreur lors de l\'annulation de la prescription')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de l\'annulation de la prescription.')
    }
  }
}