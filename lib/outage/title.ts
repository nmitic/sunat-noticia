import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { StructuredOutage } from './types';

/**
 * The headline to show for a news item: the generated outage title when the
 * item has approved structured data, otherwise the scraped one.
 *
 * Every surface that renders a title goes through this so the feed, the
 * article page, the tab title and the share card never disagree.
 */
export function displayTitle(news: {
  title: string;
  structuredData?: StructuredOutage | null;
}): string {
  if (!news.structuredData) return news.title;

  return outageTitle(news.structuredData) ?? news.title;
}

/**
 * A headline for an outage notice, built from the approved structured data.
 *
 * The scraped title is only ever the notice's first sentence — these pages
 * carry no real headline (see `deriveTitle` in the mensajes scraper) — so an
 * outage item ends up titled "Le informamos que desde las 21:00 p. m. del
 * sábado 05/09 hasta las 07...". Once an admin has approved the extraction we
 * know what the notice actually says, so we can write a proper headline.
 *
 * Returns null when there is too little to say something better than the
 * original, in which case the caller keeps the scraped title.
 */
export function outageTitle(data: StructuredOutage): string | null {
  const lead = LEAD[data.kind];
  if (!lead) return null;

  const services = describeServices(data.services);
  const subject = services ? `${lead} en ${services}` : lead;

  const when = describeWhen(data);

  return when ? `${subject} — ${when}` : subject;
}

const LEAD: Record<StructuredOutage['kind'], string | null> = {
  MANTENIMIENTO: 'Mantenimiento programado',
  INTERMITENCIA: 'Intermitencia',
  INDISPONIBILIDAD: 'Servicios no disponibles',
  // Nothing was classified, so there is no honest headline to write.
  DESCONOCIDO: null,
};

/**
 * Name one or two services; beyond that a count reads better than a list that
 * would be truncated mid-phrase anyway.
 */
function describeServices(services: string[]): string | null {
  const named = services.map((service) => service.trim()).filter(Boolean);

  if (named.length === 0) return null;
  if (named.length === 1) return named[0];
  if (named.length === 2) return `${named[0]} y ${named[1]}`;

  return `${named[0]} y ${named.length - 1} servicios más`;
}

/** The window, phrased for a headline rather than a data row. */
function describeWhen(data: StructuredOutage): string | null {
  if (data.inProgress) return 'en curso';
  if (!data.startsAt) return null;

  const starts = new Date(data.startsAt);
  if (Number.isNaN(starts.getTime())) return null;

  // date-fns with the `es` locale, matching every other date on the site — the
  // summary panel right below this headline formats the same instant, and the
  // two must not disagree about how to spell the month.
  return `${format(starts, "d 'de' MMMM, HH:mm", { locale: es })} h`;
}
