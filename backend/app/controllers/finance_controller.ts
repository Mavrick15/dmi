import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Facture from '#models/Facture'
import CacheService from '#services/CacheService'
import Transaction from '#models/Transaction'
import Analyse from '#models/Analyse'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { PaginationHelper } from '../utils/PaginationHelper.js'
import AuditService from '#services/AuditService'
import NotificationService from '#services/NotificationService'
import { FinanceTransformer } from '../transformers/FinanceTransformer.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { AppException } from '../exceptions/AppException.js'
import { InvoicePDFService } from '#services/InvoicePDFService'

export default class FinanceController {

  /**
   * Génère un numéro de facture au format "FACT-yymjXXX"
   * yy: année (2 chiffres)
   * m: mois (1-9 pour janvier-septembre, A-C pour octobre-décembre)
   * j: jour (1-9 pour 1-9, A-V pour 10-31)
   * XXX: nombre aléatoire (3 chiffres, 000-999)
   */
  private generateInvoiceNumber(): string {
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
    
    return `FACT-${year}${monthChar}${dayChar}${randomNum}`
  }

  // 1. Vue d'ensemble (KPIs) — cache Redis 2 min pour limiter la charge BDD
  public async overview({ response }: HttpContext) {
    try {
      const cacheKey = 'finance:overview'
      const cached = await CacheService.getAsync(cacheKey)
      if (cached) {
        return response.json(ApiResponse.success(cached))
      }

      const currentMonthStart = DateTime.now().startOf('month').toSQLDate()

      // Revenus réels (basés sur les transactions encaissées, pas juste les factures émises)
      const revenueResult = await Transaction.query()
        .where('date_transaction', '>=', currentMonthStart)
        .sum('montant as total')

      // Impayés (Reste à payer sur les factures)
      // Calcul: Somme(montant_total - montant_paye) où statut != payee
      const unpaidResult = await db.rawQuery(`
        SELECT SUM(montant_total - montant_paye) as total
        FROM factures
        WHERE statut IN ('en_attente', 'en_retard')
      `)

      // Nombre de factures du mois
      const countResult = await Facture.query()
        .where('created_at', '>=', currentMonthStart)
        .count('* as total')

      const revenue = Number(revenueResult[0].$extras.total) || 0
      const outstandingAmount = Number(unpaidResult.rows[0]?.total) || 0
      
      const overviewData = FinanceTransformer.transformOverview({
        monthlyRevenue: revenue,
        outstandingAmount: outstandingAmount,
        invoicesCount: Number(countResult[0].$extras.total) || 0,
        netProfit: revenue * 0.3
      })

      await CacheService.setAsync(cacheKey, overviewData, 120)
      return response.json(ApiResponse.success(overviewData))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des données financières (overview)')
      throw AppException.internal('Erreur lors du chargement des données financières.')
    }
  }

