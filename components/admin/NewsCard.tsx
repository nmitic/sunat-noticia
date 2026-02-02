import { NewsCategory } from '@/lib/db/schema';
import { getCategoryColorClasses } from '@/lib/utils/badges';
import { getCategoryLabel } from '@/lib/utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Newspaper } from 'lucide-react';
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
  };
}

const getCategoryIcon = (category: NewsCategory) => {
  switch (category) {
    case 'OFICIAL':
      return <Image src="/sunat.svg" alt="SUNAT" width={16} height={16} />;
    case 'REDES_SOCIALES':
      return <Image src="/facebook.svg" alt="Facebook" width={16} height={16} />;
    case 'NOTICIAS':
      return <Newspaper className="w-4 h-4" />;
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">{news.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{news.source}</p>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium flex items-center gap-2 ${getCategoryColorClasses(news.category)}`}>
          {getCategoryIcon(news.category)}
          {getCategoryLabel(news.category)}
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{news.content}</p>

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
