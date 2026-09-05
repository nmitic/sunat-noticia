import { db, newsTable } from '@/lib/db/drizzle';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { and, desc, eq, ne } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Download,
  ExternalLink,
} from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  EmailSubscriptionBar,
  EmailSubscriptionCard,
} from '@/components/layout/EmailSubscriptionForm';
import { PerunioAd } from '@/components/ads/PerunioAd';
import { ShareButton } from '@/components/news/ShareButton';
import { Button } from '@/components/ui/button';
import { FlagIcon } from '@/lib/utils/flag-icons';
import {
  getFlagChipClasses,
  getPrimaryFlag,
  getSeverity,
  getSeverityAccentClasses,
  getSeverityTintClasses,
} from '@/lib/utils/badges';
import { getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { formatAbsoluteDate, formatFullDate } from '@/lib/utils/news-date';
import { newsPath, parseNewsSlug } from '@/lib/utils/news-url';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * One published item by id. Unpublished rows 404 here just as they are absent
 * from the feed — the admin queue is the only place they are visible.
 */
async function getNews(slug: string) {
  const id = parseNewsSlug(slug);

  const [row] = await db
    .select({
      id: newsTable.id,
      title: newsTable.title,
      content: newsTable.content,
      source: newsTable.source,
      sourceUrl: newsTable.sourceUrl,
      category: newsTable.category,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
      publishedAt: newsTable.publishedAt,
    })
    .from(newsTable)
    .where(and(eq(newsTable.id, id), eq(newsTable.published, true)))
    .limit(1);

  if (!row) return null;

  return { ...row, flags: (row.flags as NewsFlag[]) ?? [] };
}

/** A few recent items for the "seguir leyendo" block. */
async function getRelated(excludeId: string) {
  const rows = await db
    .select({
      id: newsTable.id,
      title: newsTable.title,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
    })
    .from(newsTable)
    .where(and(eq(newsTable.published, true), ne(newsTable.id, excludeId)))
    .orderBy(desc(newsTable.originalDate))
    .limit(5);

  return rows.map((row) => ({ ...row, flags: (row.flags as NewsFlag[]) ?? [] }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const news = await getNews(slug).catch(() => null);

  if (!news) {
    return { title: 'Noticia no encontrada · SUNAT Noticias' };
  }

  // The stored content is plain text; the first couple of lines make a usable
  // share description.
  const description = news.content.replace(/\s+/g, ' ').trim().slice(0, 200);
  const path = newsPath(news);

  // Titles are derived from the comunicado body and run to full sentences —
  // far past what a tab or a search result shows. Trim for the <title> only;
  // the heading and share card keep the whole thing.
  const tabTitle =
    news.title.length > 65
      ? `${news.title.slice(0, 65).replace(/\s+\S*$/, '')}…`
      : news.title;

  return {
    title: `${tabTitle} · SUNAT Noticias`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: news.title,
      description,
      url: path,
      publishedTime: new Date(news.originalDate).toISOString(),
      siteName: 'SUNAT Noticias',
    },
    twitter: {
      card: 'summary',
      title: news.title,
      description,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isAdmin = !!session;

  const news = await getNews(slug);

  if (!news) notFound();

  const related = await getRelated(news.id).catch(() => []);

  const originalDate = new Date(news.originalDate);
  const absoluteDate = formatAbsoluteDate(originalDate);
  const relativeDate = formatDistanceToNow(originalDate, { addSuffix: true, locale: es });

  const primaryFlag = getPrimaryFlag(news.flags);
  const secondaryFlags = news.flags.filter((flag) => flag !== primaryFlag);
  const severity = primaryFlag ? getSeverity(primaryFlag) : null;

  const accentClasses = severity
    ? `border-l-4 ${getSeverityAccentClasses(severity)}`
    : 'border-l-4 border-l-transparent';
  const tintClasses = severity ? getSeverityTintClasses(severity) : '';

  // Sala de Prensa links point at Word documents rather than web pages, so the
  // action has to promise a download instead of a page.
  const isDownload = /\.(docx?|pdf|xlsx?)(\?|$)/i.test(news.sourceUrl ?? '');

  const publishedAt = news.publishedAt ? new Date(news.publishedAt) : null;
  const showPublishedAt =
    publishedAt && Math.abs(publishedAt.getTime() - originalDate.getTime()) > 60 * 60 * 1000;

  const paragraphs = news.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const path = newsPath(news);

  return (
    <>
      <Header isAdmin={isAdmin} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4">
              <Link href="/">
                <ArrowLeft />
                Volver a las noticias
              </Link>
            </Button>

            <article
              className={`overflow-hidden rounded-xl border border-border bg-card ${accentClasses}`}
            >
              {/* Severity row + verified source mark — mirrors the feed card */}
              <div
                className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4 sm:px-8 ${tintClasses}`}
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
                  SUNAT {getCategoryLabel(news.category as NewsCategory)}
                  <BadgeCheck
                    className="size-3.5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <div className="px-5 pb-6 sm:px-8">
                <h1 className="text-2xl leading-tight font-bold tracking-tight text-balance sm:text-3xl">
                  {news.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-5">
                  <time
                    dateTime={originalDate.toISOString()}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium text-foreground">{absoluteDate}</span>
                    <span className="text-muted-foreground">· {relativeDate}</span>
                  </time>

                  <ShareButton title={news.title} url={path} />
                </div>

                {/* Full text, unclamped — this page exists to show all of it. */}
                <div className="mt-6 space-y-4 leading-relaxed text-foreground/90">
                  {paragraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  {news.sourceUrl && (
                    <Button asChild>
                      <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {isDownload ? 'Descargar nota de prensa' : 'Leer noticia oficial'}
                        {isDownload ? <Download /> : <ExternalLink />}
                      </a>
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Fuente: {news.source}
                    {showPublishedAt && ` · Publicado aquí el ${formatFullDate(publishedAt)}`}
                  </p>
                </div>
              </div>
            </article>

            {related.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">Otras noticias</h2>

                <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
                  {related.map((item) => {
                    const itemFlag = getPrimaryFlag(item.flags);
                    const itemDate = new Date(item.originalDate);

                    return (
                      <li key={item.id}>
                        <Link
                          href={newsPath(item)}
                          className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/50"
                        >
                          <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
                          <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {itemFlag && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getFlagChipClasses(itemFlag)}`}
                              >
                                <FlagIcon flag={itemFlag} className="size-2.5" />
                                {getFlagLabel(itemFlag)}
                              </span>
                            )}
                            <time dateTime={itemDate.toISOString()}>
                              {formatAbsoluteDate(itemDate)}
                            </time>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Below lg the rail collapses, so the ad follows the article. */}
            <div className="mt-10 lg:hidden">
              <PerunioAd slug="plataforma" />
            </div>
          </div>

          {/* Right rail: same stack as the feed */}
          <aside className="hidden shrink-0 lg:block lg:w-80">
            <div className="sticky top-20 space-y-6">
              <EmailSubscriptionCard />
              <PerunioAd slug="plataforma" />
              <PerunioAd slug="automatiza" variant="compact" />
            </div>
          </aside>
        </div>
      </div>

      <EmailSubscriptionBar />

      <Footer />
    </>
  );
}
