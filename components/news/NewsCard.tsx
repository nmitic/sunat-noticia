'use client';

import { useEffect, useState } from 'react';
import { NewsCategory, NewsFlag } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategoryColorClasses, getFlagColorClasses, isNew, getNuevoBadgeClasses } from '@/lib/utils/badges';
import { getCategoryLabel, getFlagLabel, UI_TEXT } from '@/lib/utils/constants';
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
    flags?: NewsFlag[];
    originalDate: Date;
    publishedAt?: Date | null;
  };
  showNewBadge?: boolean;
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

export function NewsCard({ news, showNewBadge = false }: NewsCardProps) {
  const [isNewBadge, setIsNewBadge] = useState(
    showNewBadge ? isNew(news.publishedAt || null) : false
  );

  // Re-check isNew status every minute to auto-remove badge
  useEffect(() => {
    if (!showNewBadge) return;

    const interval = setInterval(() => {
      setIsNewBadge(isNew(news.publishedAt || null));
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [showNewBadge, news.publishedAt]);

  const dateStr = formatDistanceToNow(new Date(news.originalDate), {
    addSuffix: true,
    locale: es,
  });

  const flags = news.flags || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="flex items-center gap-2 flex-wrap text-xl">
              {news.title}
              {isNewBadge && (
                <Badge variant="outline" className={getNuevoBadgeClasses()}>
                  {UI_TEXT.badges.NUEVO}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">{news.source}</p>
          </div>
          <Badge variant="outline" className={`flex items-center gap-2 ${getCategoryColorClasses(news.category)}`}>
            {getCategoryIcon(news.category)}
            {getCategoryLabel(news.category)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-700 line-clamp-3">{news.content}</p>

        {flags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {flags.map((flag) => (
              <Badge key={flag} variant="outline" className={getFlagColorClasses(flag)}>
                {getFlagLabel(flag)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-gray-500">{dateStr}</span>
        {news.sourceUrl && (
          <a
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Ver original →
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
