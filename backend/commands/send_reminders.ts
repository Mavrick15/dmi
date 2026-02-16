import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import ReminderService from '#services/ReminderService'

export default class SendReminders extends BaseCommand {
  static commandName = 'reminders:send'
  static description = 'Envoyer les rappels de rendez-vous'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.number({ alias: 'h', description: 'Heures avant le rendez-vous (défaut: 24)' })
  declare hours: number

  @flags.boolean({ alias: 'd', description: 'Rappels quotidiens (demain)' })
  declare daily: boolean

  async run() {
    if (this.daily) {
      this.logger.info('📧 Envoi des rappels quotidiens...')
      await ReminderService.sendDailyReminders()
      this.logger.success('✅ Rappels quotidiens envoyés')
    } else {
      const hours = this.hours || 24
      this.logger.info(`📧 Envoi des rappels pour les rendez-vous dans ${hours} heures...`)
      await ReminderService.sendHourlyReminders(hours)
      this.logger.success(`✅ Rappels envoyés`)
    }
  }
}