  // 2. Historique des Transactions (NOUVELLE MÉTHODE)
  public async history({ request, response }: HttpContext) {
    try {
      const { page, limit } = PaginationHelper.fromRequest(request, 10, 100)

      const transactions = await Transaction.query()
        .preload('facture', (q) => {
          q.preload('patient', (p) => p.preload('user')) // Pour avoir le nom du patient
        })
        .orderBy('dateTransaction', 'desc')
        .paginate(page, limit)

      const transformedTransactions = FinanceTransformer.transformTransactions(transactions.all(), true)

      return response.json(
        ApiResponse.paginated(
          transformedTransactions,
          transactions.currentPage,
          transactions.perPage,
          transactions.total
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération de l\'historique des transactions')
      throw AppException.internal('Erreur lors du chargement de l\'historique des transactions.')
    }
  }

  // 3. Factures Impayées (Outstanding)
  public async outstanding({ response }: HttpContext) {
    try {
      const invoices = await Facture.query()
        .whereIn('statut', ['en_attente', 'en_retard'])
        .whereRaw('montant_total > montant_paye') // S'assurer qu'il reste un solde
        .preload('patient', (q) => {
          q.preload('user')
        })
        .orderBy('dateEcheance', 'asc')
        .limit(10)

      // S'assurer que toutes les relations patient->user sont bien chargées
      for (const invoice of invoices) {
        if (invoice.patient && !invoice.patient.user) {
          await invoice.patient.load('user')
        }
      }

      const transformedInvoices = FinanceTransformer.transformInvoices(invoices, true)

      return response.json(ApiResponse.success(transformedInvoices))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des factures impayées')
      throw AppException.internal('Erreur lors du chargement des factures impayées.')
    }
  }

  // 4. Récupérer une facture par ID
  public async show({ params, response }: HttpContext) {
    try {
      const facture = await Facture.query()
        .where('id', params.id)
        .preload('patient', (q) => q.preload('user'))
        .preload('consultation')
        .preload('transactions')
        .firstOrFail()

      const transformedInvoice = FinanceTransformer.transformInvoice(facture, true)

      return response.json(ApiResponse.success(transformedInvoice))
    } catch (error: any) {
      if (error.code === 'E_ROW_NOT_FOUND' || error.status === 404) {
        throw AppException.notFound('Facture')
      }
      logger.error({ err: error, factureId: params.id }, 'Erreur lors de la récupération de la facture')
      throw AppException.internal('Erreur lors du chargement de la facture.')
    }
  }

  // 5. Liste de toutes les factures (avec pagination)
  public async invoices({ request, response }: HttpContext) {
    try {
      const { page, limit } = PaginationHelper.fromRequest(request, 12, 100)
      const { statut, patientId, search, establishmentId } = request.only(['statut', 'patientId', 'search', 'establishmentId'])

      const query = Facture.query()
        .preload('patient', (q) => q.preload('user'))
        .orderBy('dateEmission', 'desc')

      if (statut && statut !== 'all') {
        const allowedStatuses = ['en_attente', 'payee', 'en_retard', 'annulee']
        if (allowedStatuses.includes(statut)) {
          query.where('statut', statut)
        }
      }

      if (patientId) {
        query.where('patient_id', patientId)
      }

      // Filtre par établissement : factures liées à une consultation dont le médecin est rattaché à cet établissement
      if (establishmentId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(establishmentId)) {
          throw AppException.badRequest('Format UUID invalide pour establishmentId')
        }
        query.whereHas('consultation', (c) =>
          c.whereHas('medecin', (m) => m.where('etablissementId', establishmentId))
        )
      }

      if (search) {
        query.where((q) => {
          q.where('numero_facture', 'ilike', `%${search}%`)
            .orWhereRaw(`
              EXISTS (
                SELECT 1 FROM patients p
                INNER JOIN user_profiles u ON p.user_id = u.id
                WHERE p.id = factures.patient_id
                AND (u.nom_complet ILIKE ? OR u.email ILIKE ?)
              )
            `, [`%${search}%`, `%${search}%`])
        })
      }

      const invoices = await query.paginate(page, limit)

      const transformedInvoices = FinanceTransformer.transformInvoices(invoices.all(), true)

      return response.json(
        ApiResponse.paginated(
          transformedInvoices,
          invoices.currentPage,
          invoices.perPage,
          invoices.total
        )
      )
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des factures')
      throw AppException.internal('Erreur lors du chargement des factures.')
    }
  }

