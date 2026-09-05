'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { NewsCard } from './NewsCard';
import { FlagSelector } from './FlagSelector';
import { OutageExtractor } from './OutageExtractor';
import { UI_TEXT } from '@/lib/utils/constants';
import { newsPath } from '@/lib/utils/news-url';
import type { StructuredOutage } from '@/lib/outage/types';
import { Check, ExternalLink, EyeOff, Trash2 } from 'lucide-react';

export interface PublishedNewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  scrapedAt: Date;
  publishedAt: Date | null;
  structuredData?: StructuredOutage | null;
}

/**
 * Moderation for news that is already live.
 *
 * The public feed carries no admin controls any more, so unpublishing,
 * deleting, and re-flagging happen here. Flagging an old notice as Caída de
 * Sistema reveals the same extractor the review queue uses, which is what makes
 * outage data reachable for the back catalogue.
 */
export function PublishedNewsList({ initialNews }: { initialNews: PublishedNewsItem[] }) {
  const [news, setNews] = useState<PublishedNewsItem[]>(initialNews);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Flags as edited in the browser, which may run ahead of what is stored.
  const [selectedFlags, setSelectedFlags] = useState<Record<string, NewsFlag[]>>(() =>
    Object.fromEntries(initialNews.map((item) => [item.id, item.flags]))
  );
  // Ids whose flag edits have been written back, for the inline confirmation.
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});

  /** Writes flag changes without altering the published state. */
  async function handleSaveFlags(item: PublishedNewsItem) {
    setBusy(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true, flags: selectedFlags[item.id] || [] }),
      });

      if (!response.ok) throw new Error(UI_TEXT.admin.publishedNews.flagsError);

      setNews((current) =>
        current.map((n) =>
          n.id === item.id ? { ...n, flags: selectedFlags[item.id] || [] } : n
        )
      );
      setSavedFlags((current) => ({ ...current, [item.id]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(null);
    }
  }

  async function handleUnpublish(item: PublishedNewsItem) {
    if (!confirm(UI_TEXT.admin.publishedNews.confirmUnpublish)) return;

    setBusy(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/news/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: false, flags: item.flags }),
      });

      if (!response.ok) throw new Error(UI_TEXT.admin.publishedNews.unpublishError);

      setNews((current) => current.filter((n) => n.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(item: PublishedNewsItem) {
    if (!confirm(UI_TEXT.admin.publishedNews.confirmDelete)) return;

    setBusy(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/news/${item.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(UI_TEXT.admin.publishedNews.deleteError);

      setNews((current) => current.filter((n) => n.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {news.length === 0 && !error && (
        <div className="rounded-lg border border-dashed border-border bg-gray-50 p-12 text-center dark:bg-gray-900">
          <p className="text-muted-foreground">{UI_TEXT.admin.publishedNews.empty}</p>
        </div>
      )}

      {news.map((item) => {
        const flags = selectedFlags[item.id] || [];
        const flagsChanged =
          flags.length !== item.flags.length ||
          flags.some((flag) => !item.flags.includes(flag));

        return (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-card p-6 dark:bg-gray-800"
          >
            <NewsCard news={item} />

            <div className="mt-4 space-y-4">
              <FlagSelector
                selected={flags}
                onChange={(next) => {
                  setSelectedFlags({ ...selectedFlags, [item.id]: next });
                  setSavedFlags((current) => ({ ...current, [item.id]: false }));
                }}
              />

              {flagsChanged && (
                <button
                  onClick={() => handleSaveFlags(item)}
                  disabled={busy === item.id}
                  className="flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  {busy === item.id
                    ? UI_TEXT.admin.publishedNews.savingFlags
                    : UI_TEXT.admin.publishedNews.saveFlags}
                </button>
              )}

              {savedFlags[item.id] && !flagsChanged && (
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {UI_TEXT.admin.publishedNews.flagsSaved}
                </p>
              )}

              {/* Same trigger as the review queue: the extractor appears the
                  moment the flag is ticked, which is how an old notice gets
                  outage data it never had. */}
              {flags.includes('CAIDA_SISTEMA') && (
                <OutageExtractor
                  newsId={item.id}
                  flags={flags}
                  initial={item.structuredData ?? null}
                />
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                <Link
                  href={newsPath({ id: item.id, title: item.title })}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  {UI_TEXT.admin.publishedNews.view}
                </Link>

                <button
                  onClick={() => handleUnpublish(item)}
                  disabled={busy === item.id}
                  className="flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <EyeOff className="h-3 w-3" />
                  {UI_TEXT.admin.publishedNews.unpublish}
                </button>

                <button
                  onClick={() => handleDelete(item)}
                  disabled={busy === item.id}
                  className="flex items-center gap-1 rounded px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  {UI_TEXT.admin.reject}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
