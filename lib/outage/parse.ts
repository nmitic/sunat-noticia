import { normalizeWhitespace } from '@/lib/utils/extract-article';
import type { OutageKind, StructuredOutage } from './types';

/**
 * Turns the prose of a SUNAT interruption notice into structured fields.
 *
 * Pure and synchronous — no I/O, no clock, no database. Everything time-related
 * is derived from the `originalDate` passed in, which keeps the function
 * testable and keeps a re-parse of an old notice from drifting.
 *
 * The notices follow a handful of templates but vary in the details: times come
 * as "21:00 horas", "07:00 a. m." or bare "00:00"; dates as "del sábado 5 de
 * setiembre", "de hoy, jueves 02 de julio", or "del viernes 30" with the month
 * left to the reader. None of them carry a year. Each stage below fails soft —
 * an unreadable field comes back null and flagged rather than throwing, because
 * an admin reviews the result before it is stored.
 */
export function parseOutage(content: string, originalDate: Date): StructuredOutage {
  const text = stripSalutation(normalizeWhitespace(content));

  const kind = classifyKind(text);
  const window = parseWindow(text, originalDate);
  const services = parseServices(text);
  const scope = parseScope(text);
  const cause = parseCause(text);

  return {
    kind,
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    inProgress: detectInProgress(text, window.startsAt, originalDate),
    services,
    scope,
    cause,
    confidence: {
      window: window.confidence,
      services: services.length > 0 ? 'parsed' : 'missing',
      kind: kind === 'DESCONOCIDO' ? 'missing' : 'parsed',
    },
    source: 'auto',
  };
}

/* -------------------------------------------------------------------------- */
/* Salutation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Same shape the mensajes scraper skips when deriving a title — "Estimado(a)
 * contribuyente:", "Estimados usuarios:" and friends carry no information.
 */
const SALUTATION =
  /^estimad[oa]s?\s*(?:\([oa]\))?\s*(?:contribuyentes?|usuarios?)?\s*[:,.]?$/i;

function stripSalutation(text: string): string {
  return text
    .split('\n')
    .filter((line) => !SALUTATION.test(line.trim()))
    .join('\n')
    .trim();
}

/* -------------------------------------------------------------------------- */
/* Kind                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Ordered most-specific-first. "Intermitencia" is checked before maintenance
 * because a degraded-service notice sometimes also mentions the maintenance
 * that caused it, and the degradation is the more useful classification.
 */
function classifyKind(text: string): OutageKind {
  const lower = text.toLowerCase();

  if (/intermitencia|inconvenientes\s+(?:t[ée]cnicos|en\s+el|con\s+)/.test(lower)) {
    return 'INTERMITENCIA';
  }

  if (/suspendid[oa]|suspensi[óo]n\s+temporal/.test(lower)) {
    return 'INDISPONIBILIDAD';
  }

  if (/mantenimiento|actualizaciones\s+en\s+el/.test(lower)) {
    return 'MANTENIMIENTO';
  }

  if (/no\s+(?:estar[áa]n|se\s+encontrar[áa]n)\s+disponibles/.test(lower)) {
    return 'INDISPONIBILIDAD';
  }

  return 'DESCONOCIDO';
}

/* -------------------------------------------------------------------------- */
/* Time window                                                                */
/* -------------------------------------------------------------------------- */

const MONTHS: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  // Peru writes "setiembre"; accept the peninsular spelling too.
  setiembre: 8,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const MONTH_NAMES = Object.keys(MONTHS).join('|');

/** Lima is UTC-5 year-round — no DST, so a fixed offset is correct. */
const LIMA_OFFSET = '-05:00';

interface ParsedWindow {
  startsAt: string | null;
  endsAt: string | null;
  confidence: 'parsed' | 'partial' | 'missing';
}

/** A date/time fragment before it is resolved against the notice's year. */
interface DateParts {
  hour: number;
  minute: number;
  day: number | null;
  month: number | null;
  /** The fragment said "hoy" — the day comes from the notice's own date. */
  isToday: boolean;
}

