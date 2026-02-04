'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const SCRAPER_LABELS: Record<string, string> = {
  'facebook-sunat': 'Facebook',
  'oficial-sources-mensaje': 'Mensaje',
  'oficial-sources-sala': 'Sala de Prensa',
  'oficial-sources-institucion': 'Institucional',
  'noticias-la-republica': 'La República',
  'noticias-gestion': 'Gestión',
};

function getScraperLabel(name: string): string {
  return SCRAPER_LABELS[name] ?? name;
}

interface ScraperRunItem {
  id: string;
  scraperName: string;
  status: string;
  itemsScraped: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export function ScraperRunsLog() {
  const [runs, setRuns] = useState<ScraperRunItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    try {
      const response = await fetch('/api/admin/scraper-runs');
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Error fetching scraper runs:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card dark:bg-gray-800 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
        Historial de Scrapers
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay ejecuciones registradas</p>
      ) : (
        <div className="space-y-3 max-h-125 overflow-y-auto">
          {runs.map((run) => (
            <div
              key={run.id}
              className="rounded-md border border-border bg-gray-50 dark:bg-gray-900 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {getScraperLabel(run.scraperName)}
                </span>
                <Badge
                  variant={run.status === 'success' ? 'default' : 'destructive'}
                  className={
                    run.status === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : ''
                  }
                >
                  {run.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(run.startedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
                <span className="font-medium">
                  {run.itemsScraped} {run.itemsScraped === 1 ? 'item' : 'items'}
                </span>
              </div>
              {run.errorMessage && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate" title={run.errorMessage}>
                  {run.errorMessage}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
