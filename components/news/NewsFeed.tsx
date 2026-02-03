'use client';

import { useState, useMemo } from 'react';
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
  const [allNews] = useState<NewsItem[]>(initialNews);

  // Computed filtered news based on current filter state
  const filteredNews = useMemo(
    () => filterNews(allNews, filterState),
    [allNews, filterState]
  );

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
            <NewsCard key={item.id} news={item} />
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
