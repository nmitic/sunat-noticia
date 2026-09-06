import Link from 'next/link';
import { ArrowRight, History } from 'lucide-react';

import type { NewsRow } from '@/lib/api/news-query';
import { placeIncident, type IncidentPlacement } from '@/lib/outage/status';
import { displayTitle } from '@/lib/outage/title';
import { UI_TEXT } from '@/lib/utils/constants';
import { formatAbsoluteDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';
import { Button } from '../ui/button';

/**
 * The recent record of what has happened to SUNAT.
 *
 * `now` is passed in rather than read here so every row is judged against the
 * same instant as the hero above — two clocks on one page could show an
 * incident as "en curso" in the history while the hero already called it clear.
 */
export function IncidentHistory({ incidents, now }: { incidents: NewsRow[]; now: Date }) {
  return (
    <section aria-labelledby="incidencias-heading" id="incidencias" className="scroll-mt-20">
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <h2 id="incidencias-heading" className="text-lg font-semibold tracking-tight">
          {UI_TEXT.status.incidents.heading}
        </h2>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/noticias?flags=CAIDA_SISTEMA">
            {UI_TEXT.status.incidents.viewAll}
            <ArrowRight />
          </Link>
        </Button>
      </div>

      {incidents.length > 0 ? (
        <>
          <ol className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {incidents.map((incident) => {
              const date = new Date(incident.originalDate);

              return (
                <li key={incident.id}>
                  <Link
                    href={newsPath(incident)}
                    className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="line-clamp-2 text-sm font-medium">
                      {displayTitle(incident)}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <IncidentState incident={incident} now={now} />
                      <time dateTime={date.toISOString()}>{formatAbsoluteDate(date)}</time>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <History className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            {UI_TEXT.status.incidents.empty}
          </p>
        </div>
      )}
    </section>
  );
}

const STATE_STYLES: Record<IncidentPlacement, { label: string; classes: string }> = {
  ongoing: {
    label: UI_TEXT.status.incidents.ongoing,
    classes: 'border-sev-outage/40 bg-sev-outage-bg text-sev-outage-fg',
  },
  past: {
    label: UI_TEXT.status.incidents.resolved,
    classes: 'border-sev-ok/40 bg-sev-ok-bg text-sev-ok-fg',
  },
  // Routed to UpcomingMaintenance, so this is only a fallback for a caller that
  // passes an unpartitioned list.
  scheduled: {
    label: UI_TEXT.status.incidents.scheduled,
    classes: 'border-sev-info/40 bg-sev-info-bg text-sev-info-fg',
  },
  unreviewed: {
    label: UI_TEXT.status.incidents.unreviewed,
    classes: 'border-border text-muted-foreground',
  },
};

/**
 * Where one incident stands. An unreviewed notice has no window at all, so it
 * gets its own label rather than being guessed into "finalizada".
 */
function IncidentState({ incident, now }: { incident: NewsRow; now: Date }) {
  const { label, classes } = STATE_STYLES[placeIncident(incident, now)];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
