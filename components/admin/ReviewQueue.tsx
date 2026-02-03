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

export function ReviewQueue({ initialNews }: ReviewQueueProps) {
  const [news, setNews] = useState(initialNews);
  const [selectedFlags, setSelectedFlags] = useState<Record<string, NewsFlag[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200">
          <p className="text-sm font-medium">{error}</p>
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
