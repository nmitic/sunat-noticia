import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, RadioTower } from 'lucide-react';
import { getServerSession } from 'next-auth';

import { NewsFeed } from '@/components/news/NewsFeed';
import { SeverityLegend } from '@/components/news/SeverityLegend';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  EmailSubscriptionBar,
  EmailSubscriptionCard,
} from '@/components/layout/EmailSubscriptionForm';
import { PerunioAd } from '@/components/ads/PerunioAd';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth/config';
import { queryPublishedNews, type NewsRow } from '@/lib/api/news-query';
import { UI_TEXT } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Noticias de SUNAT — comunicados y avisos oficiales',
  description:
    'Todos los comunicados, avisos y alertas de SUNAT de fuentes oficiales, ordenados por fecha y actualizados automáticamente.',
  alternates: { canonical: '/noticias' },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NoticiasPage({ searchParams }: PageProps) {
  // Only decides whether the header offers a link back to the panel — the feed
  // itself is identical for every visitor, admin or not.
  const session = await getServerSession(authOptions);
  const isAdmin = !!session;

  const params = await searchParams;
  const categoryParam = params.category as string | undefined;
  const flagsParam = params.flags as string | undefined;

  // Create a key for NewsFeed based on filters to force remount when filters change
  const feedKey = `${categoryParam || 'all'}-${flagsParam || 'none'}`;

  let news: NewsRow[] = [];
  let dbError = false;

  try {
    const result = await queryPublishedNews({
      limit: 50,
      category: categoryParam ?? null,
      flags: flagsParam ?? null,
    });

    news = result.news;
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
            <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4">
              <Link href="/">
                <Activity />
                {UI_TEXT.noticias.backToStatus}
              </Link>
            </Button>

            <div className="space-y-6">
              <header className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                  {UI_TEXT.noticias.title}
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  {UI_TEXT.noticias.description}
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
