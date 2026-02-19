import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Patient from '#models/Patient'
import Medicament from '#models/Medicament'
import UserProfile from '#models/UserProfile'
import Facture from '#models/Facture'
import Analyse from '#models/Analyse'
import Fournisseur from '#models/Fournisseur'
import CommandeFournisseur from '#models/CommandeFournisseur'
import Document from '#models/Document'
import { OmnisearchTransformer } from '../transformers/OmnisearchTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'

export default class OmnisearchController {
  
  /**
   * Effectue une recherche unifiée sur les entités principales.
   */
  public async globalSearch({ request, response }: HttpContext) {
    const query = request.input('q', '').trim()
    
    // Validation plus stricte : minimum 3 caractères, maximum 100 caractères
    if (!query || query.length < 3) {
      throw AppException.badRequest('Veuillez entrer au moins 3 caractères.')
    }

    if (query.length > 100) {
      throw AppException.badRequest('La requête de recherche ne peut pas dépasser 100 caractères.')
    }
    
    // Préparation des termes pour le SQL (insensible à la casse)
    // Utilisation de paramètres pour éviter les injections SQL
    const term = `%${query.toLowerCase()}%`
    const rawTerm = `%${query}%` 

    try {
      // 1. Recherche sur les Patients (via UserProfile + Champs Patient)
      const patientsSearch = Patient.query()
        .preload('user')
        .where((q) => {
             // A. Recherche dans les infos utilisateur liées (Nom, Email, Tel)
             q.whereHas('user', (userQuery) => {
               userQuery
                 .whereRaw('LOWER(nom_complet) LIKE ?', [term])
                 .orWhereRaw('LOWER(email) LIKE ?', [term])
                 .orWhere('telephone', 'LIKE', rawTerm)
             })
             // B. OU Recherche dans les infos patient (Numéro, Assurance, ID)
             .orWhereRaw('LOWER(numero_patient) LIKE ?', [term])
             .orWhereRaw('LOWER(numero_assurance) LIKE ?', [term])
             // Cast UUID en text pour la recherche partielle (PostgreSQL spécifique)
             .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
        })
        .limit(5)
        .exec()

      // 2. Recherche sur les Médicaments
      const medicamentsSearch = Medicament.query()
        .where((q) => {
            q.whereRaw('LOWER(nom) LIKE ?', [term])
             .orWhereRaw('LOWER(principe_actif) LIKE ?', [term])
             .orWhere('code_barre', 'LIKE', rawTerm)
             .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
        })
        .limit(5)
        .exec()

      // 3. Recherche sur les Utilisateurs (Staff uniquement)
      const usersSearch = UserProfile.query()
        .where('role', '!=', 'patient') // Exclure les patients (déjà cherchés en 1)
        .andWhere((q) => {
          q.whereRaw('LOWER(nom_complet) LIKE ?', [term])
           .orWhereRaw('LOWER(email) LIKE ?', [term])
           .orWhere('telephone', 'LIKE', rawTerm)
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
        })
        .limit(5)
        .exec()

      // 4. Recherche sur les Factures (par ID/numéro de facture)
      const facturesSearch = Facture.query()
        .preload('patient', (q) => q.preload('user'))
        .where((q) => {
          q.whereRaw('LOWER(numero_facture) LIKE ?', [term])
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
           .orWhereRaw('CAST(montant_total AS TEXT) LIKE ?', [rawTerm])
           .orWhere('numero_facture', 'ILIKE', rawTerm) // Recherche insensible à la casse via Lucid
        })
        .limit(5)
        .exec()

      // 5. Recherche sur les Analyses
      const analysesSearch = Analyse.query()
        .preload('patient', (q) => q.preload('user'))
        .where((q) => {
          q.whereRaw('LOWER(statut::text) LIKE ?', [term])
           .orWhereRaw('LOWER(numero_analyse) LIKE ?', [term])
           .orWhereRaw('LOWER(type_analyse::text) LIKE ?', [term])
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
           .orWhereHas('patient', (patientQuery) => {
             patientQuery.whereHas('user', (userQuery) => {
               userQuery.whereRaw('LOWER(nom_complet) LIKE ?', [term])
             })
           })
        })
        .limit(5)
        .exec()

      // 6. Recherche sur les Fournisseurs
      const fournisseursSearch = Fournisseur.query()
        .where((q) => {
          q.whereRaw('LOWER(nom) LIKE ?', [term])
           .orWhereRaw('LOWER(contact_nom) LIKE ?', [term])
           .orWhereRaw('LOWER(COALESCE(email, \'\')) LIKE ?', [term])
           .orWhere('telephone', 'LIKE', rawTerm)
           .orWhereRaw('LOWER(COALESCE(adresse, \'\')) LIKE ?', [term])
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
        })
        .limit(5)
        .exec()

      // 7. Recherche sur les Commandes fournisseur
      const commandesSearch = CommandeFournisseur.query()
        .preload('fournisseur')
        .where((q) => {
          q.whereRaw('LOWER(numero_commande) LIKE ?', [term])
           .orWhereRaw('LOWER(statut::text) LIKE ?', [term])
           .orWhereRaw('CAST(montant_total AS TEXT) LIKE ?', [rawTerm])
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
           .orWhereHas('fournisseur', (fournisseurQuery) => {
             fournisseurQuery.whereRaw('LOWER(nom) LIKE ?', [term])
           })
        })
        .limit(5)
        .exec()

      // 8. Recherche sur les Documents
      const documentsSearch = Document.query()
        .preload('patient', (q) => q.preload('user'))
        .where((q) => {
          q.whereRaw('LOWER(title) LIKE ?', [term])
           .orWhereRaw('LOWER(original_name) LIKE ?', [term])
           .orWhereRaw('LOWER(category) LIKE ?', [term])
           .orWhereRaw('CAST(id AS TEXT) LIKE ?', [rawTerm])
           .orWhereHas('patient', (patientQuery) => {
             patientQuery.whereHas('user', (userQuery) => {
               userQuery.whereRaw('LOWER(nom_complet) LIKE ?', [term])
             })
           })
        })
        .limit(5)
        .exec()

      // Exécution parallèle pour la performance
      const [
        patients,
        medicaments,
        users,
        factures,
        analyses,
        fournisseurs,
        commandes,
        documents,
      ] = await Promise.all([
        patientsSearch,
        medicamentsSearch,
        usersSearch,
        facturesSearch,
        analysesSearch,
        fournisseursSearch,
        commandesSearch,
        documentsSearch,
      ])

      const formattedResults = OmnisearchTransformer.transformGlobalSearch({
        patients,
        medicaments,
        users,
        factures,
        analyses,
        fournisseurs,
        commandes,
        documents,
      })

      return response.json(
        ApiResponse.success(
          formattedResults,
          undefined,
          { count: formattedResults.length }
        )
      )

    } catch (error) {
      logger.error({ err: error, query }, 'Erreur lors de la recherche globale (omnisearch)')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la recherche. Veuillez réessayer.')
    }
  }

