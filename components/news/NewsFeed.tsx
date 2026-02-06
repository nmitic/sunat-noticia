'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { NewsCard } from './NewsCard';
import { NewsFilter, FilterState } from './NewsFilter';
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
  publishedAt: Date | null;
  adds?: boolean;
}

interface NewsFeedProps {
  initialNews: NewsItem[];
  embeded?: boolean;
  isAdmin?: boolean;
}

export function NewsFeed({ initialNews, embeded = false, isAdmin = false }: NewsFeedProps) {
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
  const buildApiUrl = (cursorValue: string | null) => {
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
  };

  // Fetch more news from API (for infinite scroll)
  const fetchMoreNews = async () => {
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
  };

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
  }, [hasMore, loading, cursor]);

  return (
    <div className="space-y-4">
      <div className={`sticky ${embeded ? 'top-4' : 'top-0'}`}>
        <NewsFilter
          currentFilters={currentFilters}
        />
      </div>

      <div className="space-y-4">
        {allNews.length > 0 ? (
          <>
            {allNews.map((item) => (
              <NewsCard key={item.id} news={item} isAdmin={isAdmin} />
            ))}

            {/* Observer target - triggers load when visible */}
            {hasMore && <div ref={observerTarget} className="h-20" />}

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Cargando más noticias...</div>
              </div>
            )}

            {/* End of results */}
            {!hasMore && allNews.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay más noticias
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
            <p className="text-gray-600">{UI_TEXT.filters.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
