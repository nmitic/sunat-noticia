import { NewsCategory, NewsFlag } from '@/lib/db/schema';

export interface NewsFilterOptions {
  categories: NewsCategory[];
  flags: NewsFlag[];
}

/**
 * Filters news items based on selected categories and flags
 *
 * @param news - Array of news items to filter
 * @param filters - Filter options with categories and flags
 * @returns Filtered array of news items
 *
 * Category filter: Multiple selection = OR (union)
 * Flag filter: Multiple selection = OR (union)
 * Category + Flags together: AND (intersection)
 */
export function filterNews<T extends { category: NewsCategory; flags: NewsFlag[] }>(
  news: T[],
  filters: NewsFilterOptions
): T[] {
  return news.filter((item) => {
    // Category filter: if empty array, show all; else show only selected categories
    const categoryMatch =
      filters.categories.length === 0 ||
      filters.categories.includes(item.category);

    // Flag filter: if empty array, show all; else show items with at least one matching flag
    const flagMatch =
      filters.flags.length === 0 ||
      filters.flags.some(flag => item.flags.includes(flag));

    // Both conditions must be true (AND logic)
    return categoryMatch && flagMatch;
  });
}

/**
 * Toggles a category in the filter array
 */
export function toggleCategory(
  categories: NewsCategory[],
  category: NewsCategory
): NewsCategory[] {
  const index = categories.indexOf(category);
  if (index > -1) {
    return categories.filter(c => c !== category);
  }
  return [...categories, category];
}

/**
 * Toggles a flag in the filter array
 */
export function toggleFlag(
  flags: NewsFlag[],
  flag: NewsFlag
): NewsFlag[] {
  const index = flags.indexOf(flag);
  if (index > -1) {
    return flags.filter(f => f !== flag);
  }
  return [...flags, flag];
}
