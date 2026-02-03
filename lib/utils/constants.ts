import { NewsCategory, NewsFlag } from '@/lib/db/schema';

export const UI_TEXT = {
  categories: {
    OFICIAL: 'Oficial',
    REDES_SOCIALES: 'Redes Sociales',
    NOTICIAS: 'Noticias',
  },
  flags: {
    IMPORTANTE: 'Importante',
    ACTUALIZACION: 'Actualización',
    URGENTE: 'Urgente',
    CAIDA_SISTEMA: 'Caída de Sistema',
  },
  admin: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    publish: 'Publicar',
    reject: 'Rechazar',
    reviewQueue: 'Noticias Pendientes',
    published: 'Noticias Publicadas',
    noNews: 'No hay noticias pendientes',
    selectFlags: 'Selecciona etiquetas:',
    runScraper: 'Ejecutar Scraper',
  },
  public: {
    subscribe: 'Suscríbete a las noticias de SUNAT',
    emailPlaceholder: 'correo@ejemplo.com',
    subscribeButton: 'Suscribirse',
    noNews: 'No hay noticias disponibles',
    loading: 'Cargando...',
    error: 'Error al cargar las noticias',
  },
  filters: {
    allCategories: 'Todas',
    clearFilters: 'Limpiar filtros',
    sourcesLabel: 'Fuentes:',
    flagsLabel: 'Etiquetas:',
    noResults: 'No hay noticias que coincidan con los filtros seleccionados',
  },
};

export function getCategoryLabel(category: NewsCategory): string {
  return UI_TEXT.categories[category] || category;
}

export function getFlagLabel(flag: NewsFlag): string {
  return UI_TEXT.flags[flag] || flag;
}
