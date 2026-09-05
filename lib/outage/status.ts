/**
 * Whether SUNAT's systems are down *right now*, as far as the published
 * comunicados say.
 *
 * Pure and synchronous, like `parseOutage` — `now` arrives as a parameter
 * rather than being read from the clock, so a status can be evaluated for any
 * instant and the tests never race. Nothing here touches the database: importing
 * `lib/db` would pull in a module that throws without `POSTGRES_URL`, which is
 * what keeps `npm test` runnable with no environment at all.
 *
 * The framing throughout is "what has been reported", never "what is true". We
 * see SUNAT's own notices and nothing else — no uptime probe — so the absence of
 * an incident is the absence of a *report*, and the copy says exactly that.
 */

import type { OutageKind, StructuredOutage } from './types';

export type StatusLevel =
  /** An INDISPONIBILIDAD is active: something is flatly unavailable. */
  | 'indisponible'
  /** An INTERMITENCIA is active: degraded, not down. */
  | 'degradado'
  /** Something is active but the notice never said what kind. */
  | 'incidencia'
  /** Only announced, planned work is running. */
  | 'mantenimiento'
  /** Nothing active was reported. Not a claim that SUNAT works. */
  | 'operativo';

/**
 * A news row reduced to what the status logic needs. Structural rather than
 * imported from the query layer, so a test fixture satisfies it without a
 * database row — and so this module keeps its independence from `lib/api`.
 */
export interface OutageItem {
  id: string;
  title: string;
  sourceUrl: string | null;
  originalDate: Date;
  /** Non-null by construction: unreviewed notices never reach this module. */
  structuredData: StructuredOutage;
}

export interface SiteStatus {
  level: StatusLevel;
  /** Active outages, most severe first, then newest first. */
  active: OutageItem[];
  /** The one outage that decided `level`. Null when nothing is active. */
  primary: OutageItem | null;
  /** Announced windows that have not started yet, soonest first. */
  upcoming: OutageItem[];
  /** Deduped union of the service names across `active`. */
  affectedServices: string[];
  /** The instant this was evaluated, for the "estado actualizado" stamp. */
  evaluatedAt: Date;
}

/**
 * How long a "ya está ocurriendo" notice with no stated end is still believed.
 *
 * SUNAT never publishes an all-clear, so without a cap a single forgotten
 * notice would claim an outage forever. Their notices follow a business-day
 * cadence and an open-ended incident is normally resolved the same day; a full
 * day covers an overnight one. Do not lower this below ~12h, or a Friday
 * evening incident would clear itself before Monday's follow-up.
 */
export const IN_PROGRESS_MAX_AGE_HOURS = 24;

/**
 * How long a window with a start but no end is assumed to run. Covers the usual
 * overnight maintenance shape (21:00 → 07:00) without letting every past
 * announcement stay active indefinitely.
 */
export const IMPLICIT_WINDOW_HOURS = 8;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Parses one of the stored ISO timestamps. They carry the -05:00 Lima offset,
 * so `Date` resolves them to the right instant regardless of the server's own
 * timezone. Unreadable values come back null rather than throwing — `parse.ts`
 * fails soft upstream and a bad row must not take down the home page.
 */
function instant(iso: string | null): number | null {
  if (!iso) return null;

  const time = new Date(iso).getTime();

  return Number.isNaN(time) ? null : time;
}

/**
 * Whether the notice describes something happening at `now`.
 *
 * The order of the checks is the whole design:
 *
 * A stated end wins over `inProgress`. Read literally, "in progress or inside
 * the window" would let a September notice that was flagged `inProgress` still
 * claim an outage in December. An admin who approved an `endsAt` meant it, so
 * an elapsed window closes the incident no matter how it was phrased.
 *
 * `originalDate` is optional so a caller with only the structured payload can
 * still ask; passing it enables the staleness guard on open-ended notices.
 */
export function isActive(
  data: StructuredOutage,
  now: Date,
  opts?: { originalDate?: Date; maxAgeHours?: number }
): boolean {
  const at = now.getTime();
  const startsAt = instant(data.startsAt);
  const endsAt = instant(data.endsAt);

  // A window that has elapsed is over, whatever the prose said.
  if (endsAt !== null && at > endsAt) return false;

  if (data.inProgress) {
    // Still inside a stated window — the check above already proved it.
    if (endsAt !== null) return true;

    // Open-ended: believe it only while the notice is fresh.
    const originalDate = opts?.originalDate;
    if (!originalDate) return true;

    const maxAge = (opts?.maxAgeHours ?? IN_PROGRESS_MAX_AGE_HOURS) * HOUR_MS;

    return at - originalDate.getTime() <= maxAge;
  }

  // A future window, or one whose start could not be read, is not active.
  if (startsAt === null || at < startsAt) return false;

  // Started, and either still inside the stated window or inside the assumed one.
  return endsAt !== null ? at <= endsAt : at <= startsAt + IMPLICIT_WINDOW_HOURS * HOUR_MS;
}

/** An announced window whose start is still ahead of us. */
export function isUpcoming(data: StructuredOutage, now: Date): boolean {
  if (data.inProgress) return false;

  const startsAt = instant(data.startsAt);

  return startsAt !== null && startsAt > now.getTime();
}