function parseWindow(text: string, originalDate: Date): ParsedWindow {
  const start = matchWindow(text);

  if (!start) return { startsAt: null, endsAt: null, confidence: 'missing' };

  const { from, to } = start;

  // Either endpoint may omit the month ("del viernes 30"); the sibling supplies
  // it. Done in both directions since either side can be the terse one.
  const fromMonth = from?.month ?? to?.month ?? null;
  const toMonth = to?.month ?? from?.month ?? null;

  const startsAt = from ? toIso({ ...from, month: fromMonth }, originalDate) : null;
  const endsAt = to ? toIso({ ...to, month: toMonth }, originalDate, startsAt) : null;

  if (startsAt && endsAt) return { startsAt, endsAt, confidence: 'parsed' };
  if (startsAt || endsAt) return { startsAt, endsAt, confidence: 'partial' };

  return { startsAt: null, endsAt: null, confidence: 'missing' };
}

/**
 * The three window phrasings SUNAT actually uses, tried in order.
 */
function matchWindow(text: string): { from: DateParts | null; to: DateParts | null } | null {
  // "entre las 01:00 y 03:00 horas del martes 28 de enero" — one shared date,
  // so it has to be tried before the generic desde/hasta split below.
  const between =
    /entre\s+las?\s+([\s\S]{0,40}?)\s+y\s+(?:las\s+)?([\s\S]{0,80}?)(?:se\s+tiene|se\s+realizar|,|\.|$)/i.exec(
      text
    );

  if (between) {
    const from = parseDateParts(between[1]);
    const to = parseDateParts(between[2]);

    if (from && to) {
      // The date rides on the second fragment: "01:00 y 03:00 horas del martes 28".
      return {
        from: { ...from, day: from.day ?? to.day, month: from.month ?? to.month },
        to,
      };
    }
  }

  // "desde las 21:00 horas del sábado 5 de setiembre hasta las 07:00 horas del
  // domingo 6 de setiembre".
  //
  // A trailing full stop ends the fragment, but only when at least two word
  // characters precede it. "a. m." and "p. m." are single letters, so the
  // meridiem — and the date that follows it — survives.
  const desde =
    /\bdesde\s+([\s\S]*?)\bhasta\s+([\s\S]{0,120}?)(?:se\s+tiene|se\s+realizar|no\s+estar|no\s+se\s+encontrar|,|(?<=[a-záéíóúñ0-9]{2})\.(?=\s|$)|$)/i.exec(
      text
    );

  if (desde) {
    // The date-first variant — "el sábado 27 de junio desde las 14:00 horas" —
    // puts the start's date ahead of "desde", so the fragment on its own has a
    // time and no day. Prepend the run of text leading up to it.
    const lead = text.slice(0, desde.index);
    const from = parseDateParts(desde[1]) ?? null;
    const to = parseDateParts(desde[2]);

    if (from && from.day === null) {
      const leadDate = trailingDate(lead);
      if (leadDate) {
        return { from: { ...from, day: leadDate.day, month: leadDate.month }, to };
      }
    }

    if (from || to) return { from, to };
  }

  return null;
}

/**
 * The last date mentioned in a run of text, used when the start's date precedes
 * "desde" rather than following it.
 */
function trailingDate(text: string): { day: number; month: number | null } | null {
  const dayMonth = new RegExp(`(\\d{1,2})\\s+de\\s+(${MONTH_NAMES})`, 'gi');

  let last: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  while ((match = dayMonth.exec(text)) !== null) last = match;

  if (last) return { day: parseInt(last[1], 10), month: MONTHS[last[2].toLowerCase()] };

  return null;
}

/**
 * Pulls an hour and, when present, a day and month out of a fragment such as
 * "las 21:00 horas del sábado 5 de setiembre" or "las 07:00 a. m. del domingo 06".
 */
