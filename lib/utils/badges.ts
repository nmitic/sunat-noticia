import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import type { StatusLevel } from '@/lib/outage/status';

/**
 * Visual severity levels. These map onto the --sev-* token ramp in globals.css,
 * which is deliberately separate from --primary (coral, reserved for Perunio
 * promotional units) so that "urgent" and "advertisement" never look alike.
 */
export type Severity = 'critical' | 'outage' | 'high' | 'info' | 'neutral';

/**
 * Flag → severity, plus a rank used to pick the single flag that drives a
 * card's accent bar when an item carries several. Lower rank wins.
 */
const FLAG_SEVERITY: Record<NewsFlag, { severity: Severity; rank: number }> = {
  URGENTE: { severity: 'critical', rank: 0 },
  CAIDA_SISTEMA: { severity: 'outage', rank: 1 },
  IMPORTANTE: { severity: 'high', rank: 2 },
  ACTUALIZACION: { severity: 'info', rank: 3 },
  SALA_PRENSA: { severity: 'neutral', rank: 4 },
};

export function getSeverity(flag: NewsFlag): Severity {
  return FLAG_SEVERITY[flag]?.severity ?? 'neutral';
}

/**
 * The highest-priority flag on an item, or null when it carries none.
 */
export function getPrimaryFlag(flags: NewsFlag[]): NewsFlag | null {
  if (!flags || flags.length === 0) return null;

  return flags.reduce((best, flag) => {
    const bestRank = FLAG_SEVERITY[best]?.rank ?? Number.MAX_SAFE_INTEGER;
    const rank = FLAG_SEVERITY[flag]?.rank ?? Number.MAX_SAFE_INTEGER;
    return rank < bestRank ? flag : best;
  });
}

/**
 * Chip fill/text/border, by severity. Token-driven so both themes work.
 */
const CHIP_CLASSES: Record<Severity, string> = {
  critical: 'bg-sev-critical-bg text-sev-critical-fg border-sev-critical/40',
  outage: 'bg-sev-outage-bg text-sev-outage-fg border-sev-outage/40',
  high: 'bg-sev-high-bg text-sev-high-fg border-sev-high/40',
  info: 'bg-sev-info-bg text-sev-info-fg border-sev-info/40',
  neutral: 'bg-sev-neutral-bg text-sev-neutral-fg border-sev-neutral/40',
};

/**
 * Solid left accent bar on a news card.
 */
const ACCENT_BORDER_CLASSES: Record<Severity, string> = {
  critical: 'border-l-sev-critical',
  outage: 'border-l-sev-outage',
  high: 'border-l-sev-high',
  info: 'border-l-sev-info',
  neutral: 'border-l-sev-neutral',
};

/**
 * Header wash. Only the two most severe levels get one — tinting every card
 * would mean none of them stands out.
 */
const HEADER_TINT_CLASSES: Record<Severity, string> = {
  critical: 'bg-sev-critical-bg/60',
  outage: 'bg-sev-outage-bg/60',
  high: '',
  info: '',
  neutral: '',
};

/**
 * Small solid dot, used in the filter bar and legend.
 */
const DOT_CLASSES: Record<Severity, string> = {
  critical: 'bg-sev-critical',
  outage: 'bg-sev-outage',
  high: 'bg-sev-high',
  info: 'bg-sev-info',
  neutral: 'bg-sev-neutral',
};

export function getFlagChipClasses(flag: NewsFlag): string {
  return CHIP_CLASSES[getSeverity(flag)];
}

export function getSeverityAccentClasses(severity: Severity): string {
  return ACCENT_BORDER_CLASSES[severity];
}

export function getSeverityTintClasses(severity: Severity): string {
  return HEADER_TINT_CLASSES[severity];
}

export function getFlagDotClasses(flag: NewsFlag): string {
  return DOT_CLASSES[getSeverity(flag)];
}

/**
 * Kept for the admin views, which render plain flag chips.
 */
export function getFlagColorClasses(flag: NewsFlag): string {
  return getFlagChipClasses(flag);
}

/* -------------------------------------------------------------------------- */
/* Status page                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Status level → the same severity ramp the feed uses, so a red hero and an
 * URGENTE chip agree about what red means. Only `operativo` reaches for
 * --sev-ok, which exists for exactly this one state.
 */
const STATUS_BAND_CLASSES: Record<StatusLevel, string> = {
  indisponible: 'bg-sev-critical-bg text-sev-critical-fg',
  degradado: 'bg-sev-high-bg text-sev-high-fg',
  incidencia: 'bg-sev-outage-bg text-sev-outage-fg',
  mantenimiento: 'bg-sev-info-bg text-sev-info-fg',
  operativo: 'bg-sev-ok-bg text-sev-ok-fg',
};

const STATUS_ACCENT_CLASSES: Record<StatusLevel, string> = {
  indisponible: 'border-l-sev-critical',
  degradado: 'border-l-sev-high',
  incidencia: 'border-l-sev-outage',
  mantenimiento: 'border-l-sev-info',
  operativo: 'border-l-sev-ok',
};

const STATUS_DOT_CLASSES: Record<StatusLevel, string> = {
  indisponible: 'bg-sev-critical',
  degradado: 'bg-sev-high',
  incidencia: 'bg-sev-outage',
  mantenimiento: 'bg-sev-info',
  operativo: 'bg-sev-ok',
};

/** Tint and text for the hero's status band. */
export function getStatusBandClasses(level: StatusLevel): string {
  return STATUS_BAND_CLASSES[level] ?? STATUS_BAND_CLASSES.operativo;
}

/** Left accent bar, matching the treatment on news cards. */
export function getStatusAccentClasses(level: StatusLevel): string {
  return STATUS_ACCENT_CLASSES[level] ?? STATUS_ACCENT_CLASSES.operativo;
}

export function getStatusDotClasses(level: StatusLevel): string {
  return STATUS_DOT_CLASSES[level] ?? STATUS_DOT_CLASSES.operativo;
}

/**
 * The feed now carries a single category (OFICIAL), so this reads as a
 * verified-source mark rather than a differentiator.
 */
export function getCategoryColorClasses(category: NewsCategory): string {
  const colors: Record<NewsCategory, string> = {
    OFICIAL: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  };

  return colors[category] || 'bg-muted text-muted-foreground border-border';
}
