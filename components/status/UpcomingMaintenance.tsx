import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

import { displayTitle } from '@/lib/outage/title';
import type { StructuredOutage } from '@/lib/outage/types';
import { getOutageKindLabel, UI_TEXT } from '@/lib/utils/constants';
import { formatFullDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

/**
 * The fields this section reads. Structural so both callers fit: `/` passes
 * `NewsRow`s from the incident query, the estado embed passes the `OutageItem`s
 * of `status.upcoming`.
 */
type UpcomingItem = {
  id: string;
  title: string;
  structuredData: StructuredOutage | null;
};

/**
 * Interruptions SUNAT has announced that have not started yet.
 *
 * Split out of the incident history on purpose: a window scheduled for next
 * week has not happened, and listing it among "incidencias recientes" would
 * report an outage that never occurred. Here it reads as something to plan
 * around instead.
 *
 * `embeded` follows `StatusHero`: the heading drops a level so it does not
 * compete with the host page's outline, and links open in a new tab so the
 * reader is not stranded inside a frame. Hrefs stay relative — the iframe's
 * document is served from this origin.
 */
export function UpcomingMaintenance({
  upcoming,
  embeded = false,
}: {
  upcoming: UpcomingItem[];
  embeded?: boolean;
}) {
  // Nothing announced is the normal case — a permanent empty panel would be
  // noise, so the section simply does not render.
  if (upcoming.length === 0) return null;

  const Heading = embeded ? 'h3' : 'h2';

  return (
    <section aria-labelledby="mantenimientos-programados">
      <Heading id="mantenimientos-programados" className="text-lg font-semibold tracking-tight">
        {UI_TEXT.status.upcoming.heading}
      </Heading>
      <p className="mt-1 text-sm text-muted-foreground">
        {UI_TEXT.status.upcoming.description}
      </p>

      <ol className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
        {upcoming.map((item) => {
          const startsAt = item.structuredData?.startsAt
            ? new Date(item.structuredData.startsAt)
            : null;

          return (
            <li key={item.id}>
              <Link
                href={newsPath(item)}
                {...(embeded && { target: '_blank', rel: 'noopener noreferrer' })}
                className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className="line-clamp-2 text-sm font-medium">{displayTitle(item)}</span>

                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center rounded-full border border-sev-info/40 bg-sev-info-bg px-1.5 py-0.5 text-[10px] font-medium text-sev-info-fg">
                    {item.structuredData
                      ? getOutageKindLabel(item.structuredData.kind)
                      : UI_TEXT.status.incidents.scheduled}
                  </span>

                  {startsAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {UI_TEXT.status.upcoming.startsPrefix}{' '}
                      <time dateTime={startsAt.toISOString()}>{formatFullDate(startsAt)}</time>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
