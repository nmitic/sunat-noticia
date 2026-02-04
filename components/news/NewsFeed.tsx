'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { NewsCard } from './NewsCard';
import { NewsFilter, FilterState } from './NewsFilter';
import { filterNews } from '@/lib/utils/filters';
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
}

interface NewsFeedProps {
  initialNews: NewsItem[];
  showFilters?: boolean;
}

export function NewsFeed({ initialNews, showFilters = true }: NewsFeedProps) {
  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    flags: [],
  });
  const [allNews, setAllNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialNews.length >= 50);
  const [cursor, setCursor] = useState<string | null>(
    initialNews.length > 0
      ? initialNews[initialNews.length - 1].originalDate.toISOString()
      : null
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  // Computed filtered news based on current filter state
  const filteredNews = useMemo(
    () => filterNews(allNews, filterState),
    [allNews, filterState]
  );

  // Fetch more news from API
  const fetchMoreNews = async () => {
    if (loading || !hasMore || !cursor) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/news?cursor=${cursor}&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch news');

      const data = await res.json();

      setAllNews(prev => [...prev, ...data.news]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error('Error loading more news:', error);
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
      {showFilters && (
        <NewsFilter
          currentFilters={filterState}
          onFilterChange={setFilterState}
        />
      )}

      <div className={`space-y-4 ${showFilters ? 'mt-6' : ''}`}>
        {filteredNews.length > 0 ? (
          <>
            {filteredNews.map((item) => (
              <NewsCard key={item.id} news={item} />
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