  /**
   * Auto-complétion : recherche rapide dans la base de données (min. 2 caractères)
   * Retourne uniquement des suggestions de texte pour l'auto-complétion
   */
  public async autocomplete({ request, response }: HttpContext) {
    const query = request.input('q', '').trim()
    
    // Validation : minimum 2 caractères pour l'auto-complétion
    if (!query || query.length < 2) {
      return response.json(ApiResponse.success([]))
    }

    if (query.length > 100) {
      throw AppException.badRequest('La requête de recherche ne peut pas dépasser 100 caractères.')
    }
    
    // Préparation des termes pour le SQL (insensible à la casse)
    const term = `%${query.toLowerCase()}%` 

    try {
      // 1. Recherche sur les Patients (noms complets uniquement)
      const patientsSearch = Patient.query()
        .preload('user')
        .where((q) => {
             q.whereHas('user', (userQuery) => {
               userQuery.whereRaw('LOWER(nom_complet) LIKE ?', [term])
             })
             .orWhereRaw('LOWER(numero_patient) LIKE ?', [term])
        })
        .limit(3)
        .exec()

      // 2. Recherche sur les Médicaments (noms uniquement)
      const medicamentsSearch = Medicament.query()
        .whereRaw('LOWER(nom) LIKE ?', [term])
        .limit(3)
        .exec()

      // 3. Recherche sur les Utilisateurs Staff (noms uniquement)
      const usersSearch = UserProfile.query()
        .where('role', '!=', 'patient')
        .whereRaw('LOWER(nom_complet) LIKE ?', [term])
        .limit(2)
        .exec()

      // 4. Recherche sur les Factures (numéro de facture uniquement)
      const facturesSearch = Facture.query()
        .whereRaw('LOWER(numero_facture) LIKE ?', [term])
        .limit(2)
        .exec()

      // 5. Recherche sur les Analyses (numéro et type d'analyse)
      const analysesSearch = Analyse.query()
        .where((q) => {
          q.whereRaw('LOWER(numero_analyse) LIKE ?', [term])
           .orWhereRaw('LOWER(type_analyse::text) LIKE ?', [term])
        })
        .limit(2)
        .exec()

      // 6. Fournisseurs (nom)
      const fournisseursSearch = Fournisseur.query()
        .whereRaw('LOWER(nom) LIKE ?', [term])
        .limit(2)
        .exec()

      // 7. Commandes fournisseur (numéro)
      const commandesSearch = CommandeFournisseur.query()
        .whereRaw('LOWER(numero_commande) LIKE ?', [term])
        .limit(2)
        .exec()

      // 8. Documents (titre)
      const documentsSearch = Document.query()
        .whereRaw('LOWER(title) LIKE ?', [term])
        .limit(2)
        .exec()

      // Exécution parallèle pour la performance
      const [
        patients,
        medicaments,
        users,
        factures,
        analyses,
        fournisseurs,
        commandes,
        documents,
      ] = await Promise.all([
        patientsSearch,
        medicamentsSearch,
        usersSearch,
        facturesSearch,
        analysesSearch,
        fournisseursSearch,
        commandesSearch,
        documentsSearch,
      ])

      const suggestions = OmnisearchTransformer.transformAutocomplete({
        patients,
        medicaments,
        users,
        factures,
        analyses,
        fournisseurs,
        commandes,
        documents,
      })

      return response.json(ApiResponse.success(suggestions))

    } catch (error) {
      logger.error({ err: error, query }, 'Erreur lors de l\'auto-complétion')
      if (error instanceof AppException) {
        throw error
      }
      // En cas d'erreur, retourner une liste vide
      return response.json(ApiResponse.success([]))
    }
  }
}