const KIND_LEVEL: Record<OutageKind, StatusLevel> = {
  INDISPONIBILIDAD: 'indisponible',
  INTERMITENCIA: 'degradado',
  MANTENIMIENTO: 'mantenimiento',
  DESCONOCIDO: 'incidencia',
};

export function kindToLevel(kind: OutageKind): StatusLevel {
  return KIND_LEVEL[kind] ?? 'incidencia';
}

/**
 * Lower is more severe. Drives which active outage becomes the headline.
 *
 * `incidencia` deliberately outranks `mantenimiento`: an incident nobody could
 * classify is more alarming than announced planned work, and of the two
 * possible mistakes, understating a real failure is the worse one.
 */
const LEVEL_RANK: Record<StatusLevel, number> = {
  indisponible: 0,
  degradado: 1,
  incidencia: 2,
  mantenimiento: 3,
  operativo: 4,
};

export function levelRank(level: StatusLevel): number {
  return LEVEL_RANK[level] ?? LEVEL_RANK.operativo;
}

/**
 * The key two service names are considered the same under: case-folded,
 * accent-stripped, whitespace-collapsed. The combining-mark strip mirrors
 * `slugifyTitle`, so "Caída" and "caida" agree here as they do in URLs.
 */
function serviceKey(service: string): string {
  return service
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The union of the service names named by the given outages.
 *
 * Normalization stops at case and accents on purpose. These strings are
 * verbatim from SUNAT's own notice, and collapsing "SOL" into "Clave SOL" would
 * mean inventing a service taxonomy — misreporting which service SUNAT actually
 * named is a worse failure than showing two closely-related entries.
 */
export function affectedServices(items: OutageItem[]): string[] {
  const seen = new Set<string>();
  const services: string[] = [];

  for (const item of items) {
    for (const raw of item.structuredData.services) {
      const service = raw.trim();
      if (!service) continue;

      const key = serviceKey(service);
      if (seen.has(key)) continue;

      seen.add(key);
      // First spelling encountered wins, and `items` arrives severity-sorted,
      // so the worst outage's wording is the one that shows.
      services.push(service);
    }
  }

  return services;
}

/**
 * The site's overall status at `now`, from the reviewed outage notices.
 *
 * Callers pass only items that carry approved `structuredData`; a notice still
 * awaiting review cannot be placed in time at all, so it is counted separately
 * by the query layer and surfaced as a caveat rather than guessed at.
 */
/**
 * Where a notice belongs on the page.
 *
 * `scheduled` is the one that has to be kept out of the history: an
 * interruption announced for next week has not happened, and listing it under
 * "incidencias recientes" would claim SUNAT went down when it did not.
 * `unreviewed` has no window at all, so it can only be reported as pending.
 */
export type IncidentPlacement = 'ongoing' | 'scheduled' | 'past' | 'unreviewed';

export function placeIncident(
  incident: { structuredData: StructuredOutage | null; originalDate: Date },
  now: Date,
  opts?: { maxAgeHours?: number }
): IncidentPlacement {
  const data = incident.structuredData;

  if (!data) return 'unreviewed';

  if (isActive(data, now, { originalDate: incident.originalDate, maxAgeHours: opts?.maxAgeHours })) {
    return 'ongoing';
  }

  return isUpcoming(data, now) ? 'scheduled' : 'past';
}

/**
 * Splits notices into the announced-but-not-started ones and everything else.
 *
 * An unreviewed notice stays with the history rather than the schedule: we
 * cannot show a start time for it, and a pending caída is a thing that may well
 * be happening now, not a plan.
 */
export function partitionIncidents<T extends { structuredData: StructuredOutage | null; originalDate: Date }>(
  incidents: T[],
  now: Date,
  opts?: { maxAgeHours?: number }
): { upcoming: T[]; history: T[] } {
  const upcoming: T[] = [];
  const history: T[] = [];

  for (const incident of incidents) {
    if (placeIncident(incident, now, opts) === 'scheduled') {
      upcoming.push(incident);
    } else {
      history.push(incident);
    }
  }

  // Soonest first: the next interruption is the one a reader needs to plan for.
  upcoming.sort(
    (a, b) =>
      (instant(a.structuredData?.startsAt ?? null) ?? 0) -
      (instant(b.structuredData?.startsAt ?? null) ?? 0)
  );

  return { upcoming, history };
}

export function computeStatus(
  items: OutageItem[],
  now: Date,
  opts?: { maxAgeHours?: number }
): SiteStatus {
  const active = items
    .filter((item) =>
      isActive(item.structuredData, now, {
        originalDate: item.originalDate,
        maxAgeHours: opts?.maxAgeHours,
      })
    )
    .sort((a, b) => {
      const bySeverity =
        levelRank(kindToLevel(a.structuredData.kind)) -
        levelRank(kindToLevel(b.structuredData.kind));

      if (bySeverity !== 0) return bySeverity;

      return b.originalDate.getTime() - a.originalDate.getTime();
    });

  const upcoming = items
    .filter((item) => isUpcoming(item.structuredData, now))
    .sort(
      (a, b) =>
        (instant(a.structuredData.startsAt) ?? 0) - (instant(b.structuredData.startsAt) ?? 0)
    );

  const primary = active[0] ?? null;

  return {
    level: primary ? kindToLevel(primary.structuredData.kind) : 'operativo',
    active,
    primary,
    upcoming,
    affectedServices: affectedServices(active),
    evaluatedAt: now,
  };
}
