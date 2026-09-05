'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getFlagChipClasses,
  getPrimaryFlag,
  getSeverity,
  getSeverityAccentClasses,
  getSeverityTintClasses,
} from '@/lib/utils/badges';
import { FlagIcon } from '@/lib/utils/flag-icons';
import { NewsContent } from '@/components/news/NewsContent';
import { getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2, EyeOff, Calendar, ExternalLink, BadgeCheck, Download, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatAbsoluteDate } from '@/lib/utils/news-date';
import { newsPath } from '@/lib/utils/news-url';

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
  /** Rendered inside a third-party iframe — links must escape the frame. */
  embeded?: boolean;
}

export function NewsCard({ news, isAdmin = false, embeded = false }: NewsCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const originalDate = new Date(news.originalDate);
  const absoluteDate = formatAbsoluteDate(originalDate);
  const relativeDate = formatDistanceToNow(originalDate, {
    addSuffix: true,
    locale: es,
  });

  // Sala de Prensa links point at Word documents rather than web pages, so the
  // action has to promise a download instead of a page.
  const isDownload = /\.(docx?|pdf|xlsx?)(\?|$)/i.test(news.sourceUrl ?? '');

  // Every item gets its own shareable page. This card only ever renders
  // published rows (the admin queue has its own card), so the route resolves
  // whether or not an admin is signed in.
  const detailPath = news.id ? newsPath({ id: news.id, title: news.title }) : null;

  // In an embed the feed lives in someone else's iframe, so navigating in
  // place would strand the reader inside a frame they can't get out of.
  const linkTarget = embeded ? { target: '_blank', rel: 'noopener' } : {};

  const flags = news.flags || [];
  const primaryFlag = getPrimaryFlag(flags);
  const secondaryFlags = flags.filter((flag) => flag !== primaryFlag);
  const severity = primaryFlag ? getSeverity(primaryFlag) : null;

  // Unflagged items stay visually quiet so that flagged ones carry weight.
  const accentClasses = severity
    ? `border-l-4 ${getSeverityAccentClasses(severity)}`
    : 'border-l-4 border-l-transparent';
  const tintClasses = severity ? getSeverityTintClasses(severity) : '';

  // Only surface the approval time when it meaningfully trails the source date.
  const publishedAt = news.publishedAt ? new Date(news.publishedAt) : null;
  const dateTitle =
    publishedAt && Math.abs(publishedAt.getTime() - originalDate.getTime()) > 60 * 60 * 1000
      ? `Publicado en SUNAT Noticias el ${format(publishedAt, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`
      : undefined;

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
    <Card
      className={`group gap-0 overflow-hidden py-0 transition-all hover:border-foreground/15 hover:shadow-md ${accentClasses}`}
    >
      {/* Severity row + verified source mark */}
      <div
        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 pt-4 pb-3 ${tintClasses}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryFlag ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${getFlagChipClasses(primaryFlag)}`}
            >
              <FlagIcon flag={primaryFlag} className="size-3.5" />
              {getFlagLabel(primaryFlag)}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Comunicado
            </span>
          )}

          {secondaryFlags.map((flag) => (
            <span
              key={flag}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${getFlagChipClasses(flag)}`}
            >
              <FlagIcon flag={flag} className="size-3" />
              {getFlagLabel(flag)}
            </span>
          ))}
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Image src="/sunat.svg" alt="" width={14} height={14} aria-hidden="true" />
          SUNAT {getCategoryLabel(news.category)}
          <BadgeCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </span>
      </div>

      {/* Headline + excerpt */}
      <div className="space-y-2 px-5 p-4">
        <h3 className="line-clamp-3 text-lg leading-snug font-semibold text-balance">
          {detailPath ? (
            // Whole-card links would swallow the "Ver más" expander and the
            // action buttons, so only the headline navigates.
            <Link
              href={detailPath}
              {...linkTarget}
              className="underline-offset-4 hover:underline"
            >
              {news.title}
            </Link>
          ) : (
            news.title
          )}
        </h3>

        <NewsContent content={news.content} />
      </div>

      {/* Date bar — the absolute date leads, the relative one supports it */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 py-3">
        <time
          dateTime={originalDate.toISOString()}
          title={dateTitle}
          className="inline-flex items-center gap-2 text-sm"
        >
          <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-foreground">{absoluteDate}</span>
          <span className="text-muted-foreground">· {relativeDate}</span>
        </time>

        <div className="flex items-center gap-1">
          {isAdmin && news.id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className="text-muted-foreground hover:text-foreground"
                title="Despublicar noticia"
              >
                <EyeOff />
                {isUnpublishing ? 'Despublicando...' : 'Despublicar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Eliminar noticia"
              >
                <Trash2 />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </>
          )}

          {detailPath && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={detailPath} {...linkTarget}>
                Ver noticia
                <ArrowRight />
              </Link>
            </Button>
          )}

          {news.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                {isDownload ? 'Descargar nota de prensa' : 'Leer noticia oficial'}
                {isDownload ? <Download /> : <ExternalLink />}
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
