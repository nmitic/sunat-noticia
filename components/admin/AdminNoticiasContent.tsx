'use client';

import { useState, useCallback } from 'react';
import { ReviewQueue } from './ReviewQueue';
import { PublishedNewsList, type PublishedNewsItem } from './PublishedNewsList';
import { ScraperControls } from './ScraperControls';
import { ScraperRunsLog } from './ScraperRunsLog';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import type { StructuredOutage } from '@/lib/outage/types';

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
  structuredData?: StructuredOutage | null;
}

interface AdminNoticiasContentProps {
  initialNews: NewsItem[];
  initialPublishedNews: PublishedNewsItem[];
}

type Tab = 'pending' | 'published';

export function AdminNoticiasContent({
  initialNews,
  initialPublishedNews,
}: AdminNoticiasContentProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isRefetching, setIsRefetching] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');

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
              {tab === 'pending' ? UI_TEXT.admin.reviewQueue : UI_TEXT.admin.publishedNews.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {tab === 'pending' ? (
                <>
                  Total: <span className="font-semibold">{news.length}</span> noticias pendientes
                </>
              ) : (
                UI_TEXT.admin.publishedNews.description
              )}
            </p>
          </div>

          {/* Published news has no controls on the public site any more, so the
              panel is the only place to reach it. */}
          <div
            role="tablist"
            aria-label="Estado de las noticias"
            className="flex gap-1 border-b border-border"
          >
            <TabButton
              active={tab === 'pending'}
              onClick={() => setTab('pending')}
              label={`${UI_TEXT.admin.tabPending} (${news.length})`}
            />
            <TabButton
              active={tab === 'published'}
              onClick={() => setTab('published')}
              label={UI_TEXT.admin.tabPublished}
            />
          </div>

          {tab === 'pending' ? (
            news.length > 0 ? (
              <ReviewQueue initialNews={news} onNewsUpdated={refetchNews} />
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-gray-50 dark:bg-gray-900 p-12 text-center">
                <p className="text-muted-foreground">{UI_TEXT.admin.noNews}</p>
              </div>
            )
          ) : (
            <PublishedNewsList initialNews={initialPublishedNews} />
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

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
