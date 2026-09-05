'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { getFlagLabel, UI_TEXT } from '@/lib/utils/constants';
import { getFlagChipClasses } from '@/lib/utils/badges';
import { FlagIcon } from '@/lib/utils/flag-icons';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface FilterState {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

interface NewsFilterProps {
  currentFilters: FilterState;
}

// Ordered by severity, so the bar reads most- to least-urgent.
const FILTER_FLAGS: NewsFlag[] = [
  'URGENTE',
  'CAIDA_SISTEMA',
  'IMPORTANTE',
  'ACTUALIZACION',
  'SALA_PRENSA',
];

export function NewsFilter({ currentFilters }: NewsFilterProps) {
  const pathname = usePathname();
  const hasActiveFilter = currentFilters.flags.length > 0;

  // Build href for flag link (single selection, toggle if active)
  const buildFlagHref = (flag: NewsFlag) => {
    const params = new URLSearchParams();

    // Preserve category
    if (currentFilters.categories.length > 0) {
      params.set('category', currentFilters.categories[0]);
    }

    // Single flag selection: if clicking active flag, clear it; else set it
    const isCurrentlyActive = currentFilters.flags.includes(flag);
    if (!isCurrentlyActive) {
      params.set('flags', flag);
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div
          className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
          role="group"
          aria-label="Filtrar noticias por etiqueta"
        >
          {FILTER_FLAGS.map((flag) => {
            const isActive = currentFilters.flags.includes(flag);

            return (
              <Link
                key={flag}
                href={buildFlagHref(flag)}
                aria-pressed={isActive}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? `${getFlagChipClasses(flag)} ring-2 ring-offset-1 ring-offset-card`
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <FlagIcon flag={flag} className="size-3.5" />
                {getFlagLabel(flag)}
              </Link>
            );
          })}
        </div>

        {hasActiveFilter && (
          <Link
            href={pathname}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{UI_TEXT.filters.clearFilters}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
