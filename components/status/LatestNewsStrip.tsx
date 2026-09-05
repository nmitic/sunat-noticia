import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';

import type { NewsRow } from '@/lib/api/news-query';
import { displayTitle } from '@/lib/outage/title';
import { getFlagChipClasses, getPrimaryFlag } from '@/lib/utils/badges';
import { getFlagLabel, UI_TEXT } from '@/lib/utils/constants';
import { FlagIcon } from '@/lib/utils/flag-icons';
import { formatAbsoluteDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

/**
 * A short read-on list pointing at the full feed.
 *
 * Deliberately not `NewsCard`: that is a client component carrying share
 * buttons and full article bodies, and mounting five of them would put a
 * JavaScript bundle on a page that otherwise ships none.
 */
export function LatestNewsStrip({ news }: { news: NewsRow[] }) {
  return (
    <section aria-labelledby="ultimas-noticias">
      <h2 id="ultimas-noticias" className="text-lg font-semibold tracking-tight">
        {UI_TEXT.status.latest.heading}
      </h2>

      {news.length > 0 ? (
        <>
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

          <Link
            href="/noticias"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {UI_TEXT.status.latest.viewAll}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
          <Newspaper className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">{UI_TEXT.status.latest.empty}</p>
        </div>
      )}
    </section>
  );
}