  // 6. Créer une nouvelle facture
  public async store({ request, response, auth }: HttpContext) {
    try {
      const { patientId, consultationId, analyseIds, montantTotal, montantPaye, statut, dateEmission, dateEcheance, notes } = request.only([
        'patientId',
        'consultationId',
        'analyseIds',
        'montantTotal',
        'montantPaye',
        'statut',
        'dateEmission',
        'dateEcheance',
        'notes'
      ])

      // Validation
      if (!patientId) {
        throw AppException.badRequest('Le patient est requis.')
      }

      if (!montantTotal || montantTotal <= 0) {
        throw AppException.badRequest('Le montant total doit être supérieur à 0.')
      }

      // Vérifier que le patient existe
      const Patient = (await import('#models/Patient')).default
      const patient = await Patient.find(patientId)
      if (!patient) {
        throw AppException.notFound('Patient')
      }

      // Générer le numéro de facture au format "FACT-yymjXXX" avec vérification d'unicité
      let numeroFacture = this.generateInvoiceNumber()
      let attempts = 0
      const maxAttempts = 10
      
      // Vérifier l'unicité du numéro (éviter les collisions)
      while (attempts < maxAttempts) {
        const existing = await Facture.query().where('numeroFacture', numeroFacture).first()
        if (!existing) {
          break // Numéro unique trouvé
        }
        // Régénérer un nouveau numéro
        numeroFacture = this.generateInvoiceNumber()
        attempts++
      }
      
      if (attempts >= maxAttempts) {
        // En cas d'échec, ajouter un suffixe supplémentaire
        const baseNumber = this.generateInvoiceNumber()
        numeroFacture = `${baseNumber}${Math.floor(Math.random() * 10)}`
      }

      // Calculer la date d'échéance si non fournie (30 jours par défaut)
      const emissionDate = dateEmission ? DateTime.fromISO(dateEmission) : DateTime.now()
      const echeanceDate = dateEcheance 
        ? DateTime.fromISO(dateEcheance)
        : emissionDate.plus({ days: 30 })

      // Créer la facture
      const facture = await Facture.create({
        patientId,
        consultationId: consultationId || null,
        numeroFacture,
        montantTotal: Number(montantTotal),
        montantPaye: Number(montantPaye || 0),
        statut: statut || 'en_attente',
        dateEmission: emissionDate,
        dateEcheance: echeanceDate,
        notes: notes || null
      })
      await CacheService.deleteAsync('finance:overview')

      // Lier les analyses à la facture si fournies
      if (analyseIds && Array.isArray(analyseIds) && analyseIds.length > 0) {
        // Vérifier que toutes les analyses existent et appartiennent au même patient
        const analyses = await Analyse.query()
          .whereIn('id', analyseIds)
          .where('patientId', patientId)
        
        if (analyses.length !== analyseIds.length) {
          throw AppException.badRequest('Certaines analyses sont introuvables ou n\'appartiennent pas à ce patient.')
        }

        // Créer les liens dans la table de liaison
        for (const analyseId of analyseIds) {
          await db.table('facture_analyses').insert({
            id: db.raw('gen_random_uuid()'),
            facture_id: facture.id,
            analyse_id: analyseId,
            created_at: DateTime.now().toSQL()
          })
        }
      }

      // Précharger les relations pour la réponse
      await facture.load('patient', (q) => q.preload('user'))
      if (analyseIds && Array.isArray(analyseIds) && analyseIds.length > 0) {
        await facture.load('analyses')
      }

      // Log d'audit - Création de facture
      const patientName = facture.patient?.user?.nomComplet || 'Patient'
      await AuditService.logInvoiceCreated(
        { auth, request, response } as HttpContext,
        facture.id,
        facture.numeroFacture,
        patientName,
        Number(facture.montantTotal)
      )

      const transformedFacture = FinanceTransformer.transformInvoice(facture, true)

      return response.status(201).json(
        ApiResponse.created(
          transformedFacture,
          'Facture créée avec succès.'
        )
      )
    } catch (error) {
      logger.error({ err: error, body: request.body() }, 'Erreur lors de la création de la facture')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la création de la facture.')
    }
  }

