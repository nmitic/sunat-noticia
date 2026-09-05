import { NewsCategory } from '@/lib/db/schema';
import { getCategoryColorClasses } from '@/lib/utils/badges';
import { getCategoryLabel } from '@/lib/utils/constants';
import { NewsContent } from '@/components/news/NewsContent';
import { displayTitle } from '@/lib/outage/title';
import type { StructuredOutage } from '@/lib/outage/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface NewsCardProps {
  news: {
    id?: string;
    title: string;
    content: string;
    source: string;
    sourceUrl?: string | null;
    category: NewsCategory;
    originalDate: Date;
    scrapedAt?: Date;
    structuredData?: StructuredOutage | null;
  };
}

const getCategoryIcon = (category: NewsCategory) => {
  switch (category) {
    case 'OFICIAL':
      return <Image src="/sunat.svg" alt="SUNAT" width={16} height={16} />;
  }
};

export function NewsCard({ news }: NewsCardProps) {
  const dateStr = formatDistanceToNow(new Date(news.originalDate), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Same headline the public side shows, so an admin reviewing outage
              data sees the result of approving it. */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
            {displayTitle(news)}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{news.source}</p>
        </div>
        <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium flex items-center gap-2 ${getCategoryColorClasses(news.category)}`}>
          {getCategoryIcon(news.category)}
          {getCategoryLabel(news.category)}
        </span>
      </div>

      {/* Reviewing a notice means reading it, so the full text has to be
          reachable without leaving the panel. Same expander the public feed
          uses — clamped by default so a long queue stays scannable. */}
      <NewsContent content={news.content} />

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>{dateStr}</span>
        {news.sourceUrl && (
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Ver original
          </a>
        )}
      </div>
    </div>
  );
}
