'use client';

import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { UI_TEXT, getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { toggleFlag } from '@/lib/utils/filters';
import { getFlagColorClasses } from '@/lib/utils/badges';
import { Newspaper } from 'lucide-react';
import Image from 'next/image';

export interface FilterState {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

interface NewsFilterProps {
  onFilterChange: (filters: FilterState) => void;
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

export function NewsFilter({ onFilterChange, currentFilters }: NewsFilterProps) {
  const categories: NewsCategory[] = ['OFICIAL', 'REDES_SOCIALES', 'NOTICIAS'];
  const flags: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA', 'SALA_PRENSA'];

  const handleToggleCategory = (category: NewsCategory) => {
    const isActive = currentFilters.categories.includes(category);
    onFilterChange({
      ...currentFilters,
      categories: isActive ? [] : [category],
    });
  };

  const handleToggleFlag = (flag: NewsFlag) => {
    const updatedFlags = toggleFlag(currentFilters.flags, flag);
    onFilterChange({
      ...currentFilters,
      flags: updatedFlags,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      categories: [],
      flags: [],
    });
  };

  const hasActiveFilters = currentFilters.categories.length > 0 || currentFilters.flags.length > 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-6 space-y-2 sm:space-y-4">
      {/* Sources Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="mb-2 sm:mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {UI_TEXT.filters.sourcesLabel}
        </div>
        <div className="flex overflow-x-auto sm:grid sm:grid-cols-4 gap-1.5 sm:gap-2 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
          {/* "Todas" link */}
          <button
            onClick={() => onFilterChange({ ...currentFilters, categories: [] })}
            className={`cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 sm:py-2 px-3 sm:px-4 rounded-md whitespace-nowrap shrink-0 ${currentFilters.categories.length === 0
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-blue-400'
              }`}
          >
            {UI_TEXT.filters.allCategories}
          </button>

          {/* Source links with icons */}
          {categories.map((category) => {
            const Icon = sourceIcons[category];
            const isActive = currentFilters.categories.includes(category);
            return (
              <button
                key={category}
                onClick={() => handleToggleCategory(category)}
                className={`cursor-pointer flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 sm:py-2 px-3 sm:px-4 rounded-md whitespace-nowrap shrink-0 ${isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-blue-400'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {getCategoryLabel(category)}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Flags Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="py-2 sm:py-3 flex justify-between mb-2 sm:mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <div>{UI_TEXT.filters.flagsLabel}</div>
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <>
              <button
                onClick={handleClearFilters}
                className="cursor-pointer w-full sm:w-auto underline"
              >
                {UI_TEXT.filters.clearFilters}
              </button>
            </>
          )}
        </div>
        <div className="flex overflow-x-auto sm:flex-wrap gap-2 sm:gap-3 pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0">
          {flags.map((flag) => (
            <div key={flag} className="flex items-center shrink-0">
              <Checkbox
                id={`flag-${flag}`}
                checked={currentFilters.flags.includes(flag)}
                onCheckedChange={() => handleToggleFlag(flag)}
                className="sr-only"
              />
              <label
                htmlFor={`flag-${flag}`}
                className={`text-sm font-medium cursor-pointer px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${currentFilters.flags.includes(flag)
                  ? getFlagColorClasses(flag)
                  : 'text-gray-700 dark:text-gray-300'
                  }`}
              >
                {getFlagLabel(flag)}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
