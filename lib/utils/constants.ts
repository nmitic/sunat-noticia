import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import type { OutageKind } from '@/lib/outage/types';

export const UI_TEXT = {
  categories: {
    OFICIAL: 'Oficial',
  },
  flags: {
    IMPORTANTE: 'Importante',
    ACTUALIZACION: 'Actualización',
    URGENTE: 'Urgente',
    CAIDA_SISTEMA: 'Caída de Sistema',
    SALA_PRENSA: 'Sala de Prensa',
  },
  admin: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    publish: 'Publicar',
    reject: 'Eliminar',
    reviewQueue: 'Noticias Pendientes',
    published: 'Noticias Publicadas',
    noNews: 'No hay noticias pendientes',
    selectFlags: 'Selecciona etiquetas:',
    runScraper: 'Ejecutar Scraper',
    tabPending: 'Pendientes',
    tabPublished: 'Publicadas',
    publishedNews: {
      title: 'Noticias Publicadas',
      description:
        'Noticias que ya están en línea. Aquí puedes despublicarlas, eliminarlas, cambiar sus etiquetas y extraer los datos de una caída de sistema.',
      empty: 'No hay noticias publicadas',
      view: 'Ver en el sitio',
      unpublish: 'Despublicar',
      saveFlags: 'Guardar etiquetas',
      savingFlags: 'Guardando...',
      flagsSaved: 'Etiquetas guardadas',
      confirmUnpublish: '¿Estás seguro de que quieres despublicar esta noticia?',
      confirmDelete: '¿Estás seguro de que quieres eliminar esta noticia?',
      flagsError: 'Error al guardar las etiquetas',
      unpublishError: 'Error al despublicar la noticia',
      deleteError: 'Error al eliminar la noticia',
    },
    outage: {
      title: 'Datos de la interrupción',
      extract: 'Extraer datos de la interrupción',
      extracting: 'Extrayendo...',
      reextract: 'Volver a extraer',
      approve: 'Aprobar y guardar',
      saving: 'Guardando...',
      saved: 'Datos guardados',
      clear: 'Eliminar datos',
      review: 'Revisar',
      notStored: 'Nada se guarda hasta que apruebes.',
      kind: 'Tipo de interrupción',
      startsAt: 'Inicio',
      endsAt: 'Fin',
      inProgress: 'Ya está ocurriendo',
      services: 'Servicios afectados',
      addService: 'Agregar servicio',
      noServices: 'No se detectaron servicios. Agrégalos manualmente.',
      scope: 'Alcance',
      scopePlaceholder: 'Ej.: Intendencia Lima',
      cause: 'Causa',
      causePlaceholder: 'Ej.: RENIEC ha comunicado la suspensión temporal de sus servicios',
      existing: 'Ya hay datos aprobados para esta noticia. Al guardar se reemplazarán.',
    },
  },
  outageKinds: {
    MANTENIMIENTO: 'Mantenimiento programado',
    INTERMITENCIA: 'Intermitencia',
    INDISPONIBILIDAD: 'Servicio no disponible',
    DESCONOCIDO: 'Sin determinar',
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
    noResults: 'No hay noticias que coincidan con los filtros seleccionados',
  },
};

export function getCategoryLabel(category: NewsCategory): string {
  return UI_TEXT.categories[category] || category;
}

export function getFlagLabel(flag: NewsFlag): string {
  return UI_TEXT.flags[flag] || flag;
}

export function getOutageKindLabel(kind: OutageKind): string {
  return UI_TEXT.outageKinds[kind] || kind;
}
