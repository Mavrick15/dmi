import logger from '@adonisjs/core/services/logger'
import RendezVous from '#models/RendezVous'
import NotificationService from '#services/NotificationService'
import AuditService from '#services/AuditService'
import { formatBusinessDateTime, nowInBusinessTimezone } from '../utils/timezone.js'

class AppointmentExpirationService {
  private started = false
  private running = false
  private timer: NodeJS.Timeout | null = null

  public start(intervalMs: number = 1000): void {
    if (this.started) return
    this.started = true

    this.timer = setInterval(() => {
      void this.runCycle()
    }, intervalMs)

    // Évite de bloquer l'extinction du process en dev/watch.
    this.timer.unref?.()

    // Lancer un premier cycle immédiatement au démarrage.
    void this.runCycle()
    logger.info(`⏱️ Surveillance RDV expirés activée (${intervalMs}ms)`)
  }

  public async runCycle(): Promise<number> {
    if (this.running) return 0
    this.running = true

    const now = nowInBusinessTimezone()

    try {
      const expiredAppointments = await RendezVous.query()
        .whereIn('statut', ['programme', 'en_cours'])
        .whereRaw(
          // Règle métier demandée : dès que l'heure du RDV est dépassée,
          // le statut passe à "annule" (sans attendre la durée).
          `date_heure <= ?`,
          [now.toSQL()!]
        )
        .exec()

      let cancelledCount = 0

      for (const appointment of expiredAppointments) {
        await appointment.load('patient', (q) => q.preload('user'))
        await appointment.load('medecin', (q) => q.preload('user'))

        appointment.statut = 'annule'
        const autoCancelReason = 'heure de rendez-vous dépassée'
        const autoCancelNote = `Annulé automatiquement : ${autoCancelReason}`
        appointment.motifAnnulation = autoCancelReason
        appointment.annulePar = 'system_auto'
        appointment.dateAnnulation = now
        appointment.notes = appointment.notes
          ? `${appointment.notes}\n[${formatBusinessDateTime(now)}] ${autoCancelNote}`
          : `[${formatBusinessDateTime(now)}] ${autoCancelNote}`
        await appointment.save()

        const patientName = appointment.patient?.user?.nomComplet || 'Patient'
        const doctorName = appointment.medecin?.user?.nomComplet || 'Médecin'
        const appointmentDate = formatBusinessDateTime(appointment.dateHeure)

        await AuditService.logAppointmentMissed(
          null,
          appointment.id,
          patientName,
          doctorName,
          appointmentDate,
          'Système (auto-annulation)'
        )

        if (appointment.medecin?.userId) {
          await NotificationService.notifyAppointmentCancelled(
            appointment.patient?.userId || null,
            appointment.id,
            appointmentDate,
            doctorName,
            appointment.medecin.userId,
            autoCancelReason,
            true
          )
        }

        cancelledCount++
      }

      if (cancelledCount > 0) {
        logger.info(`✅ ${cancelledCount} rendez-vous expirés annulés (surveillance 1s)`)
      }

      return cancelledCount
    } catch (error) {
      logger.error({ err: error }, "Erreur lors de l'auto-annulation des rendez-vous expirés")
      return 0
    } finally {
      this.running = false
    }
  }
}

export default new AppointmentExpirationService()
