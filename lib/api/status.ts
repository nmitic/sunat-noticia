/**
 * The one place the site's current status is assembled.
 *
 * Three callers need the same two round trips and the same `computeStatus`
 * call — the status page at `/`, the estado embed, and the public status API —
 * so the dance lives here rather than three times over.
 *
 * Deliberately in `lib/api/` and not `lib/outage/`: this imports the query
 * layer, and `lib/outage/status.ts` must stay free of any database import so
 * `npm test` keeps running with no environment at all.
 */

import { computeStatus, type SiteStatus } from '@/lib/outage/status';
import type { StructuredOutage } from '@/lib/outage/types';
import { newsPath } from '@/lib/utils/news-url';
import { queryLastNewsAt, queryOutageCandidates } from './status-query';

export type LoadedSiteStatus = {
  status: SiteStatus;
  lastNewsAt: Date | null;
  unreviewedCount: number;
};

/**
 * The status at `now`, with the two extra numbers `StatusHero` needs.
 *
 * `now` arrives as a parameter rather than being read from the clock here, so a
 * caller that also renders an incident history evaluates both against one
 * instant — two clocks on one page could show an incident as "en curso" in the
 * history while the hero had already called it clear.
 */
export async function loadSiteStatus(now: Date): Promise<LoadedSiteStatus> {
  // Concurrent: neither query depends on the other, and the pool caps at 3 so
  // two never queue.
  const [candidates, lastNewsAt] = await Promise.all([
    queryOutageCandidates(),
    queryLastNewsAt(),
  ]);

  return {
    status: computeStatus(candidates.items, now),
    lastNewsAt,
    unreviewedCount: candidates.unreviewedCount,
  };
}

/* ------------------------------ public JSON ------------------------------ */

/**
 * Absolute base for the links the API hands out.
 *
 * The rendered embed gets away with relative paths because the iframe's own
 * document supplies the base. A JSON consumer holds a bare string with no
 * document at all, so these have to carry the origin.
 *
 * Mirrors the resolution order in `app/layout.tsx`, which keeps its copy
 * private: importing it would pull `globals.css` and `@vercel/analytics` into
 * an API route for the sake of four lines.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://sunat-noticias.perunio.pe';
}

/** An outage notice as the public API renders it. Every date is ISO 8601. */
export type PublicOutageItem = {
  id: string;
  /**
   * The stored title, straight from the scraper. It can be a sentence fragment
   * when the notice's kind was never determined — render `structuredData` for
   * the readable version.
   */
  title: string;
  /** The notice on SUNAT's own site. Null when the scraper found no link. */
  sourceUrl: string | null;
  /** Absolute URL of our page for this notice. */
  url: string;
  originalDate: string;
  /** Already JSON-safe: strings, booleans and string arrays throughout. */
  structuredData: StructuredOutage;
};

export type PublicStatusResponse = {
  level: SiteStatus['level'];
  /** The one outage that decided `level`. Null when nothing is active. */
  primary: PublicOutageItem | null;
  /** Every active outage, most severe first. `primary` is `active[0]`. */
  active: PublicOutageItem[];
  /** Announced windows that have not started yet, soonest first. */
  upcoming: PublicOutageItem[];
  /** Deduped union of the service names across `active`. */
  affectedServices: string[];
  /** The instant this was evaluated. */
  evaluatedAt: string;
  /** When we last heard anything from SUNAT. Null when nothing is published. */
  lastNewsAt: string | null;
  /**
   * Outage notices nobody has reviewed yet. They carry no window, so they
   * cannot be placed in time and are reported as a count rather than folded
   * into `level`.
   */
  unreviewedCount: number;
};

function toPublicOutageItem(item: SiteStatus['active'][number]): PublicOutageItem {
  return {
    id: item.id,
    title: item.title,
    sourceUrl: item.sourceUrl,
    url: `${siteUrl()}${newsPath(item)}`,
    originalDate: item.originalDate.toISOString(),
    structuredData: item.structuredData,
  };
}

export function toPublicStatus(loaded: LoadedSiteStatus): PublicStatusResponse {
  const { status, lastNewsAt, unreviewedCount } = loaded;

  return {
    level: status.level,
    primary: status.primary ? toPublicOutageItem(status.primary) : null,
    active: status.active.map(toPublicOutageItem),
    upcoming: status.upcoming.map(toPublicOutageItem),
    affectedServices: status.affectedServices,
    evaluatedAt: status.evaluatedAt.toISOString(),
    lastNewsAt: lastNewsAt?.toISOString() ?? null,
    unreviewedCount,
  };
}
