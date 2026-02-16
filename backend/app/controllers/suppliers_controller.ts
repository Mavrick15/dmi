import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Fournisseur from '#models/Fournisseur' 
import db from '@adonisjs/lucid/services/db' // <--- IMPORT DB POUR REQUÊTE RAW
import AuditService from '#services/AuditService'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import { SupplierTransformer } from '../transformers/SupplierTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

export default class SuppliersController {
  
  /**
   * Liste des fournisseurs actifs (avec le nombre de commandes)
   * @route GET /api/v1/suppliers
   * @access Admin, Pharmacien
   */
  public async index({ request, response }: HttpContext) {
    try {
      // Validation de la pagination
      const { page, limit } = PaginationHelper.fromRequest(request, 20, 100)
      
      // Validation de la recherche (si fournie)
      const search = request.input('search')
      if (search) {
        const searchTrimmed = search.trim()
        if (searchTrimmed.length < 2) {
          throw AppException.badRequest('La recherche doit contenir au moins 2 caractères')
        }
        if (searchTrimmed.length > 100) {
          throw AppException.badRequest('La recherche ne peut pas dépasser 100 caractères')
        }
      }

      // Jointure pour compter le nombre de commandes (utilisation de raw query pour la performance)
      let query = Fournisseur.query()
        .select('fournisseurs.*') // Sélectionne toutes les colonnes du fournisseur
        .select(
          db.raw('COUNT(commandes_fournisseurs.id) as total_commandes') // Ajoute un COUNT
        )
        .leftJoin(
          'commandes_fournisseurs', 
          'fournisseurs.id', 
          'commandes_fournisseurs.fournisseur_id'
        )
        .where('actif', true)
        .groupBy('fournisseurs.id') // Grouper par l'ID du fournisseur

      // Recherche
      if (search) {
        const searchTerm = search.trim()
        query.where((q) => {
          q.whereILike('fournisseurs.nom', `%${searchTerm}%`)
            .orWhereILike('fournisseurs.email', `%${searchTerm}%`)
            .orWhereILike('fournisseurs.telephone', `%${searchTerm}%`)
        })
      }

      // Pagination et tri
      const suppliers = await query
        .orderBy('nom', 'asc')
        .paginate(page, limit)
    
      const transformedSuppliers = SupplierTransformer.transformMany(suppliers.all(), true)

      return response.json(
        ApiResponse.paginated(
          transformedSuppliers,
          suppliers.currentPage,
          suppliers.perPage,
          suppliers.total
        )
      )
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error
      }
      logger.error({ err: error }, 'Erreur lors de la récupération des fournisseurs')
      throw AppException.internal('Erreur lors du chargement des fournisseurs.')
    }
  }

  /**
   * Créer un nouveau fournisseur
   */
  public async store({ request, response, auth }: HttpContext) {
    const data = request.only(['nom', 'contactNom', 'email', 'telephone', 'adresse', 'delaiLivraisonMoyen'])
    
    if (!data.nom) {
      throw AppException.badRequest("Le nom est obligatoire")
    }

    try {
        const supplier = await Fournisseur.create({
            ...data,
            actif: true,
            delaiLivraisonMoyen: data.delaiLivraisonMoyen || 2 
        })
        
        // Log d'audit
        await AuditService.logCreate(
          { auth, request, response } as HttpContext,
          'fournisseur',
          supplier.id,
          supplier.nom
        )
        
        const transformedSupplier = SupplierTransformer.transform(supplier, true)

        return response.status(201).json(
          ApiResponse.created(
            transformedSupplier,
            'Fournisseur ajouté avec succès'
          )
        )
    } catch (error) {
         logger.error({ err: error }, 'Erreur lors de la création du fournisseur')
         // Relance l'erreur pour la gestion centralisée (y compris 409 si doublon email)
         throw error 
    }
  }

  /**
   * Détails d'un fournisseur
   * @route GET /api/v1/suppliers/:id
   */
  public async show({ params, response }: HttpContext) {
    try {
      const supplier = await Fournisseur.query()
        .where('id', params.id)
        .preload('commandes', (q) => {
          q.orderBy('date_commande', 'desc').limit(10)
        })
        .firstOrFail()

      // Compter le total des commandes
      const totalCommandesResult = await db
        .from('commandes_fournisseurs')
        .where('fournisseur_id', params.id)
        .count('* as total')
        .first()

      const transformedSupplier = SupplierTransformer.transform(supplier, true)
      
      // Ajouter les statistiques
      const supplierWithStats = {
        ...transformedSupplier,
        totalCommandes: Number(totalCommandesResult?.total || 0),
        commandesRecentes: (supplier.commandes || []).map(c => ({
          id: c.id,
          numeroCommande: c.numeroCommande,
          dateCommande: c.dateCommande.toISODate(),
          statut: c.statut,
          montantTotal: Number(c.montantTotal)
        }))
      }

      return response.json(ApiResponse.success(supplierWithStats))
    } catch (error: any) {
      logger.error({ err: error, supplierId: params.id }, 'Erreur lors de la récupération des détails du fournisseur')
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Fournisseur')
      }
      throw AppException.internal('Erreur lors du chargement des détails du fournisseur.')
    }
  }

  /**
   * Mettre à jour un fournisseur
   * @route PUT /api/v1/suppliers/:id
   */
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const fournisseur = await Fournisseur.findOrFail(params.id)
      const data = request.only(['nom', 'contactNom', 'email', 'telephone', 'adresse', 'delaiLivraisonMoyen', 'actif'])
      
      fournisseur.merge(data)
      await fournisseur.save()
      
      // Log d'audit
      await AuditService.logUpdate(
        { auth, request, response } as HttpContext,
        'fournisseur',
        params.id,
        fournisseur.nom
      )
      
      const transformedSupplier = SupplierTransformer.transform(fournisseur, true)
      
      return response.json(
        ApiResponse.success(
          transformedSupplier,
          'Fournisseur mis à jour avec succès'
        )
      )
    } catch (error: any) {
      logger.error({ err: error, supplierId: params.id }, 'Erreur lors de la mise à jour du fournisseur')
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Fournisseur')
      }
      throw error
    }
  }

  /**
   * Supprimer un fournisseur
   */
  public async destroy({ params, response, auth }: HttpContext) {
    try {
      // findOrFail lance E_ROW_NOT_FOUND (404) si l'ID n'existe pas
      const fournisseur = await Fournisseur.findOrFail(params.id)
      const nom = fournisseur.nom
      await fournisseur.delete()
      
      // Log d'audit
      await AuditService.logDelete(
        { auth, request: {} as any, response } as HttpContext,
        'fournisseur',
        params.id,
        nom
      )
      
      return response.json(
        ApiResponse.deleted('Fournisseur supprimé avec succès.')
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la suppression du fournisseur')
      // Relance l'erreur (y compris E_ROW_NOT_FOUND ou 23503 Foreign Key)
      throw error
    }
  }
}