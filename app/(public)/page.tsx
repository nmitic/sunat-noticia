import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFeed } from '@/components/news/NewsFeed';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  EmailSubscriptionBar,
  EmailSubscriptionCard,
} from '@/components/layout/EmailSubscriptionForm';
import { SeverityLegend } from '@/components/news/SeverityLegend';
import { PerunioAd } from '@/components/ads/PerunioAd';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import type { StructuredOutage } from '@/lib/outage/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { RadioTower } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Agregador de Noticias',
  description: 'Últimas noticias sobre SUNAT de fuentes oficiales',
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  publishedAt: Date | null;
  structuredData: StructuredOutage | null;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  // Only decides whether the header offers a link back to the panel — the feed
  // itself is identical for every visitor, admin or not.
  const session = await getServerSession(authOptions);
  const isAdmin = !!session;

  // Await and extract search params
  const params = await searchParams;
  const categoryParam = params.category as string | undefined;
  const flagsParam = params.flags as string | undefined;

  // Create a key for NewsFeed based on filters to force remount when filters change
  const feedKey = `${categoryParam || 'all'}-${flagsParam || 'none'}`;

  // Fetch published news with filters
  let news: NewsItem[] = [];
  let dbError = false;

  try {
    // Build query conditions
    const conditions = [eq(newsTable.published, true)];

    // Add category filter (single category)
    if (categoryParam) {
      const category = categoryParam as NewsCategory;
      conditions.push(eq(newsTable.category, category));
    }

    // Add flags filter (array of flags - item must have at least one)
    if (flagsParam) {
      const flags = flagsParam.split(',') as NewsFlag[];
      if (flags.length > 0) {
        // Use PostgreSQL array overlap operator: flags && ARRAY['flag1', 'flag2']
        const flagConditions = flags.map(flag =>
          sql`${newsTable.flags} @> ARRAY[${flag}]::text[]`
        );
        conditions.push(or(...flagConditions)!);
      }
    }

    const newsRows = await db.select({
      id: newsTable.id,
      title: newsTable.title,
      content: newsTable.content,
      source: newsTable.source,
      sourceUrl: newsTable.sourceUrl,
      category: newsTable.category,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
      publishedAt: newsTable.publishedAt,
      structuredData: newsTable.structuredData,
    }).from(newsTable)
      .where(and(...conditions))
      .orderBy(desc(newsTable.originalDate))
      .limit(50);

    news = newsRows.map(row => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
  }

  // Freshness indicator, driven by the newest item actually on the page.
  const lastUpdated =
    news.length > 0
      ? formatDistanceToNow(new Date(news[0].originalDate), { addSuffix: true, locale: es })
      : null;

  return (
    <>
      <Header isAdmin={isAdmin} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content area */}
          <div className="min-w-0 flex-1">
            <div className="space-y-6">
              <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                  Noticias de SUNAT
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Comunicados, avisos y alertas de fuentes oficiales de SUNAT, actualizados
                  automáticamente.
                </p>

                {lastUpdated && (
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RadioTower className="size-3.5" aria-hidden="true" />
                    Última noticia {lastUpdated}
                  </p>
                )}

                <SeverityLegend />
              </header>

              {dbError ? (
                <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
                  <h2 className="mb-2 text-lg font-semibold text-destructive">Error</h2>
                  <p className="text-foreground/80">
                    Ocurrió un error al cargar las noticias. Por favor, inténtalo más tarde.
                  </p>
                </div>
              ) : (
                <NewsFeed key={feedKey} initialNews={news} />
              )}
            </div>

            {/* Below lg the rail collapses, so the ad follows the feed instead
                of disappearing entirely. */}
            <div className="mt-10 lg:hidden">
              <PerunioAd slug="plataforma" />
            </div>
          </div>

          {/* Right rail: subscribe + Perunio units */}
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