  // 6. Enregistrer un paiement pour une facture
  public async recordPayment({ params, request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const payload = await request.validateUsing(
        (await import('#validators/finance')).recordPaymentValidator
      )
      
      const { montant, methodePaiement, numeroTransaction, notes, typeTransaction } = payload

      // Validation
      if (!montant || montant <= 0) {
        throw AppException.badRequest('Le montant doit être supérieur à 0.')
      }

      const facture = await Facture.findOrFail(params.id, { client: trx })
      await facture.load('patient', (q) => q.preload('user'))

      // Vérifier que la facture n'est pas déjà complètement payée
      const montantRestantActuel = Number(facture.montantTotal) - Number(facture.montantPaye || 0)
      if (facture.statut === 'payee' || montantRestantActuel <= 0) {
        throw AppException.badRequest('Cette facture est déjà complètement payée.')
      }

      if (facture.statut === 'annulee') {
        throw AppException.badRequest('Cette facture est annulée, aucun paiement ne peut être enregistré.')
      }

      // Calculer le nouveau montant payé
      const nouveauMontantPaye = Number(facture.montantPaye) + Number(montant)
      const resteAPayer = Number(facture.montantTotal) - nouveauMontantPaye

      // Mettre à jour la facture
      facture.montantPaye = nouveauMontantPaye

      // Mettre à jour le statut
      if (resteAPayer <= 0) {
        facture.statut = 'payee'
        facture.datePaiementComplet = DateTime.now()
      } else if (facture.dateEcheance && DateTime.now() > facture.dateEcheance) {
        facture.statut = 'en_retard'
      } else {
        facture.statut = 'en_attente'
      }

      facture.useTransaction(trx)
      await facture.save()

      // Créer la transaction financière
      const transaction = await Transaction.create({
        factureId: facture.id,
        typeTransaction: typeTransaction || 'consultation',
        montant: Number(montant),
        methodePaiement: methodePaiement || 'especes',
        numeroTransaction: numeroTransaction || null,
        dateTransaction: DateTime.now(),
        notes: notes || null
      }, { client: trx })

      await trx.commit()
      await CacheService.deleteAsync('finance:overview')

      // Log d'audit - Paiement reçu
      const patientName = facture.patient?.user?.nomComplet
      await AuditService.logPaymentReceived(
        { auth, request, response } as HttpContext,
        transaction.id,
        facture.numeroFacture,
        Number(montant),
        methodePaiement || 'especes',
        patientName
      )

      // Notification si paiement complet
      if (facture.statut === 'payee') {
        await NotificationService.notifyInvoicePaid(
          facture.patientId,
          facture.id,
          facture.numeroFacture,
          facture.montantTotal
        )
      }

      return response.json(ApiResponse.success({
        facture: FinanceTransformer.transformInvoice(facture, true),
        transaction: FinanceTransformer.transformTransaction(transaction, false),
        resteAPayer: resteAPayer > 0 ? resteAPayer : 0
      }, 'Paiement enregistré avec succès.'))

    } catch (error) {
      await trx.rollback()
      
      // Si c'est une erreur de validation (422), la laisser passer telle quelle
      // Les erreurs de validation sont gérées automatiquement par AdonisJS
      if ((error as any)?.code === 'E_VALIDATION_ERROR' || (error as any)?.status === 422) {
        throw error
      }
      
      logger.error({ 
        err: error, 
        factureId: params.id,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      }, 'Erreur lors de l\'enregistrement du paiement')
      
      if (error instanceof AppException) {
        throw error
      }
      
      // Inclure le message d'erreur original si disponible
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      throw AppException.internal(`Erreur lors de l'enregistrement du paiement: ${errorMessage}`)
    }
  }

