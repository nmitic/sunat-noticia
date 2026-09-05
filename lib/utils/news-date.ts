import { format, isSameDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { TZDate } from '@date-fns/tz';

/**
 * Every date on this site is a Peruvian date.
 *
 * The readers are contribuyentes in Peru and the source notices state their
 * hours in Lima time, so a maintenance window announced for 21:00 has to read
 * as 21:00 no matter where the server runs. Formatting a bare Date would use
 * the server's own zone — UTC in production — turning that window into 02:00
 * the following day, wrong on both the hour and the date.
 *
 * Lima is UTC-5 year-round with no DST, matching the fixed LIMA_OFFSET the
 * outage parser writes into its timestamps.
 */
export const LIMA_TIME_ZONE = 'America/Lima';

/** The same instant, seen from Lima. */
export function toLima(date: Date): TZDate {
  return new TZDate(date, LIMA_TIME_ZONE);
}

/** "Now" as a Lima wall clock, for comparing calendar days. */
function limaNow(): TZDate {
  return new TZDate(new Date(), LIMA_TIME_ZONE);
}

/**
 * Absolute publication date, spelled out. "Hoy"/"Ayer" replace the date for
 * recent items, where the weekday matters more than the numeral.
 *
 * Shared by the feed card and the article page so a date never reads
 * differently in the two places.
 */
export function formatAbsoluteDate(date: Date): string {
  const lima = toLima(date);
  const time = format(lima, 'HH:mm', { locale: es });

  // date-fns' isToday/isYesterday compare against the *server's* today, which
  // is a different calendar day from Lima's for five hours of every day.
  const today = limaNow();

  if (isSameDay(lima, today)) return `Hoy, ${time}`;
  if (isSameDay(lima, subDays(today, 1))) return `Ayer, ${time}`;

  return format(lima, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}

/** Full date with no "hoy"/"ayer" shortcut, for tooltips and metadata. */
export function formatFullDate(date: Date): string {
  return format(toLima(date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}
