import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import type { OutageKind } from '@/lib/outage/types';
import type { StatusLevel } from '@/lib/outage/status';

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
  status: {
    /** The eyebrow above the hero headline. */
    heading: 'Estado de SUNAT',
    /**
     * One entry per StatusLevel. `operativo` is worded as an absence of
     * reports, never as a claim that SUNAT funciona — we read comunicados, we
     * do not probe their servers.
     */
    levels: {
      indisponible: {
        title: 'Servicios de SUNAT no disponibles',
        subtitle: 'Hay una interrupción reportada en este momento.',
      },
      degradado: {
        title: 'SUNAT reporta intermitencias',
        subtitle: 'Algunos servicios están funcionando con fallas.',
      },
      mantenimiento: {
        title: 'Mantenimiento programado en curso',
        subtitle: 'SUNAT anunció trabajos en su plataforma durante este periodo.',
      },
      incidencia: {
        title: 'Incidencia reportada en SUNAT',
        subtitle: 'Hay un aviso vigente, sin el tipo de interrupción determinado.',
      },
      operativo: {
        title: 'Sin incidencias reportadas',
        subtitle:
          'No hay avisos vigentes de caída, intermitencia ni mantenimiento en los canales oficiales de SUNAT.',
      },
    },
    disclaimer:
      'Este estado se basa únicamente en los comunicados publicados por SUNAT. La ausencia de avisos no garantiza que los servicios estén operativos.',
    lastNewsPrefix: 'Última noticia',
    updatedAt: 'Estado actualizado',
    viewNotice: 'Ver el comunicado',
    alsoActiveOne: 'y 1 incidencia más',
    alsoActiveMany: 'y {count} incidencias más',
    // Shown when an outage notice exists but nobody has reviewed it yet, so it
    // cannot be placed in time. Better than implying everything is fine.
    pendingReviewOne: 'Hay 1 aviso de caída sin datos verificados todavía.',
    pendingReviewMany: 'Hay {count} avisos de caída sin datos verificados todavía.',
    pendingReviewLink: 'Ver los avisos',
    services: {
      heading: 'Servicios afectados',
      description: 'Servicios mencionados en los avisos vigentes de SUNAT.',
      empty: 'Ningún servicio reportado como afectado.',
      countOne: '1 servicio',
      countMany: '{count} servicios',
    },
    // Announced work that has not started yet. Kept apart from the history
    // below: a window scheduled for next week is not something that happened.
    upcoming: {
      heading: 'Mantenimientos programados',
      description: 'Interrupciones que SUNAT ya anunció y que aún no comienzan.',
      empty: 'No hay mantenimientos anunciados.',
      startsPrefix: 'Comienza',
    },
    incidents: {
      heading: 'Incidencias recientes',
      description: 'Caídas e interrupciones que ya ocurrieron o siguen en curso.',
      empty: 'No se han registrado incidencias.',
      viewAll: 'Ver todas las incidencias',
      ongoing: 'En curso',
      resolved: 'Finalizada',
      scheduled: 'Programada',
      unreviewed: 'Sin datos verificados',
    },
    latest: {
      heading: 'Últimas noticias',
      empty: 'No hay noticias disponibles',
      viewAll: 'Ver todas las noticias',
    },
    error: 'No se pudo consultar el estado de los servicios. Inténtalo más tarde.',
  },
  noticias: {
    title: 'Noticias de SUNAT',
    description:
      'Comunicados, avisos y alertas de fuentes oficiales de SUNAT, actualizados automáticamente.',
    backToStatus: 'Ver el estado de SUNAT',
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

export function getStatusLabel(level: StatusLevel): { title: string; subtitle: string } {
  return UI_TEXT.status.levels[level] ?? UI_TEXT.status.levels.operativo;
}

/** Fills the `{count}` placeholder in the one/many string pairs above. */
export function pluralize(count: number, one: string, many: string): string {
  return count === 1 ? one : many.replace('{count}', String(count));
}
