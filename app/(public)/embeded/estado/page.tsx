import { AffectedServices } from '@/components/status/AffectedServices';
import { StatusHero } from '@/components/status/StatusHero';
import { UpcomingMaintenance } from '@/components/status/UpcomingMaintenance';
import { loadSiteStatus, type LoadedSiteStatus } from '@/lib/api/status';
import { UI_TEXT } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Estado de SUNAT - Embed',
  // A widget meant to be framed, not landed on from a search result. Indexing
  // it would compete with `/`, which answers the same question with the full
  // history, the full maintenance schedule and the news around it.
  robots: { index: false, follow: false },
};

/**
 * The estado panel, chrome-free, for a third-party iframe.
 *
 * Narrower in scope than `/` on purpose: the hero, the affected services and
 * the next few announced windows, nothing else. A host page gives this a fixed
 * slot, so the incident history and the news strip would sit below a fold the
 * reader has no way to reach.
 *
 * The schedule earns its place because Perunio's notification panel announces
 * upcoming maintenance and links here — landing on a page that never mentions
 * the window just announced would read as a broken link.
 *
 * Static per load, like the noticias embed next door — no polling, no SSE.
 */
export default async function EstadoEmbedPage() {
  const now = new Date();

  let loaded: LoadedSiteStatus | null = null;

  try {
    loaded = await loadSiteStatus(now);
  } catch (error) {
    console.error('Estado embed query error:', error);
  }

  // Narrower than the feed embed: at max-w-2xl the services list still gets its
  // two columns, without the panel stranding itself in a wide host frame.
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
      {loaded ? (
        <div className="space-y-8">
          <StatusHero
            status={loaded.status}
            lastNewsAt={loaded.lastNewsAt}
            unreviewedCount={loaded.unreviewedCount}
            embeded
          />

          <AffectedServices services={loaded.status.affectedServices} />

          {/* Renders nothing on a normal day. Capped so a busy week still fits
              the host's slot; `/` has the full schedule. */}
          <UpcomingMaintenance upcoming={loaded.status.upcoming.slice(0, 3)} embeded />
        </div>
      ) : (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
          {/* h2, not h1: this is inside someone else's heading outline. */}
          <h2 className="mb-2 text-lg font-semibold text-destructive">Error</h2>
          <p className="text-foreground/80">{UI_TEXT.status.error}</p>
        </div>
      )}
    </div>
  );
}
