'use client';

import { useState } from 'react';
import { NewsCategory, NewsFlag } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { UI_TEXT, getCategoryLabel, getFlagLabel } from '@/lib/utils/constants';
import { toggleCategory, toggleFlag } from '@/lib/utils/filters';

export interface FilterState {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

interface NewsFilterProps {
  onFilterChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export function NewsFilter({ onFilterChange, currentFilters }: NewsFilterProps) {
  const categories: NewsCategory[] = ['OFICIAL', 'REDES_SOCIALES', 'NOTICIAS'];
  const flags: NewsFlag[] = ['IMPORTANTE', 'ACTUALIZACION', 'URGENTE', 'CAIDA_SISTEMA'];

  const handleToggleCategory = (category: NewsCategory) => {
    const updatedCategories = toggleCategory(currentFilters.categories, category);
    onFilterChange({
      ...currentFilters,
      categories: updatedCategories,
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
      {/* Categories Section */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">
          {UI_TEXT.filters.categoriesLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {/* "Todas" button */}
          <Button
            variant={currentFilters.categories.length === 0 ? 'default' : 'outline'}
            onClick={() => onFilterChange({ ...currentFilters, categories: [] })}
            className="h-auto px-3 py-2 text-sm bg-primary hover:brightness-110 text-primary-foreground"
          >
            {UI_TEXT.filters.allCategories}
          </Button>

          {/* Category buttons */}
          {categories.map((category) => (
            <Button
              key={category}
              variant={
                currentFilters.categories.includes(category)
                  ? 'default'
                  : 'outline'
              }
              onClick={() => handleToggleCategory(category)}
              className="h-auto px-3 py-2 text-sm bg-primary hover:brightness-110 text-primary-foreground"
            >
              {getCategoryLabel(category)}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Flags Section */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700">
          {UI_TEXT.filters.flagsLabel}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {flags.map((flag) => (
            <div key={flag} className="flex items-center space-x-2">
              <Checkbox
                id={`flag-${flag}`}
                checked={currentFilters.flags.includes(flag)}
                onCheckedChange={() => handleToggleFlag(flag)}
              />
              <label
                htmlFor={`flag-${flag}`}
                className="text-sm font-medium text-gray-700 cursor-pointer"
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
            variant="outline"
            onClick={handleClearFilters}
            className="w-full sm:w-auto bg-primary hover:brightness-110 text-primary-foreground"
          >
            {UI_TEXT.filters.clearFilters}
          </Button>
        </>
      )}
    </div>
  );
}
