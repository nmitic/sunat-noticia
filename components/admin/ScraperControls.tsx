'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

const SCRAPERS = [
  { name: 'all', label: 'Todos' },
  { name: 'facebook-sunat', label: 'Social Media (Facebook)' },
  { name: 'oficial-sources', label: 'Oficial SUNAT' },
  { name: 'news-outlets', label: 'Outlets de Noticias' },
];

interface ScraperControlsProps {
  onScraperComplete?: () => void;
  isRefetching?: boolean;
}

export function ScraperControls({ onScraperComplete, isRefetching }: ScraperControlsProps) {
  const [selected, setSelected] = useState('facebook-sunat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function runScraper(scraperName: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (scraperName === 'all') {
        let totalNew = 0;
        let totalDuplicates = 0;

        for (const scraper of SCRAPERS.slice(1)) {
          const response = await fetch('/api/scheduler/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scraperName: scraper.name }),
          });

          if (response.ok) {
            const result = await response.json();
            totalNew += result.newCount || 0;
            totalDuplicates += result.duplicateCount || 0;
          }
        }

        setSuccess(
          `Completado: ${totalNew} noticias nuevas, ${totalDuplicates} duplicadas`
        );
        onScraperComplete?.();
      } else {
        const response = await fetch('/api/scheduler/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scraperName }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error ejecutando scraper');
        }

        const result = await response.json();
        setSuccess(
          `${result.newCount || 0} noticias nuevas, ${result.duplicateCount || 0} duplicadas`
        );
        onScraperComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card dark:bg-gray-800 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
        Ejecutar Scrapers
      </h2>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-red-800 dark:text-red-200 mb-4">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-green-800 dark:text-green-200 mb-4">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading || isRefetching}
          className="flex-1"
        >
          {SCRAPERS.map((scraper) => (
            <option key={scraper.name} value={scraper.name}>
              {scraper.label}
            </option>
          ))}
        </Select>
        <Button
          onClick={() => runScraper(selected)}
          disabled={loading || isRefetching}
        >
          {loading ? 'Ejecutando...' : isRefetching ? 'Cargando...' : 'Ejecutar'}
        </Button>
      </div>
    </div>
  );
}
