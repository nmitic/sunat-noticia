'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
}

interface NewsFeedProps {
  initialNews: NewsItem[];
  embeded?: boolean;
}

export function NewsFeed({ initialNews, embeded = false }: NewsFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const getInitialFilters = (): FilterState => {
    const categoryParam = searchParams.get('category');
    const flagsParam = searchParams.get('flags');

    return {
      categories: categoryParam ? [categoryParam as NewsCategory] : [],
      flags: flagsParam ? (flagsParam.split(',') as NewsFlag[]) : [],
    };
  };

  const [filterState, setFilterState] = useState<FilterState>(getInitialFilters());
  const [allNews, setAllNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialNews.length >= 50);
  const [cursor, setCursor] = useState<string | null>(
    initialNews.length > 0
      ? initialNews[initialNews.length - 1].originalDate.toISOString()
      : null
  );
  const observerTarget = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Build URL with filter parameters
  const buildApiUrl = (cursorValue: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', '50');

    if (cursorValue) {
      params.set('cursor', cursorValue);
    }

    // Add category filter (single category, use first selected)
    if (filterState.categories.length > 0) {
      params.set('category', filterState.categories[0]);
    }

    // Add flags filter (comma-separated)
    if (filterState.flags.length > 0) {
      params.set('flags', filterState.flags.join(','));
    }

    return `/api/news?${params.toString()}`;
  };

  // Fetch news from API (used for both initial filter and load more)
  const fetchNews = async (cursorValue: string | null, append: boolean = true) => {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(cursorValue));
      if (!res.ok) throw new Error('Failed to fetch news');

      const data = await res.json();

      if (append) {
        setAllNews(prev => [...prev, ...data.news]);
      } else {
        setAllNews(data.news);
      }
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch more news from API (for infinite scroll)
  const fetchMoreNews = async () => {
    if (!hasMore || !cursor) return;
    await fetchNews(cursor, true);
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filterState.categories.length > 0) {
      params.set('category', filterState.categories[0]);
    }

    if (filterState.flags.length > 0) {
      params.set('flags', filterState.flags.join(','));
    }

    // Build new URL
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Update URL without triggering navigation
    router.replace(newUrl, { scroll: false });
  }, [filterState, pathname, router, embeded]);

  // Reset and fetch when filters change
  useEffect(() => {
    // Skip on initial mount - server already provided filtered data based on URL
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // When filters change, fetch new filtered data from API
    // Don't reset to initialNews since that might be filtered for a different URL
    if (filterState.categories.length > 0 || filterState.flags.length > 0) {
      fetchNews(null, false);
    } else {
      // Filters cleared - reset to initial unfiltered news
      setAllNews(initialNews);
      setHasMore(initialNews.length >= 50);
      setCursor(
        initialNews.length > 0
          ? initialNews[initialNews.length - 1].originalDate.toISOString()
          : null
      );
    }
  }, [filterState]);

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
      <div className={`sticky ${embeded ? 'top-4' : ' top-20'}`}>
        <NewsFilter
          currentFilters={filterState}
          onFilterChange={setFilterState}
        />
      </div>

      <div className="space-y-4">
        {allNews.length > 0 ? (
          <>
            {allNews.map((item) => (
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
