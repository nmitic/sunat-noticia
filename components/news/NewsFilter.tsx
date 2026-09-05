'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { getFlagLabel } from '@/lib/utils/constants';
import { getFlagColorClasses } from '@/lib/utils/badges';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface FilterState {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

interface NewsFilterProps {
  currentFilters: FilterState;
}

export function NewsFilter({ currentFilters }: NewsFilterProps) {
  const pathname = usePathname();
  const flags: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA', 'SALA_PRENSA'];

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
      params.set('flags', flag); // Set single flag
    }
    // If currently active, don't add flags param (clears it)

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  return (
    <div className=" rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-6 space-y-2 sm:space-y-4">
      {/* Flags Section */}
      <div className="space-y-2 sm:space-y-3">

        <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">

          {flags.map((flag) => {
            const isActive = currentFilters.flags.includes(flag);
            return (
              <Link
                key={flag}
                href={buildFlagHref(flag)}
                className={`text-sm text-center font-medium cursor-pointer px-2 py-0.5 sm:py-1 rounded whitespace-nowrap transition-opacity ${isActive
                  ? getFlagColorClasses(flag)
                  : 'text-gray-700 dark:text-gray-300 hover:opacity-70'
                  }`}
              >
                {getFlagLabel(flag)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
