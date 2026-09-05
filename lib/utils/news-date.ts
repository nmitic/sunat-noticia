import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Absolute publication date, spelled out. "Hoy"/"Ayer" replace the date for
 * recent items, where the weekday matters more than the numeral.
 *
 * Shared by the feed card and the article page so a date never reads
 * differently in the two places.
 */
export function formatAbsoluteDate(date: Date): string {
  const time = format(date, 'HH:mm', { locale: es });

  if (isToday(date)) return `Hoy, ${time}`;
  if (isYesterday(date)) return `Ayer, ${time}`;

  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}

/** Full date with no "hoy"/"ayer" shortcut, for tooltips and metadata. */
export function formatFullDate(date: Date): string {
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
}
