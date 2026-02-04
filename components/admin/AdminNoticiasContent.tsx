'use client';

import { useState, useCallback } from 'react';
import { ReviewQueue } from './ReviewQueue';
import { ScraperControls } from './ScraperControls';
import { ScraperRunsLog } from './ScraperRunsLog';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';

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

interface AdminNoticiasContentProps {
  initialNews: NewsItem[];
}

export function AdminNoticiasContent({ initialNews }: AdminNoticiasContentProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isRefetching, setIsRefetching] = useState(false);

  const refetchNews = useCallback(async () => {
    setIsRefetching(true);
    try {
      const response = await fetch('/api/admin/unpublished-news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Error refetching news:', error);
    } finally {
      setIsRefetching(false);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main content area */}
      <div className="flex-1 min-w-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              {UI_TEXT.admin.reviewQueue}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold">{news.length}</span> noticias pendientes
            </p>
          </div>

          {news.length > 0 ? (
            <ReviewQueue initialNews={news} onNewsUpdated={refetchNews} />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-gray-50 dark:bg-gray-900 p-12 text-center">
              <p className="text-muted-foreground">{UI_TEXT.admin.noNews}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 shrink-0">
        <ScraperControls onScraperComplete={refetchNews} isRefetching={isRefetching} />
        <ScraperRunsLog />
      </div>
    </div>
  );
}
