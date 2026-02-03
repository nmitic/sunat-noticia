'use client';

import { useState } from 'react';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { NewsCard } from './NewsCard';
import { FlagSelector } from './FlagSelector';
import { UI_TEXT } from '@/lib/utils/constants';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  scrapedAt: Date;
}

interface ReviewQueueProps {
  initialNews: NewsItem[];
  onNewsUpdated?: () => void;
}

export function ReviewQueue({ initialNews, onNewsUpdated }: ReviewQueueProps) {
  const [news, setNews] = useState(initialNews);
  const [selectedFlags, setSelectedFlags] = useState<Record<string, NewsFlag[]>>(() => {
    const initial: Record<string, NewsFlag[]> = {};
    for (const item of initialNews) {
      if (item.flags.length > 0) {
        initial[item.id] = item.flags;
      }
    }
    return initial;
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState<'publish' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(newsId: string) {
    setLoading(newsId);
    setError(null);

    try {
      const flags = selectedFlags[newsId] || [];

      const response = await fetch(`/api/news/${newsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true, flags }),
      });

      if (!response.ok) {
        throw new Error('Error al publicar la noticia');
      }

      // Remove from list
      setNews(news.filter((n) => n.id !== newsId));
      setSelectedFlags((prev) => {
        const newFlags = { ...prev };
        delete newFlags[newsId];
        return newFlags;
      });

      // Trigger parent update
      onNewsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(null);
    }
  }

  async function handleReject(newsId: string) {
    setLoading(newsId);
    setError(null);

    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al rechazar la noticia');
      }

      // Remove from list
      setNews(news.filter((n) => n.id !== newsId));
      setSelectedFlags((prev) => {
        const newFlags = { ...prev };
        delete newFlags[newsId];
        return newFlags;
      });

      // Trigger parent update
      onNewsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(null);
    }
  }

  async function handlePublishAll() {
    setBulkLoading('publish');
    setError(null);

    try {
      const newsIds = news.map((n) => n.id);

      const response = await fetch('/api/news/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsIds, flags: selectedFlags }),
      });

      if (!response.ok) {
        throw new Error('Error al publicar las noticias');
      }

      // Clear all items and refresh
      setNews([]);
      setSelectedFlags({});
      onNewsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBulkLoading(null);
    }
  }

  async function handleRejectAll() {
    setBulkLoading('reject');
    setError(null);

    try {
      const newsIds = news.map((n) => n.id);

      const response = await fetch('/api/news/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsIds }),
      });

      if (!response.ok) {
        throw new Error('Error al rechazar las noticias');
      }

      // Clear all items and refresh
      setNews([]);
      setSelectedFlags({});
      onNewsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBulkLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {news.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={handlePublishAll}
            disabled={bulkLoading !== null || loading !== null}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {bulkLoading === 'publish' ? 'Publicando todas...' : 'Publicar todas'}
          </button>
          <button
            onClick={handleRejectAll}
            disabled={bulkLoading !== null || loading !== null}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {bulkLoading === 'reject' ? 'Rechazando todas...' : 'Rechazar todas'}
          </button>
        </div>
      )}

      {news.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-card dark:bg-gray-800 p-6">
          <NewsCard news={item} />

          <div className="mt-4 space-y-4">
            <FlagSelector
              selected={selectedFlags[item.id] || []}
              onChange={(flags) =>
                setSelectedFlags({ ...selectedFlags, [item.id]: flags })
              }
            />

            <div className="flex gap-3">
              <button
                onClick={() => handlePublish(item.id)}
                disabled={loading === item.id}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:brightness-110 disabled:bg-muted transition-colors"
              >
                {loading === item.id ? 'Publicando...' : UI_TEXT.admin.publish}
              </button>
              <button
                onClick={() => handleReject(item.id)}
                disabled={loading === item.id}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:brightness-110 disabled:bg-muted transition-colors"
              >
                {loading === item.id ? 'Rechazando...' : UI_TEXT.admin.reject}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