function parseDateParts(fragment: string): DateParts | null {
  const time = /(\d{1,2}):(\d{2})/.exec(fragment);
  if (!time) return null;

  let hour = parseInt(time[1], 10);
  const minute = parseInt(time[2], 10);

  if (hour > 23 || minute > 59) return null;

  // "a. m." / "p.m." / "p. m." — SUNAT spaces these inconsistently. Only the
  // meridiem immediately after the time counts, so slice from the match.
  const afterTime = fragment.slice(time.index + time[0].length, time.index + time[0].length + 12);
  const meridiem = /^\s*([ap])\s*\.?\s*m\s*\.?/i.exec(afterTime);

  if (meridiem) {
    const isPm = meridiem[1].toLowerCase() === 'p';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }

  const isToday = /\bde\s+hoy\b|\bhoy\b/i.test(fragment);

  // "5 de setiembre" — a day bound to a month name.
  const dayMonth = new RegExp(`(\\d{1,2})\\s+de\\s+(${MONTH_NAMES})`, 'i').exec(fragment);

  if (dayMonth) {
    return {
      hour,
      minute,
      day: parseInt(dayMonth[1], 10),
      month: MONTHS[dayMonth[2].toLowerCase()],
      isToday,
    };
  }

  // "del sábado 05/09" — a numeric date, day first as Peru writes it.
  const numeric = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(fragment);

  if (numeric) {
    const month = parseInt(numeric[2], 10) - 1;
    if (month >= 0 && month <= 11) {
      return { hour, minute, day: parseInt(numeric[1], 10), month, isToday };
    }
  }

  // "del viernes 30" — a weekday and a bare day, month left implicit.
  const weekdayDay =
    /(?:lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)\s+(\d{1,2})\b/i.exec(fragment);

  if (weekdayDay) {
    return { hour, minute, day: parseInt(weekdayDay[1], 10), month: null, isToday };
  }

  // A time with no date at all — valid for "hoy", and for the second half of an
  // "entre las X y las Y" where the date sits on the other fragment.
  return { hour, minute, day: null, month: null, isToday };
}

/**
 * Resolves parts into an absolute ISO timestamp at the Lima offset.
 *
 * The year never appears in the prose, so it comes from the notice's own date.
 * `after` guards the two rollovers that would otherwise land a window in the
 * wrong year or before its own start.
 */
function toIso(parts: DateParts, originalDate: Date, after?: string | null): string | null {
  const base = limaParts(originalDate);

  let day = parts.day;
  let month = parts.month;
  let year = base.year;

  if (parts.isToday || day === null) {
    day = day ?? base.day;
    month = month ?? base.month;
  }

  if (month === null) month = base.month;
  if (day === null) return null;

  // A notice published in December describing "1 de enero" means next year.
  if (base.month === 11 && month === 0) year += 1;
  // ...and the mirror case, a January notice referring back to December.
  else if (base.month === 0 && month === 11) year -= 1;

  let iso = isoAtLima(year, month, day, parts.hour, parts.minute);

  // An overnight window ends on the following day; when the notice gave no date
  // for the end ("de las 22:00 a las 02:00"), the naive result precedes the
  // start. Roll it forward one day rather than emitting a negative window.
  if (after && iso < after && parts.day === null) {
    const rolled = new Date(`${iso}`);
    rolled.setUTCDate(rolled.getUTCDate() + 1);
    iso = isoAtLima(
      rolled.getUTCFullYear(),
      rolled.getUTCMonth(),
      rolled.getUTCDate(),
      parts.hour,
      parts.minute
    );
  }

  return iso;
}

