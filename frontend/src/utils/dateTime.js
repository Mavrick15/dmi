const BUSINESS_TIMEZONE = import.meta.env.VITE_TIMEZONE || 'Africa/Kinshasa';

const dateFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const timeFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const monthYearFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  month: 'long',
  year: 'numeric',
});

const longDateFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const shortDateTimeFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const weekdayDateFormatterFr = new Intl.DateTimeFormat('fr-FR', {
  timeZone: BUSINESS_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const numberFormatterFr = new Intl.NumberFormat('fr-FR');

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const nowPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const getNowParts = () => {
  const parts = nowPartsFormatter.formatToParts(new Date());
  const pick = (type) => parts.find((p) => p.type === type)?.value || '00';
  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    time: `${pick('hour')}:${pick('minute')}`,
  };
};

export const getBusinessTimezone = () => BUSINESS_TIMEZONE;
export const getTodayInBusinessTimezone = () => dayKeyFormatter.format(new Date());
export const toBusinessDateKey = (dateLike) => dayKeyFormatter.format(new Date(dateLike));
export const formatDateInBusinessTimezone = (dateStr) =>
  dateStr ? dateFormatterFr.format(new Date(dateStr)) : '';
export const formatTimeInBusinessTimezone = (dateStr) =>
  dateStr ? timeFormatterFr.format(new Date(dateStr)) : '';
export const formatDateTimeInBusinessTimezone = (dateStr) =>
  dateStr ? dateTimeFormatterFr.format(new Date(dateStr)) : '';
export const formatShortDateTimeInBusinessTimezone = (dateLike) =>
  dateLike ? shortDateTimeFormatterFr.format(new Date(dateLike)) : '';
export const formatMonthYearInBusinessTimezone = (dateLike) =>
  monthYearFormatterFr.format(new Date(dateLike));
export const formatLongDateInBusinessTimezone = (dateLike) =>
  longDateFormatterFr.format(new Date(dateLike));
export const formatShortDateInBusinessTimezone = (dateLike) =>
  shortDateFormatterFr.format(new Date(dateLike));
export const formatWeekdayDateInBusinessTimezone = (dateLike) =>
  weekdayDateFormatterFr.format(new Date(dateLike));
export const formatNumberInFrenchLocale = (value) =>
  numberFormatterFr.format(Number(value || 0));

export const addDaysToBusinessDateKey = (dateKey, days) => {
  if (!dateKey) return '';
  const [year, month, day] = String(dateKey)
    .split('-')
    .map((value) => Number.parseInt(value, 10));
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return dayKeyFormatter.format(date);
};

export const isSlotInPastBusinessTimezone = (dateStr, timeStr) => {
  const now = getNowParts();
  if (dateStr < now.date) return true;
  if (dateStr > now.date) return false;
  return timeStr <= now.time;
};

export const getBusinessHour = () => {
  const now = nowPartsFormatter.formatToParts(new Date());
  const hour = now.find((p) => p.type === 'hour')?.value || '00';
  return Number.parseInt(hour, 10);
};
