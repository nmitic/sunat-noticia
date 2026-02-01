'use client';

import { useState, useEffect, useMemo } from 'react';
import { NewsCategory, NewsFlag } from '@prisma/client';
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

  // Computed filtered news based on current filter state
  const filteredNews = useMemo(
    () => filterNews(allNews, filterState),
    [allNews, filterState]
  );

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('/api/sse');

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new-news') {
          // Add new news to the top of allNews
          setAllNews((prevNews) => {
            // Avoid duplicates
            if (prevNews.some((n) => n.id === data.data.id)) {
              return prevNews;
            }

            return [data.data, ...prevNews];
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    });

    eventSource.addEventListener('error', () => {
      console.error('SSE connection error');
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, []);

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
          filteredNews.map((item) => (
            <NewsCard key={item.id} news={item} showNewBadge={true} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
            <p className="text-gray-600">{UI_TEXT.filters.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
