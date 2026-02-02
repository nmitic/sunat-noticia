'use client';

import { NewsCategory, NewsFlag } from '@prisma/client';
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
  const flags: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA'];

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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
      {/* Sources Section */}
      <div className="space-y-3">
        <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {UI_TEXT.filters.sourcesLabel}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* "Todas" link */}
          <button
            onClick={() => onFilterChange({ ...currentFilters, categories: [] })}
            className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors py-2 px-4 rounded-md ${currentFilters.categories.length === 0
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
                className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors py-2 px-4 rounded-md ${isActive
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
      <div className="space-y-3">
        <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {UI_TEXT.filters.flagsLabel}
        </div>
        <div className="flex flex-wrap gap-3">
          {flags.map((flag) => (
            <div key={flag} className="flex items-center space-x-2">
              <Checkbox
                id={`flag-${flag}`}
                checked={currentFilters.flags.includes(flag)}
                onCheckedChange={() => handleToggleFlag(flag)}
              />
              <label
                htmlFor={`flag-${flag}`}
                className={`text-sm font-medium cursor-pointer px-2 py-1 rounded ${currentFilters.flags.includes(flag)
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

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            onClick={handleClearFilters}
            className="w-full sm:w-auto bg-primary hover:brightness-110"
          >
            {UI_TEXT.filters.clearFilters}
          </Button>
        </>
      )}
    </div>
  );
}
