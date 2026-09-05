import type { StructuredOutage } from '@/lib/outage/types';
import { getOutageKindLabel } from '@/lib/utils/constants';
import { formatFullDate } from '@/lib/utils/news-date';
import { CalendarClock, CircleDot, ListChecks, MapPin } from 'lucide-react';

/**
 * The at-a-glance panel for an outage notice: what kind, when, and which
 * services. Only rendered for items an admin has reviewed, so the values here
 * are human-approved rather than raw parser output.
 *
 * Where this renders, it stands in for the notice prose — the point of the
 * extraction is that a reader gets the answer without parsing a paragraph of
 * Spanish. `compact` trims it to what fits inside a feed card.
 */
export function OutageSummary({
  data,
  compact = false,
}: {
  data: StructuredOutage;
  compact?: boolean;
}) {
  const startsAt = data.startsAt ? new Date(data.startsAt) : null;
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;

  // A long service list would push everything else out of a card, so the tail
  // is summarised rather than dropped.
  const MAX_COMPACT_SERVICES = 4;
  const services = compact ? data.services.slice(0, MAX_COMPACT_SERVICES) : data.services;
  const hiddenServices = data.services.length - services.length;

  return (
    <section
      aria-label="Resumen de la interrupción"
      className={
        compact
          ? 'rounded-lg border border-border bg-muted/40 p-3'
          : 'mt-6 rounded-lg border border-border bg-muted/40 p-4 sm:p-5'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold tracking-wide uppercase">
          {getOutageKindLabel(data.kind)}
        </span>

        {data.inProgress && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <CircleDot className="size-3" aria-hidden="true" />
            En curso
          </span>
        )}
      </div>

      <dl className={compact ? 'mt-3 space-y-2 text-sm' : 'mt-4 space-y-3 text-sm'}>
        {(startsAt || endsAt) && (
          <Row icon={<CalendarClock className="size-4" aria-hidden="true" />} label="Periodo">
            {startsAt && endsAt ? (
              <>
                <time dateTime={data.startsAt!}>{formatFullDate(startsAt)}</time>
                {' — '}
                <time dateTime={data.endsAt!}>{formatFullDate(endsAt)}</time>
              </>
            ) : startsAt ? (
              <>
                Desde <time dateTime={data.startsAt!}>{formatFullDate(startsAt)}</time>
              </>
            ) : (
              <>
                Hasta <time dateTime={data.endsAt!}>{formatFullDate(endsAt!)}</time>
              </>
            )}
          </Row>
        )}

        {data.scope && (
          <Row icon={<MapPin className="size-4" aria-hidden="true" />} label="Alcance">
            {data.scope}
          </Row>
        )}

        {services.length > 0 && (
          <Row
            icon={<ListChecks className="size-4" aria-hidden="true" />}
            label="Servicios afectados"
          >
            <ul className="space-y-1">
              {services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
            {hiddenServices > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                y {hiddenServices} {hiddenServices === 1 ? 'servicio más' : 'servicios más'}
              </p>
            )}
          </Row>
        )}
      </dl>

      {data.cause && !compact && (
        <p className="mt-4 text-xs text-muted-foreground">{data.cause}</p>
      )}
    </section>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-foreground">{children}</dd>
      </div>
    </div>
  );
}