/** Builds the ISO string by hand so the server's own timezone never leaks in. */
function isoAtLima(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  // Normalize via UTC so an out-of-range day (e.g. 31 September) rolls over
  // into a real calendar date instead of producing an invalid string.
  const normalized = new Date(Date.UTC(year, month, day, hour, minute));

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${normalized.getUTCFullYear()}-${pad(normalized.getUTCMonth() + 1)}-${pad(
      normalized.getUTCDate()
    )}T${pad(normalized.getUTCHours())}:${pad(normalized.getUTCMinutes())}:00${LIMA_OFFSET}`
  );
}

/** The calendar date of an instant *as seen in Lima*, not on the server. */
function limaParts(date: Date): { year: number; month: number; day: number } {
  const lima = new Date(date.getTime() + offsetMinutes(LIMA_OFFSET) * 60_000);

  return {
    year: lima.getUTCFullYear(),
    month: lima.getUTCMonth(),
    day: lima.getUTCDate(),
  };
}

function offsetMinutes(offset: string): number {
  const match = /([+-])(\d{2}):(\d{2})/.exec(offset);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
}

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

/** Closing courtesies and the trailing dateline — everything after is furniture. */
const LIST_TERMINATORS = [
  /^le\s+recomendamos/i,
  /^agradecemos/i,
  /^disculpe/i,
  /^disculpas/i,
  /^nuestro\s+equipo/i,
  /^lamentamos/i,
  /^ofrecemos\s+disculpas/i,
  /^gerencia\s+de/i,
  /^historial\s+de\s+comunicados$/i,
  /^lima,\s+/i,
];

/** The colon that introduces the affected-service list. */
const LIST_TRIGGER =
  /(?:siguientes\s+servicios|los\s+servicios|servicios?)\s*(?:para[^:\n]*)?:\s*/i;

function parseServices(text: string): string[] {
  const trigger = LIST_TRIGGER.exec(text);
  if (!trigger) return [];

  const remainder = text.slice(trigger.index + trigger[0].length);
  const lines = remainder.split('\n');

  const services: string[] = [];

  for (const raw of lines) {
    const line = stripBullet(raw.trim());

    if (!line) {
      // A blank line inside the list is just paragraph spacing; only stop once
      // something has been collected and the gap is followed by prose.
      if (services.length > 0) continue;
      continue;
    }

    if (LIST_TERMINATORS.some((pattern) => pattern.test(line))) break;

    // A full sentence is prose that follows the list, not an item. Service
    // names are short and unpunctuated ("Mis declaraciones y pagos"), though
    // some legitimately contain a colon ("Otras solicitudes: Mis Devoluciones").
    if (line.length > 120) break;

    services.push(line);
  }

  // Notices that run the list inline instead of on separate lines.
  if (services.length === 1 && /\s[-–]\s|,/.test(services[0])) {
    return splitInline(services[0]);
  }

  return services;
}

function stripBullet(line: string): string {
  return line.replace(/^[\s•·*\-–—]+/, '').replace(/^\d+[.)]\s*/, '').trim();
}

/**
 * "Mesa de Partes Virtual - MPV - Actas electrónicas" — a run of services on
 * one line. Splits on the separators SUNAT uses, keeping hyphenated names
 * intact by requiring whitespace around the dash.
 */
function splitInline(line: string): string[] {
  return line
    .split(/\s[-–]\s|,\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2);
}

/* -------------------------------------------------------------------------- */
/* Scope and cause                                                            */
/* -------------------------------------------------------------------------- */

function parseScope(text: string): string | null {
  const contributors =
    /para\s+(?:los\s+|las\s+)?contribuyentes\s+de\s+(?:la\s+|los\s+|el\s+)?([^:.\n]{3,80})/i.exec(
      text
    );

  if (contributors) return contributors[1].trim();

  // "los aplicativos de IQBF en SOL" — a subsystem rather than a region.
  const subsystem = /\b(IQBF|SIRE|SIGERI|MPV)\s+en\s+(SOL|SUNAT[^,.\n]{0,30})/i.exec(text);
  if (subsystem) return `${subsystem[1]} en ${subsystem[2]}`.trim();

  return null;
}

/**
 * An external cause, when the notice names one. Only third-party attributions
 * are worth capturing — "trabajos de mantenimiento" is already the `kind`.
 */
function parseCause(text: string): string | null {
  const thirdParty =
    /\b(RENIEC|MIGRACIONES|SUNARP|BANCO\s+DE\s+LA\s+NACI[ÓO]N)\b[^.\n]{0,120}/i.exec(text);

  if (thirdParty) return thirdParty[0].trim().replace(/,$/, '');

  return null;
}

/* -------------------------------------------------------------------------- */
/* In progress                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Whether the notice describes something already underway rather than a future
 * window. Phrasing is the strong signal; a start time already past at the
 * moment of publication is the fallback.
 */
function detectInProgress(text: string, startsAt: string | null, originalDate: Date): boolean {
  if (
    /en\s+estos\s+momentos|viene(?:n)?\s+afectando|viene\s+trabajando|se\s+encuentra\s+temporalmente|estamos\s+presentando|venimos\s+presentando/i.test(
      text
    )
  ) {
    return true;
  }

  if (!startsAt) return false;

  // The notice's own date is midnight, so only a start strictly before that day
  // counts as already running — a same-day 22:00 window is still upcoming.
  return new Date(startsAt).getTime() < originalDate.getTime();
}
