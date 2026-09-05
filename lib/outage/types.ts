/**
 * Structured form of a SUNAT service-interruption notice.
 *
 * These arrive as free prose, so everything here is extracted best-effort by
 * `parseOutage` and then reviewed by an admin before it is ever stored. The
 * `confidence` block exists so the review UI can point at what the parser was
 * unsure about instead of asking a human to re-read every field.
 */

export type OutageKind =
  /** Planned work, announced ahead of time with a window. */
  | 'MANTENIMIENTO'
  /** Degraded but not down — usually already in progress. */
  | 'INTERMITENCIA'
  /** Fully unavailable or suspended. */
  | 'INDISPONIBILIDAD'
  /** The notice did not say clearly enough; the admin decides. */
  | 'DESCONOCIDO';

export const OUTAGE_KINDS: OutageKind[] = [
  'MANTENIMIENTO',
  'INTERMITENCIA',
  'INDISPONIBILIDAD',
  'DESCONOCIDO',
];

/** How a given field came out of the parser. */
export type FieldConfidence = 'parsed' | 'partial' | 'missing';

export interface OutageConfidence {
  /** 'partial' when only one end of the window could be read. */
  window: FieldConfidence;
  services: FieldConfidence;
  kind: FieldConfidence;
}

export interface StructuredOutage {
  kind: OutageKind;
  /** ISO 8601 carrying the -05:00 Lima offset. Null when none was stated. */
  startsAt: string | null;
  endsAt: string | null;
  /** The notice describes something already happening, not a future window. */
  inProgress: boolean;
  /** Affected service names, verbatim from the notice's own list. */
  services: string[];
  /** e.g. "Intendencia Lima". Null when the notice restricts nothing. */
  scope: string | null;
  /** e.g. "RENIEC ha comunicado la suspensión temporal de sus servicios". */
  cause: string | null;
  confidence: OutageConfidence;
  /** 'auto' straight from the parser; 'edited' once an admin changed a field. */
  source: 'auto' | 'edited';
}
