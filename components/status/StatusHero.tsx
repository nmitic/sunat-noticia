import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertCircle,
  AlertTriangle,
  CircleCheck,
  ExternalLink,
  RadioTower,
  ServerCrash,
  Wrench,
} from 'lucide-react';

import { OutageSummary } from '@/components/news/OutageSummary';
import { Button } from '@/components/ui/button';
import type { SiteStatus, StatusLevel } from '@/lib/outage/status';
import { displayTitle } from '@/lib/outage/title';
import {
  getStatusAccentClasses,
  getStatusBandClasses,
  getStatusDotClasses,
} from '@/lib/utils/badges';
import { getStatusLabel, pluralize, UI_TEXT } from '@/lib/utils/constants';
import { formatFullDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

/**
 * The answer to "¿SUNAT está caído?", as the page's first and largest element.
 *
 * When something is running, the reviewed extraction is shown through the same
 * `OutageSummary` the feed and article pages use, so the periodo, alcance and
 * servicios never read differently here than they do there.
 *
 * The operational state is deliberately understated. We read SUNAT's own
 * notices and nothing else, so this can say "nothing has been reported" but
 * never "everything works" — hence the disclaimer, which renders in every state.
 */
export function StatusHero({
  status,
  lastNewsAt,
  unreviewedCount,
}: {
  status: SiteStatus;
  lastNewsAt: Date | null;
  unreviewedCount: number;
}) {
  const { level, primary } = status;
  const label = getStatusLabel(level);
  const dotClasses = getStatusDotClasses(level);
  const isOperational = level === 'operativo';
  const alsoActive = status.active.length - 1;

  return (
    <section
      aria-labelledby="estado-sunat"
      className={`overflow-hidden rounded-xl border border-border bg-card border-l-4 ${getStatusAccentClasses(level)}`}
    >
      <div
        className={`flex flex-wrap items-center gap-2 px-5 py-4 sm:px-8 ${getStatusBandClasses(level)}`}
      >
        <StatusIcon level={level} className="size-5 shrink-0" />

        {/* A pulsing dot only while something is actually running — on the
            all-clear it would suggest a live probe we do not have. */}
        {isOperational ? (
          <span className={`size-2.5 rounded-full ${dotClasses}`} aria-hidden="true" />
        ) : (
          <span className="relative flex size-2.5" aria-hidden="true">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${dotClasses}`}
            />
            <span className={`relative inline-flex size-2.5 rounded-full ${dotClasses}`} />
          </span>
        )}

        <span className="text-xs font-semibold tracking-wide uppercase">
          {UI_TEXT.status.heading}
        </span>
      </div>

      <div className="px-5 py-6 sm:px-8">
        <h1
          id="estado-sunat"
          className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {label.title}
        </h1>

        <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {label.subtitle}
        </p>

        {primary && (
          <>
            {/* The scraped title can be a 200-character sentence fragment when
                the kind was never determined, so it is clamped. */}
            <p className="mt-4 line-clamp-2 font-medium text-foreground">
              {displayTitle(primary)}
            </p>

            <OutageSummary data={primary.structuredData} />

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href={newsPath(primary)}>
                  {UI_TEXT.status.viewNotice}
                  <ExternalLink />
                </Link>
              </Button>

              {alsoActive > 0 && (
                <Link
                  href="#incidencias"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {pluralize(
                    alsoActive,
                    UI_TEXT.status.alsoActiveOne,
                    UI_TEXT.status.alsoActiveMany
                  )}
                </Link>
              )}
            </div>
          </>
        )}

        {isOperational && lastNewsAt && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RadioTower className="size-3.5" aria-hidden="true" />
            {UI_TEXT.status.lastNewsPrefix}{' '}
            {formatDistanceToNow(lastNewsAt, { addSuffix: true, locale: es })}
          </p>
        )}

        {/* An outage notice nobody has reviewed cannot be placed in time. Saying
            so is more honest than letting the all-clear imply it isn't there. */}
        {isOperational && unreviewedCount > 0 && (
          <p className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <AlertCircle
              className="mr-1.5 inline size-4 align-text-bottom text-muted-foreground"
              aria-hidden="true"
            />
            {pluralize(
              unreviewedCount,
              UI_TEXT.status.pendingReviewOne,
              UI_TEXT.status.pendingReviewMany
            )}{' '}
            <Link
              href="/noticias?flags=CAIDA_SISTEMA"
              className="font-medium underline underline-offset-4"
            >
              {UI_TEXT.status.pendingReviewLink}
            </Link>
          </p>
        )}

        <div className="mt-6 space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>
            {UI_TEXT.status.updatedAt}{' '}
            <time dateTime={status.evaluatedAt.toISOString()}>
              {formatFullDate(status.evaluatedAt)}
            </time>
          </p>
          <p>{UI_TEXT.status.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Shape carries the status alongside colour, matching how `FlagIcon` pairs with
 * the severity ramp on news cards. A switch rather than a lookup so the element
 * type is static per branch and reconciliation still works.
 */
function StatusIcon({ level, className }: { level: StatusLevel; className?: string }) {
  switch (level) {
    case 'indisponible':
      return <ServerCrash className={className} aria-hidden="true" />;
    case 'degradado':
      return <AlertTriangle className={className} aria-hidden="true" />;
    case 'incidencia':
      return <AlertCircle className={className} aria-hidden="true" />;
    case 'mantenimiento':
      return <Wrench className={className} aria-hidden="true" />;
    default:
      return <CircleCheck className={className} aria-hidden="true" />;
  }
}