  // 7. Mettre à jour une facture
  public async update({ params, request, response, auth }: HttpContext) {
    try {
      const facture = await Facture.findOrFail(params.id)
      const data = await request.validateUsing(
        (await import('#validators/finance')).updateInvoiceValidator
      )

      // Si montantTotal change, recalculer montantTva si nécessaire
      if (data.montantTotal !== undefined) {
        const montantHt = data.montantHt ?? facture.montantHt ?? data.montantTotal
        const tauxTva = data.tauxTva ?? facture.tauxTva ?? 0
        const montantTva = Number((Number(montantHt) * tauxTva / 100).toFixed(2))
        
        facture.montantTotal = Number(data.montantTotal)
        facture.montantHt = Number(montantHt)
        facture.tauxTva = tauxTva
        facture.montantTva = montantTva
      }

      if (data.montantPaye !== undefined) facture.montantPaye = Number(data.montantPaye)
      if (data.statut !== undefined) facture.statut = data.statut
      if (data.dateEcheance !== undefined) {
        facture.dateEcheance = data.dateEcheance 
          ? (typeof data.dateEcheance === 'string' 
              ? DateTime.fromISO(data.dateEcheance) 
              : DateTime.fromJSDate(data.dateEcheance)) 
          : null
      }
      if (data.notes !== undefined) facture.notes = data.notes
      if (data.remise !== undefined) facture.remise = Number(data.remise)
      if (data.tauxRemise !== undefined) facture.tauxRemise = Number(data.tauxRemise)
      if (data.adresseFacturation !== undefined) facture.adresseFacturation = data.adresseFacturation
      if (data.modeReglement !== undefined) facture.modeReglement = data.modeReglement
      if (data.referenceClient !== undefined) facture.referenceClient = data.referenceClient
      if (data.motifAnnulation !== undefined) {
        facture.motifAnnulation = data.motifAnnulation
        if (data.motifAnnulation) {
          facture.statut = 'annulee'
        }
      }

      await facture.save()
      await CacheService.deleteAsync('finance:overview')
      await facture.load('patient', (q) => q.preload('user'))

      // Log d'audit - Facture modifiée
      await AuditService.logInvoiceUpdated(
        { auth, request, response } as HttpContext,
        facture.id,
        facture.numeroFacture,
        data
      )
      
      // Log d'audit - Remise appliquée si présente
      if (data.remise && Number(data.remise) > 0) {
        await AuditService.logDiscountApplied(
          { auth, request, response } as HttpContext,
          facture.id,
          facture.numeroFacture,
          Number(data.remise),
          data.tauxRemise ? 'pourcentage' : 'montant',
          'Remise appliquée lors de la modification'
        )
      }

      return response.json(ApiResponse.success(
        FinanceTransformer.transformInvoice(facture, true),
        'Facture mise à jour avec succès.'
      ))

    } catch (error) {
      logger.error({ err: error, factureId: params.id }, 'Erreur lors de la mise à jour de la facture')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la mise à jour de la facture.')
    }
  }

  // 8. Exporter une facture en PDF
  public async exportPdf({ params, response, auth }: HttpContext) {
    try {
      const facture = await Facture.query()
        .where('id', params.id)
        .preload('patient', (q) => q.preload('user'))
        .preload('consultation')
        .preload('analyses')
        .firstOrFail()

      // Générer le PDF
      const pdfBytes = await InvoicePDFService.generateInvoicePDF(facture)

      // Log d'audit - Envoi de facture (génération PDF considérée comme envoi)
      const patientName = facture.patient?.user?.nomComplet || 'Patient'
      const user = auth?.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      await AuditService.logInvoiceSent(
        { auth, request: {} as any, response } as HttpContext,
        facture.id,
        facture.numeroFacture,
        patientName,
        userName
      )

      // Définir les en-têtes pour le téléchargement
      response.header('Content-Type', 'application/pdf')
      response.header('Content-Disposition', `attachment; filename="facture-${facture.numeroFacture}.pdf"`)
      
      return response.send(Buffer.from(pdfBytes))
      
    } catch (error: any) {
      logger.error({ err: error, factureId: params.id }, 'Erreur lors de l\'export PDF de la facture')
      if (error.code === 'E_ROW_NOT_FOUND') {
        throw AppException.notFound('Facture')
      }
      throw AppException.internal('Erreur lors de l\'export de la facture en PDF.')
    }
  }

