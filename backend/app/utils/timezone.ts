import { DateTime } from 'luxon'

export const BUSINESS_TIMEZONE = process.env.TZ || 'Africa/Kinshasa'

export const nowInBusinessTimezone = () => DateTime.now().setZone(BUSINESS_TIMEZONE)

export const formatBusinessDateTime = (date: DateTime) =>
  date.setZone(BUSINESS_TIMEZONE).toFormat("dd/MM/yyyy 'à' HH:mm")
