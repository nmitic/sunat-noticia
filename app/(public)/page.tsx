import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  EmailSubscriptionBar,
  EmailSubscriptionCard,
} from '@/components/layout/EmailSubscriptionForm';
import { PerunioAd } from '@/components/ads/PerunioAd';
import { StatusHero } from '@/components/status/StatusHero';
import { AffectedServices } from '@/components/status/AffectedServices';
import { UpcomingMaintenance } from '@/components/status/UpcomingMaintenance';
import { IncidentHistory } from '@/components/status/IncidentHistory';
import { LatestNewsStrip } from '@/components/status/LatestNewsStrip';
import { authOptions } from '@/lib/auth/config';
import { queryPublishedNews, type NewsRow } from '@/lib/api/news-query';
import {
  queryLastNewsAt,
  queryLatestNonOutageNews,
  queryOutageCandidates,
} from '@/lib/api/status-query';
import { computeStatus, partitionIncidents, type SiteStatus } from '@/lib/outage/status';
import { UI_TEXT } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '¿SUNAT está caído? Estado de los servicios en tiempo real',
  description:
    'Consulta si los sistemas de SUNAT están caídos ahora: caídas, intermitencias y mantenimientos reportados en los comunicados oficiales, con los servicios afectados.',
  alternates: { canonical: '/' },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StatusPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // The filters belonged to the feed, which now lives at /noticias. next.config
  // catches document requests; this catches client-side navigations, which do
  // not re-run config redirects. redirect() throws, so it must stay outside the
  // try/catch below.
  const flagsParam = typeof params.flags === 'string' ? params.flags : undefined;
  const categoryParam = typeof params.category === 'string' ? params.category : undefined;

  if (flagsParam || categoryParam) {
    const query = new URLSearchParams();
    if (categoryParam) query.set('category', categoryParam);
    if (flagsParam) query.set('flags', flagsParam);

    redirect(`/noticias?${query.toString()}`);
  }

  const session = await getServerSession(authOptions);
  const isAdmin = !!session;

  // One clock for the whole page: the hero and the history must not disagree
  // about whether an incident is still running.
  const now = new Date();

  let status: SiteStatus | null = null;
  let upcoming: NewsRow[] = [];
  let incidents: NewsRow[] = [];
  let latest: NewsRow[] = [];
  let lastNewsAt: Date | null = null;
  let unreviewedCount = 0;
  let dbError = false;

  try {
    // Concurrent, because four serial round trips would show up in TTFB on a
    // force-dynamic page. The pool caps at 3, so one of these queues briefly.
    const [candidates, incidentRows, latestRows, lastAt] = await Promise.all([
      queryOutageCandidates(),
      // Fetched wider than the five shown: announced-but-not-started windows are
      // split off below, and they must not eat the history's slots.
      queryPublishedNews({ flags: 'CAIDA_SISTEMA', limit: 15 }),
      queryLatestNonOutageNews(5),
      queryLastNewsAt(),
    ]);

    status = computeStatus(candidates.items, now);
    unreviewedCount = candidates.unreviewedCount;

    const partitioned = partitionIncidents(incidentRows.news, now);
    upcoming = partitioned.upcoming.slice(0, 5);
    incidents = partitioned.history.slice(0, 5);

    latest = latestRows;
    lastNewsAt = lastAt;
  } catch (error) {
    console.error('Status query error:', error);
    dbError = true;
  }

  return (
    <>
      <Header isAdmin={isAdmin} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            {dbError || !status ? (
              <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
                <h1 className="mb-2 text-lg font-semibold text-destructive">Error</h1>
                <p className="text-foreground/80">{UI_TEXT.status.error}</p>
              </div>
            ) : (
              <div className="space-y-10">
                <StatusHero
                  status={status}
                  lastNewsAt={lastNewsAt}
                  unreviewedCount={unreviewedCount}
                />

                <AffectedServices services={status.affectedServices} />

                <UpcomingMaintenance upcoming={upcoming} />

                <IncidentHistory incidents={incidents} now={now} />

                <LatestNewsStrip news={latest} />
              </div>
            )}

            {/* Below lg the rail collapses, so the ad follows the page content
                instead of disappearing entirely. */}
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
