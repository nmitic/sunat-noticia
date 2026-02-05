'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { Separator } from '@/components/ui/separator';
import { UI_TEXT, getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { getFlagColorClasses } from '@/lib/utils/badges';
import { Newspaper } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface FilterState {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

interface NewsFilterProps {
  currentFilters: FilterState;
}

const sourceIcons: Record<NewsCategory, React.ComponentType<{ className?: string }>> = {
  OFICIAL: ({ className }) => (
    <Image src="/sunat.svg" alt="SUNAT" width={16} height={16} className={className} />
  ),
  REDES_SOCIALES: ({ className }) => (
    <Image src="/facebook.svg" alt="Facebook" width={16} height={16} className={className} />
  ),
  NOTICIAS: Newspaper,
};

export function NewsFilter({ currentFilters }: NewsFilterProps) {
  const pathname = usePathname();
  const categories: NewsCategory[] = ['OFICIAL', 'REDES_SOCIALES', 'NOTICIAS'];
  const flags: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA', 'SALA_PRENSA'];

  // Build href for category link (null = "Todas")
  const buildCategoryHref = (category: NewsCategory | null) => {
    const params = new URLSearchParams();

    if (category) {
      params.set('category', category);
    }

    // Preserve existing flags
    if (currentFilters.flags.length > 0) {
      params.set('flags', currentFilters.flags.join(','));
    }

    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

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
      {/* Sources Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="hidden md:block mb-2 sm:mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {UI_TEXT.filters.sourcesLabel}
        </div>
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 gap-1.5 sm:gap-2 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="md:hidden flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {UI_TEXT.filters.sourcesLabel}
          </div>
          {/* "Todas" link */}
          <Link
            href={buildCategoryHref(null)}
            className={`cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 sm:py-2 px-3 sm:px-4 rounded-md whitespace-nowrap shrink-0 ${currentFilters.categories.length === 0
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-blue-400'
              }`}
          >
            {UI_TEXT.filters.allCategories}
          </Link>

          {/* Source links with icons */}
          {categories.map((category) => {
            const Icon = sourceIcons[category];
            const isActive = currentFilters.categories.includes(category);
            return (
              <Link
                key={category}
                href={buildCategoryHref(category)}
                className={`cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 sm:py-2 px-3 sm:px-4 rounded-md whitespace-nowrap shrink-0 ${isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-blue-400'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {getCategoryLabel(category)}
              </Link>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Flags Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="py-2 sm:py-3 flex justify-between mb-2 sm:mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <div className="hidden md:block">{UI_TEXT.filters.flagsLabel}</div>
        </div>
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="md:hidden flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300">{UI_TEXT.filters.flagsLabel}</div>

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
