import RendezVous from '#models/RendezVous'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'

/**
 * Service pour gérer les rappels automatiques
 */
export default class ReminderService {
  /**
   * Envoyer des rappels pour les rendez-vous du jour
   */
  static async sendDailyReminders() {
    const today = DateTime.now().startOf('day')
    const tomorrow = today.plus({ days: 1 })

    // Récupérer les rendez-vous de demain
    const appointments = await RendezVous.query()
      .whereBetween('date_heure', [today.toSQL(), tomorrow.toSQL()])
      .where('statut', 'programme')
      .preload('patient', (q) => q.preload('user'))
      .preload('medecin', (q) => q.preload('user'))

    logger.info(`Envoi de ${appointments.length} rappels de rendez-vous`)

    for (const appointment of appointments) {
      try {
        const patientEmail = appointment.patient?.user?.email
        if (!patientEmail) continue

        await mail.send((message) => {
          message
            .to(patientEmail)
            .from(process.env.SMTP_FROM || 'noreply@openclinic.cd')
            .subject('Rappel: Rendez-vous médical demain')
            .html(`
              <h3>Bonjour ${appointment.patient?.user?.nomComplet},</h3>
              <p>Ceci est un rappel pour votre rendez-vous médical :</p>
              <ul>
                <li><strong>Date:</strong> ${appointment.dateHeure.toFormat('dd/MM/yyyy')}</li>
                <li><strong>Heure:</strong> ${appointment.dateHeure.toFormat('HH:mm')}</li>
                <li><strong>Médecin:</strong> ${appointment.medecin?.user?.nomComplet}</li>
                <li><strong>Motif:</strong> ${appointment.motif}</li>
              </ul>
              <p>Merci de confirmer votre présence.</p>
            `)
        })

        logger.info(`Rappel envoyé à ${patientEmail}`)
      } catch (error) {
        logger.error({ err: error }, `Erreur lors de l'envoi du rappel pour le RDV ${appointment.id}`)
      }
    }
  }

  /**
   * Envoyer des rappels pour les rendez-vous dans X heures
   */
  static async sendHourlyReminders(hoursBefore: number = 24) {
    const targetTime = DateTime.now().plus({ hours: hoursBefore })
    const startTime = targetTime.startOf('hour')
    const endTime = targetTime.endOf('hour')

    const appointments = await RendezVous.query()
      .whereBetween('date_heure', [startTime.toSQL(), endTime.toSQL()])
      .where('statut', 'programme')
      .preload('patient', (q) => q.preload('user'))
      .preload('medecin', (q) => q.preload('user'))

    for (const appointment of appointments) {
      try {
        const patientEmail = appointment.patient?.user?.email
        if (!patientEmail) continue

        await mail.send((message) => {
          message
            .to(patientEmail)
            .from(process.env.SMTP_FROM || 'noreply@openclinic.cd')
            .subject(`Rappel: Rendez-vous dans ${hoursBefore} heures`)
            .html(`
              <h3>Bonjour ${appointment.patient?.user?.nomComplet},</h3>
              <p>Rappel : Votre rendez-vous médical est prévu dans ${hoursBefore} heures.</p>
              <ul>
                <li><strong>Date:</strong> ${appointment.dateHeure.toFormat('dd/MM/yyyy HH:mm')}</li>
                <li><strong>Médecin:</strong> ${appointment.medecin?.user?.nomComplet}</li>
              </ul>
            `)
        })
      } catch (error) {
        logger.error({ err: error }, `Erreur lors de l'envoi du rappel pour le RDV ${appointment.id}`)
      }
    }
  }
}

