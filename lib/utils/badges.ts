import { NewsCategory, NewsFlag } from '@prisma/client';

/**
 * Check if a news item is "new" (published within the last hour)
 */
export function isNew(publishedAt: Date | null): boolean {
  if (!publishedAt) return false;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return publishedAt > oneHourAgo;
}

/**
 * Get Tailwind color classes for a flag
 */
export function getFlagColorClasses(flag: NewsFlag): string {
  const colors: Record<NewsFlag, string> = {
    IMPORTANTE: 'bg-red-100 text-red-800',
    ACTUALIZACION: 'bg-blue-100 text-blue-800',
    URGENTE: 'bg-orange-100 text-orange-800',
    CAIDA_SISTEMA: 'bg-purple-100 text-purple-800',
  };

  return colors[flag] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Get Tailwind color classes for a category
 */
export function getCategoryColorClasses(category: NewsCategory): string {
  const colors: Record<NewsCategory, string> = {
    OFICIAL: 'bg-green-100 text-green-800 border border-green-300',
    REDES_SOCIALES: 'bg-blue-100 text-blue-800 border border-blue-300',
    NOTICIAS: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  };

  return colors[category] || 'bg-gray-100 text-gray-800 border border-gray-300';
}

/**
 * Get Tailwind color classes for the "Nuevo" badge
 */
export function getNuevoBadgeClasses(): string {
  return 'bg-green-100 text-green-800 border border-green-300 animate-pulse';
}
