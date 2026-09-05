import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

import type { NewsRow } from '@/lib/api/news-query';
import { displayTitle } from '@/lib/outage/title';
import { getOutageKindLabel, UI_TEXT } from '@/lib/utils/constants';
import { formatFullDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

/**
 * Interruptions SUNAT has announced that have not started yet.
 *
 * Split out of the incident history on purpose: a window scheduled for next
 * week has not happened, and listing it among "incidencias recientes" would
 * report an outage that never occurred. Here it reads as something to plan
 * around instead.
 */
export function UpcomingMaintenance({ upcoming }: { upcoming: NewsRow[] }) {
  // Nothing announced is the normal case — a permanent empty panel would be
  // noise, so the section simply does not render.
  if (upcoming.length === 0) return null;

  return (
    <section aria-labelledby="mantenimientos-programados">
      <h2 id="mantenimientos-programados" className="text-lg font-semibold tracking-tight">
        {UI_TEXT.status.upcoming.heading}
      </h2>
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
