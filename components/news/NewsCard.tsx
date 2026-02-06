'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategoryColorClasses, getFlagColorClasses } from '@/lib/utils/badges';
import { getCategoryLabel, getFlagLabel, UI_TEXT } from '@/lib/utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Newspaper, Trash2, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  isAdmin?: boolean;
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

export function NewsCard({ news, isAdmin = false }: NewsCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const dateStr = formatDistanceToNow(new Date(news.originalDate), {
    addSuffix: true,
    locale: es,
  });

  const flags = news.flags || [];

  const handleDelete = async () => {
    if (!news.id) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/news/${news.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la noticia');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Error al eliminar la noticia');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnpublish = async () => {
    if (!news.id) return;

    if (!confirm('¿Estás seguro de que quieres despublicar esta noticia?')) {
      return;
    }

    setIsUnpublishing(true);
    try {
      const response = await fetch(`/api/news/${news.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: false,
          flags: news.flags || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Error al despublicar la noticia');
      }

      router.refresh();
    } catch (error) {
      console.error('Error unpublishing news:', error);
      alert('Error al despublicar la noticia');
    } finally {
      setIsUnpublishing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-xl">
              {news.title}
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
        <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{news.content}</p>

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
        <div className="flex items-center gap-4 flex-1">
          <span className="text-xs text-gray-500">{dateStr}</span>
          {news.sourceUrl && (
            <a
              href={news.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Leer más →
            </a>
          )}
        </div>

        {isAdmin && news.id && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleUnpublish}
              disabled={isUnpublishing}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Despublicar noticia"
            >
              <EyeOff className="w-3 h-3" />
              {isUnpublishing ? 'Despublicando...' : 'Despublicar'}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar noticia"
            >
              <Trash2 className="w-3 h-3" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