  // 9. Graphique des revenus
  public async chart({ response, auth }: HttpContext) {
    try {
      // On utilise la table transactions pour le vrai cash-flow
      const chartData = await db.rawQuery(`
        SELECT 
          TO_CHAR(date_transaction, 'Mon') as month,
          SUM(montant) as revenue
        FROM transactions_financieres 
        WHERE date_transaction >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(date_transaction, 'Mon'), DATE_TRUNC('month', date_transaction)
        ORDER BY DATE_TRUNC('month', date_transaction) ASC
      `)

      const formatted = chartData.rows.map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        // Simulation des dépenses pour le graphique (60% des revenus)
        expenses: parseFloat(row.revenue) * 0.6,
        profit: parseFloat(row.revenue) * 0.4
      }))

      // Log d'audit - Génération de rapport de revenus
      const totalRevenue = formatted.reduce((sum, item) => sum + item.revenue, 0)
      const user = auth?.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      await AuditService.logRevenueReportGenerated(
        { auth, request: {} as any, response } as HttpContext,
        `chart-${DateTime.now().toFormat('yyyyMMdd-HHmmss')}`,
        'Graphique revenus',
        '6 derniers mois',
        totalRevenue,
        userName
      )

      return response.json(ApiResponse.success(formatted))
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de la récupération des données du graphique des revenus')
      throw AppException.internal('Erreur lors du chargement du graphique des revenus.')
    }
  }

  // 10. Créer un remboursement
  public async refund({ params, request, response, auth }: HttpContext) {
    try {
      const { montant, reason } = request.only(['montant', 'reason'])
      
      if (!montant || montant <= 0) {
        throw AppException.badRequest('Le montant doit être supérieur à 0.')
      }

      const facture = await Facture.findOrFail(params.id)
      await facture.load('patient', (q) => q.preload('user'))

      // Vérifier qu'il y a assez de montant payé pour rembourser
      if (Number(facture.montantPaye) < Number(montant)) {
        throw AppException.badRequest('Le montant du remboursement ne peut pas dépasser le montant payé.')
      }

      // Mettre à jour le montant payé
      facture.montantPaye = Number(facture.montantPaye) - Number(montant)
      
      // Mettre à jour le statut si nécessaire
      if (facture.montantPaye < facture.montantTotal) {
        facture.statut = facture.dateEcheance && DateTime.now() > facture.dateEcheance 
          ? 'en_retard' 
          : 'en_attente'
      }
      
      await facture.save()
      await CacheService.deleteAsync('finance:overview')

      // Log d'audit - Remboursement
      const patientName = facture.patient?.user?.nomComplet
      await AuditService.logPaymentRefunded(
        { auth, request, response } as HttpContext,
        `refund-${facture.id}-${DateTime.now().toFormat('yyyyMMdd')}`,
        facture.numeroFacture,
        Number(montant),
        reason || 'Non spécifiée',
        patientName
      )

      return response.json(ApiResponse.success(
        FinanceTransformer.transformInvoice(facture, true),
        'Remboursement effectué avec succès.'
      ))
    } catch (error: any) {
      logger.error({ err: error, factureId: params.id }, 'Erreur lors du remboursement')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors du remboursement.')
    }
  }

  // 11. Enregistrer une dépense
  public async recordExpense({ request, response, auth }: HttpContext) {
    try {
      const { category, amount, description } = request.only(['category', 'amount', 'description'])
      
      if (!category || !amount || amount <= 0) {
        throw AppException.badRequest('La catégorie et le montant sont requis.')
      }

      const user = auth.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      
      // Pour l'instant, on log seulement (pas de table dépenses)
      const expenseId = `expense-${DateTime.now().toFormat('yyyyMMdd-HHmmss')}`
      
      await AuditService.logExpenseRecorded(
        { auth, request, response } as HttpContext,
        expenseId,
        category,
        Number(amount),
        description || 'Dépense enregistrée',
        userName
      )

      return response.json(ApiResponse.success(
        { id: expenseId, category, amount, description },
        'Dépense enregistrée avec succès.'
      ))
    } catch (error: any) {
      logger.error({ err: error }, 'Erreur lors de l\'enregistrement de la dépense')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de l\'enregistrement de la dépense.')
    }
  }

  // 12. Créer un plan de paiement
  public async createPaymentPlan({ params, request, response, auth }: HttpContext) {
    try {
      const { installments } = request.only(['installments'])
      
      if (!installments || installments < 2) {
        throw AppException.badRequest('Le nombre de mensualités doit être au moins 2.')
      }

      const facture = await Facture.findOrFail(params.id)
      await facture.load('patient', (q) => q.preload('user'))

      const resteAPayer = Number(facture.montantTotal) - Number(facture.montantPaye)
      
      if (resteAPayer <= 0) {
        throw AppException.badRequest('La facture est déjà entièrement payée.')
      }

      const user = auth.user as any
      const userName = user?.nomComplet || user?.email || 'Système'
      const patientName = facture.patient?.user?.nomComplet || 'Patient'
      const planId = `plan-${facture.id}-${DateTime.now().toFormat('yyyyMMdd')}`

      // Log d'audit - Plan de paiement créé
      await AuditService.logPaymentPlanCreated(
        { auth, request, response } as HttpContext,
        planId,
        patientName,
        resteAPayer,
        installments,
        userName
      )

      return response.json(ApiResponse.success(
        { 
          planId, 
          totalAmount: resteAPayer, 
          installments, 
          monthlyAmount: (resteAPayer / installments).toFixed(2) 
        },
        'Plan de paiement créé avec succès.'
      ))
    } catch (error: any) {
      logger.error({ err: error, factureId: params.id }, 'Erreur lors de la création du plan de paiement')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la création du plan de paiement.')
    }
  }

  // 13. Créer une demande de remboursement d'assurance
  public async createInsuranceClaim({ params, request, response, auth }: HttpContext) {
    try {
      const { insuranceName, claimAmount } = request.only(['insuranceName', 'claimAmount'])
      
      if (!insuranceName || !claimAmount || claimAmount <= 0) {
        throw AppException.badRequest('Le nom de l\'assurance et le montant sont requis.')
      }

      const facture = await Facture.findOrFail(params.id)
      await facture.load('patient', (q) => q.preload('user'))

      const patientName = facture.patient?.user?.nomComplet || 'Patient'
      const claimNumber = `CLAIM-${DateTime.now().toFormat('yyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      const claimId = `claim-${facture.id}-${DateTime.now().toFormat('yyyyMMdd')}`

      // Log d'audit - Demande d'assurance créée
      await AuditService.logInsuranceClaimCreated(
        { auth, request, response } as HttpContext,
        claimId,
        claimNumber,
        patientName,
        insuranceName,
        Number(claimAmount)
      )

      return response.json(ApiResponse.success(
        { 
          claimId, 
          claimNumber, 
          insuranceName, 
          amount: claimAmount,
          status: 'en_attente' 
        },
        'Demande de remboursement d\'assurance créée avec succès.'
      ))
    } catch (error: any) {
      logger.error({ err: error, factureId: params.id }, 'Erreur lors de la création de la demande d\'assurance')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la création de la demande d\'assurance.')
    }
  }

  // 14. Mettre à jour une demande de remboursement d'assurance
  public async updateInsuranceClaim({ params, request, response, auth }: HttpContext) {
    try {
      const { status, notes } = request.only(['status', 'notes'])
      
      if (!status) {
        throw AppException.badRequest('Le statut est requis.')
      }

      const claimId = params.claimId
      const claimNumber = `CLAIM-${claimId}`

      // Log d'audit - Demande d'assurance mise à jour
      await AuditService.logInsuranceClaimUpdated(
        { auth, request, response } as HttpContext,
        claimId,
        claimNumber,
        status,
        { status, notes }
      )

      return response.json(ApiResponse.success(
        { claimId, claimNumber, status, notes },
        'Demande de remboursement d\'assurance mise à jour avec succès.'
      ))
    } catch (error: any) {
      logger.error({ err: error, claimId: params.claimId }, 'Erreur lors de la mise à jour de la demande d\'assurance')
      if (error instanceof AppException) {
        throw error
      }
      throw AppException.internal('Erreur lors de la mise à jour de la demande d\'assurance.')
    }
  }
}