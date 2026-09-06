import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { NewsRow } from '@/lib/api/news-query';
import { displayTitle } from '@/lib/outage/title';
import { getFlagChipClasses, getPrimaryFlag } from '@/lib/utils/badges';
import { getFlagLabel, UI_TEXT } from '@/lib/utils/constants';
import { FlagIcon } from '@/lib/utils/flag-icons';
import { formatAbsoluteDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

/**
 * The feed's entry point on the status page. Carries the same heading +
 * description framing as the status sections above it, because noticias is a
 * section of the site in its own right rather than a postscript to the estado.
 *
 * Deliberately not `NewsCard`: that is a client component carrying share
 * buttons and full article bodies, and mounting five of them would put a
 * JavaScript bundle on a page that otherwise ships none.
 */
export function LatestNewsStrip({ news }: { news: NewsRow[] }) {
  return (
    <section aria-labelledby="ultimas-noticias" id="noticias" className="scroll-mt-20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ultimas-noticias" className="text-lg font-semibold tracking-tight">
            {UI_TEXT.status.latest.heading}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {UI_TEXT.status.latest.description}
          </p>
        </div>

        {/* Sits beside the heading, not only under the list, so the route to
            the feed is visible without reading to the bottom of the page. */}
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/noticias">
            {UI_TEXT.status.latest.viewAll}
            <ArrowRight />
          </Link>
        </Button>
      </div>

      {news.length > 0 ? (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {news.map((item) => {
              const flag = getPrimaryFlag(item.flags);
              const date = new Date(item.originalDate);

              return (
                <li key={item.id}>
                  <Link
                    href={newsPath(item)}
                    className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="line-clamp-2 text-sm font-medium">
                      {displayTitle(item)}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {flag && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getFlagChipClasses(flag)}`}
                        >
                          <FlagIcon flag={flag} className="size-2.5" />
                          {getFlagLabel(flag)}
                        </span>
                      )}
                      <time dateTime={date.toISOString()}>{formatAbsoluteDate(date)}</time>
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <Newspaper className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">{UI_TEXT.status.latest.empty}</p>

          <Button variant="ghost" size="sm" asChild className="mt-3">
            <Link href="/noticias">
              {UI_TEXT.status.latest.emptyCta}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
