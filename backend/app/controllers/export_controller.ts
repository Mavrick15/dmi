import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import ExportService from '#services/ExportService'
import AuditService from '#services/AuditService'
import { DateTime } from 'luxon'

/**
 * Contrôleur pour les exports de données
 */
export default class ExportController {
  /**
   * Exporter les patients en CSV
   * @route GET /api/v1/export/patients
   * @access Admin, Gestionnaire
   */
  async exportPatients({ request, response, auth }: HttpContext) {
    try {
      const { startDate, endDate } = request.only(['startDate', 'endDate'])

      // Validation des dates si fournies
      if (startDate) {
        const start = DateTime.fromISO(startDate)
        if (!start.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de début invalide'
          })
        }
      }

      if (endDate) {
        const end = DateTime.fromISO(endDate)
        if (!end.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de fin invalide'
          })
        }
      }

      const csv = await ExportService.exportPatientsToCSV({
        startDate: startDate ? DateTime.fromISO(startDate) : undefined,
        endDate: endDate ? DateTime.fromISO(endDate) : undefined,
      })

      const filename = `patients_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')

      // Log d'audit - Export de données
      const period = startDate && endDate 
        ? `du ${DateTime.fromISO(startDate).toFormat('dd/MM/yyyy')} au ${DateTime.fromISO(endDate).toFormat('dd/MM/yyyy')}`
        : 'toutes périodes'
      await AuditService.logDataExported(
        { auth, request, response } as HttpContext,
        'patients',
        'CSV',
        filename,
        period
      )

      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'export des patients')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'export des patients.'
      })
    }
  }

  /**
   * Exporter les consultations en CSV
   * @route GET /api/v1/export/consultations
   * @access Admin, Gestionnaire, Docteur
   */
  async exportConsultations({ request, response, auth }: HttpContext) {
    try {
      const { startDate, endDate, medecinId } = request.only([
        'startDate',
        'endDate',
        'medecinId',
      ])

      // Validation des dates si fournies
      if (startDate) {
        const start = DateTime.fromISO(startDate)
        if (!start.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de début invalide'
          })
        }
      }

      if (endDate) {
        const end = DateTime.fromISO(endDate)
        if (!end.isValid) {
          return response.badRequest({
            success: false,
            message: 'Format de date de fin invalide'
          })
        }
      }

      const csv = await ExportService.exportConsultationsToCSV({
        startDate: startDate ? DateTime.fromISO(startDate) : undefined,
        endDate: endDate ? DateTime.fromISO(endDate) : undefined,
        medecinId,
      })

      const filename = `consultations_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')

      // Log d'audit - Export de données
      const period = startDate && endDate 
        ? `du ${DateTime.fromISO(startDate).toFormat('dd/MM/yyyy')} au ${DateTime.fromISO(endDate).toFormat('dd/MM/yyyy')}`
        : 'toutes périodes'
      const filters = medecinId ? `, médecin: ${medecinId}` : ''
      await AuditService.logDataExported(
        { auth, request, response } as HttpContext,
        'consultations',
        'CSV',
        filename,
        `${period}${filters}`
      )

      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'export des consultations')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'export des consultations.'
      })
    }
  }

  /**
   * Exporter les factures en CSV
   * @route GET /api/v1/export/invoices
   * @access Admin, Gestionnaire
   */
  async exportInvoices({ request, response, auth }: HttpContext) {
    const { startDate, endDate, statut } = request.only(['startDate', 'endDate', 'statut'])

    const csv = await ExportService.exportInvoicesToCSV({
      startDate: startDate ? DateTime.fromISO(startDate) : undefined,
      endDate: endDate ? DateTime.fromISO(endDate) : undefined,
      statut,
    })

      const filename = `factures_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')

      // Log d'audit - Export de données
      const period = startDate && endDate 
        ? `du ${DateTime.fromISO(startDate).toFormat('dd/MM/yyyy')} au ${DateTime.fromISO(endDate).toFormat('dd/MM/yyyy')}`
        : 'toutes périodes'
      const filters = statut ? `, statut: ${statut}` : ''
      await AuditService.logDataExported(
        { auth, request, response } as HttpContext,
        'factures',
        'CSV',
        filename,
        `${period}${filters}`
      )

      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
  }

  /**
   * Exporter les utilisateurs en CSV
   * @route GET /api/v1/export/users
   * @access Admin
   */
  async exportUsers({ response }: HttpContext) {
    try {
      const csv = await ExportService.exportUsersToCSV()
      const filename = `users_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')
      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'export des utilisateurs')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'export des utilisateurs.'
      })
    }
  }

  /**
   * Exporter les établissements en CSV
   * @route GET /api/v1/export/establishments
   * @access Admin
   */
  async exportEstablishments({ response }: HttpContext) {
    try {
      const csv = await ExportService.exportEstablishmentsToCSV()
      const filename = `establishments_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')
      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'export des établissements')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'export des établissements.'
      })
    }
  }

  /**
   * Exporter les logs d'audit en CSV
   * @route GET /api/v1/export/audit
   * @access Admin
   */
  async exportAudit({ request, response }: HttpContext) {
    try {
      const { startDate, endDate, action, userId } = request.only(['startDate', 'endDate', 'action', 'userId'])
      
      const csv = await ExportService.exportAuditLogsToCSV({
        startDate: startDate ? DateTime.fromISO(startDate) : undefined,
        endDate: endDate ? DateTime.fromISO(endDate) : undefined,
        action,
        userId
      })
      
      const filename = `audit_export_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}`
      const filepath = await ExportService.saveExport(csv, filename, 'csv')
      response.header('Content-Disposition', `attachment; filename="${filename}.csv"`)
      return response.download(filepath)
    } catch (error) {
      logger.error({ err: error }, 'Erreur lors de l\'export des logs d\'audit')
      return response.internalServerError({
        success: false,
        message: 'Erreur lors de l\'export des logs d\'audit.'
      })
    }
  }
}

