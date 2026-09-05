'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getFlagChipClasses,
  getPrimaryFlag,
  getSeverity,
  getSeverityAccentClasses,
  getSeverityTintClasses,
} from '@/lib/utils/badges';
import { FlagIcon } from '@/lib/utils/flag-icons';
import { NewsContent } from '@/components/news/NewsContent';
import { OutageSummary } from '@/components/news/OutageSummary';
import { ShareButton } from '@/components/news/ShareButton';
import { displayTitle } from '@/lib/outage/title';
import type { StructuredOutage } from '@/lib/outage/types';
import { getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ExternalLink, BadgeCheck, Download, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatAbsoluteDate, formatFullDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

interface NewsCardProps {
  news: {
    id?: string;
    title: string;
    content: string;
    source: string;
    sourceUrl?: string | null;
    category: NewsCategory;
    flags?: NewsFlag[];
    originalDate: Date;
    publishedAt?: Date | null;
    structuredData?: StructuredOutage | null;
  };
  /** Rendered inside a third-party iframe — links must escape the frame. */
  embeded?: boolean;
}

/**
 * The reader-facing card. Purely presentational: every moderation action lives
 * in the admin panel, so this renders the same markup for an anonymous visitor
 * and a signed-in admin.
 */
export function NewsCard({ news, embeded = false }: NewsCardProps) {
  const originalDate = new Date(news.originalDate);
  const absoluteDate = formatAbsoluteDate(originalDate);
  const relativeDate = formatDistanceToNow(originalDate, {
    addSuffix: true,
    locale: es,
  });

  // Sala de Prensa links point at Word documents rather than web pages, so the
  // action has to promise a download instead of a page.
  const isDownload = /\.(docx?|pdf|xlsx?)(\?|$)/i.test(news.sourceUrl ?? '');

  // Every item gets its own shareable page. This card only ever renders
  // published rows (the admin queue has its own card), so the route resolves
  // whether or not an admin is signed in.
  //
  // The slug stays keyed to the stored title: approving outage data changes the
  // headline, and rebuilding the slug from it would break links already shared.
  const detailPath = news.id ? newsPath({ id: news.id, title: news.title }) : null;

  // Approved outage data gives a real headline in place of the scraped first
  // sentence of the notice.
  const heading = displayTitle(news);

  // In an embed the feed lives in someone else's iframe, so navigating in
  // place would strand the reader inside a frame they can't get out of.
  const linkTarget = embeded ? { target: '_blank', rel: 'noopener' } : {};

  const flags = news.flags || [];
  const primaryFlag = getPrimaryFlag(flags);
  const secondaryFlags = flags.filter((flag) => flag !== primaryFlag);
  const severity = primaryFlag ? getSeverity(primaryFlag) : null;

  // Unflagged items stay visually quiet so that flagged ones carry weight.
  const accentClasses = severity
    ? `border-l-4 ${getSeverityAccentClasses(severity)}`
    : 'border-l-4 border-l-transparent';
  const tintClasses = severity ? getSeverityTintClasses(severity) : '';

  // Only surface the approval time when it meaningfully trails the source date.
  const publishedAt = news.publishedAt ? new Date(news.publishedAt) : null;
  const dateTitle =
    publishedAt && Math.abs(publishedAt.getTime() - originalDate.getTime()) > 60 * 60 * 1000
      ? `Publicado en SUNAT Noticias el ${formatFullDate(publishedAt)}`
      : undefined;

  return (
    <Card
      className={`group gap-0 overflow-hidden py-0 transition-all hover:border-foreground/15 hover:shadow-md ${accentClasses}`}
    >
      {/* Severity row + verified source mark */}
      <div
        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pt-4 pb-3 ${tintClasses}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryFlag ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${getFlagChipClasses(primaryFlag)}`}
            >
              <FlagIcon flag={primaryFlag} className="size-3.5" />
              {getFlagLabel(primaryFlag)}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Comunicado
            </span>
          )}

          {secondaryFlags.map((flag) => (
            <span
              key={flag}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getFlagChipClasses(flag)}`}
            >
              <FlagIcon flag={flag} className="size-3" />
              {getFlagLabel(flag)}
            </span>
          ))}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Image src="/sunat.svg" alt="" width={14} height={14} aria-hidden="true" />
          SUNAT {getCategoryLabel(news.category)}
          <BadgeCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </span>
      </div>

      {/* Headline + excerpt */}
      <div className="space-y-2 px-5 p-4">
        <h3 className="line-clamp-3 text-lg leading-snug font-semibold text-balance">
          {detailPath ? (
            // Whole-card links would swallow the "Ver más" expander and the
            // action buttons, so only the headline navigates.
            <Link
              href={detailPath}
              {...linkTarget}
              className="underline-offset-4 hover:underline"
            >
              {heading}
            </Link>
          ) : (
            heading
          )}
        </h3>

        {/* Approved outage data answers the reader's question directly, so it
            replaces the prose rather than sitting alongside it. The full text
            is still one click away on the detail page. */}
        {news.structuredData ? (
          <OutageSummary data={news.structuredData} compact />
        ) : (
          <NewsContent content={news.content} />
        )}
      </div>

      {/* Date bar — the absolute date leads, the relative one supports it */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border px-5 py-3">
        <time
          dateTime={originalDate.toISOString()}
          title={dateTitle}
          className="inline-flex items-center gap-2 text-sm"
        >
          <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-foreground">{absoluteDate}</span>
          <span className="text-muted-foreground">· {relativeDate}</span>
        </time>

        {/* Actions read right to left in weight: share is a quiet icon, the
            official source is secondary, and the site's own page is primary.
            The labels stay short so the three fit one line on a narrow card. */}
        <div className="flex items-center gap-2 sm:ml-auto">
          {detailPath && (
            <ShareButton title={heading} url={detailPath} iconOnly />
          )}

          {news.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                {isDownload ? <Download /> : <ExternalLink />}
                {isDownload ? 'Nota de prensa' : 'Fuente oficial'}
              </a>
            </Button>
          )}

          {detailPath && (
            <Button size="sm" asChild>
              <Link href={detailPath} {...linkTarget}>
                Ver noticia
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
