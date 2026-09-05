import { z } from 'zod';
import { OUTAGE_KINDS } from './types';

const confidence = z.enum(['parsed', 'partial', 'missing']);

/** Rejects anything that is not a real instant, so bad input never reaches the column. */
const isoDateTime = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha inválida')
  .nullable();

/**
 * Validates the payload an admin approves. Deliberately strict: this is the
 * only path that writes `structuredData`, and the column is typed, so a shape
 * mismatch here would surface much later as a broken render.
 */
export const structuredOutageSchema = z
  .object({
    kind: z.enum(OUTAGE_KINDS as [string, ...string[]]),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    inProgress: z.boolean(),
    services: z.array(z.string().trim().min(1, 'El servicio no puede estar vacío')).max(50),
    scope: z.string().trim().min(1).nullable(),
    cause: z.string().trim().min(1).nullable(),
    confidence: z.object({
      window: confidence,
      services: confidence,
      kind: confidence,
    }),
    source: z.enum(['auto', 'edited']),
  })
  .refine(
    (value) =>
      !value.startsAt ||
      !value.endsAt ||
      Date.parse(value.endsAt) >= Date.parse(value.startsAt),
    { message: 'El fin de la interrupción no puede ser anterior al inicio', path: ['endsAt'] }
  );
