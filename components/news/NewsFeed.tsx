'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { NewsCard } from './NewsCard';
import { NewsFilter, FilterState } from './NewsFilter';
import { UI_TEXT } from '@/lib/utils/constants';
import { SearchX } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl?: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  publishedAt: Date | null;
}

interface NewsFeedProps {
  initialNews: NewsItem[];
  embeded?: boolean;
}

export function NewsFeed({ initialNews, embeded = false }: NewsFeedProps) {
  const searchParams = useSearchParams();

  // Read current filters directly from URL (no state needed)
  const getCurrentFilters = (): FilterState => {
    const categoryParam = searchParams.get('category');
    const flagsParam = searchParams.get('flags');

    return {
      categories: categoryParam ? [categoryParam as NewsCategory] : [],
      flags: flagsParam ? (flagsParam.split(',') as NewsFlag[]) : [],
    };
  };

  const currentFilters = getCurrentFilters();
  const [allNews, setAllNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialNews.length >= 50);
  const [cursor, setCursor] = useState<string | null>(
    initialNews.length > 0
      ? initialNews[initialNews.length - 1].originalDate.toISOString()
      : null
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  // Build URL with filter parameters (read from URL)
  const buildApiUrl = useCallback((cursorValue: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', '50');

    if (cursorValue) {
      params.set('cursor', cursorValue);
    }

    // Read filters directly from URL
    const categoryParam = searchParams.get('category');
    const flagsParam = searchParams.get('flags');

    // Add category filter
    if (categoryParam) {
      params.set('category', categoryParam);
    }

    // Add flags filter
    if (flagsParam) {
      params.set('flags', flagsParam);
    }

    return `/api/news?${params.toString()}`;
  }, [searchParams]);

  // Fetch more news from API (for infinite scroll)
  const fetchMoreNews = useCallback(async () => {
    if (!hasMore || !cursor || loading) return;

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(cursor));
      if (!res.ok) throw new Error('Failed to fetch news');

      const data = await res.json();

      setAllNews(prev => [...prev, ...data.news]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }, [hasMore, cursor, loading, buildApiUrl]);

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMoreNews();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchMoreNews, hasMore, loading]);

  return (
    <div className="space-y-4">
      {/* top-16 clears the sticky site header; the embed has no header */}
      <div className={`sticky z-30 ${embeded ? 'top-4' : 'top-16'} bg-background py-2`}>
        <NewsFilter currentFilters={currentFilters} />
      </div>

      <div className="space-y-4">
        {allNews.length > 0 ? (
          <>
            {allNews.map((item) => (
              <NewsCard key={item.id} news={item} embeded={embeded} />
            ))}

            {/* Observer target - triggers load when visible */}
            {hasMore && <div ref={observerTarget} className="h-20" />}

            {/* Loading state */}
            {loading && (
              <div className="space-y-4" aria-live="polite" aria-busy="true">
                <span className="sr-only">Cargando más noticias…</span>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-l-4 border-border border-l-transparent bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-28 rounded-full bg-muted" />
                      <div className="h-4 w-24 rounded bg-muted" />
                    </div>
                    <div className="mt-4 h-5 w-4/5 rounded bg-muted" />
                    <div className="mt-2 h-4 w-full rounded bg-muted" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                    <div className="mt-5 h-4 w-52 rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {/* End of results */}
            {!hasMore && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay más noticias
              </p>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <SearchX className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{UI_TEXT.filters.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
