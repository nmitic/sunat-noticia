/**
 * Perunio promotional copy. Kept in sync with the perunio-home hero, which
 * positions the product as a full SUNAT platform — bulk download is one
 * module among several, not the whole offering.
 */

/**
 * Ads point at the perunio.pe marketing site, not the app's registration form —
 * cold traffic from a news feed needs the pitch before the signup.
 */
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || 'https://perunio.pe';

export type AdSlug = 'plataforma' | 'automatiza' | 'plan-gratis';

export interface AdFeature {
  icon: 'download' | 'inbox' | 'clock' | 'bot' | 'building' | 'shield';
  label: string;
}

export interface AdUnit {
  slug: AdSlug;
  eyebrow?: string;
  headline: string;
  /** The bold fragment of the headline, rendered in the brand gradient. */
  headlineAccent?: string;
  body?: string;
  features?: AdFeature[];
  trustLine?: string;
  cta: string;
  path: string;
  compactIcon?: AdFeature['icon'];
}

/**
 * Every ad link is attributed so the traffic is distinguishable in analytics.
 */
export function adHref(unit: AdUnit): string {
  const params = new URLSearchParams({
    utm_source: 'sunat-noticias',
    utm_medium: 'sidebar',
    utm_campaign: unit.slug,
  });

  return `${HOME_URL}${unit.path}?${params.toString()}`;
}

export const AD_UNITS: Record<AdSlug, AdUnit> = {
  // Lead unit: the whole platform, six modules, not just descarga masiva.
  plataforma: {
    slug: 'plataforma',
    eyebrow: 'Plataforma SUNAT',
    headline: 'Deja de hacer lo repetitivo',
    headlineAccent: 'Haz más de lo que importa',
    body: 'Todo lo que haces manualmente en SUNAT, en un solo lugar y automatizado.',
    features: [
      { icon: 'download', label: 'Descarga masiva de comprobantes' },
      { icon: 'inbox', label: 'Buzón SUNAT multi-RUC' },
      { icon: 'clock', label: 'Descargas programadas' },
      { icon: 'bot', label: 'Comandos con IA' },
      { icon: 'building', label: 'Consulta RUC masiva' },
      { icon: 'shield', label: 'Validación de comprobantes' },
    ],
    trustLine: 'Sin tarjeta de crédito · Configuración en 2 minutos',
    cta: 'Conoce la plataforma',
    path: '/',
  },
  automatiza: {
    slug: 'automatiza',
    headline: 'Automatiza tus descargas y consultas SUNAT',
    cta: 'Ver todos los módulos',
    path: '/descarga-masiva-comprobantes-sunat',
    compactIcon: 'bot',
  },
  'plan-gratis': {
    slug: 'plan-gratis',
    headline: 'Plan gratuito · Sin tarjeta de crédito',
    cta: 'Ver planes',
    path: '/planes',
    compactIcon: 'shield',
  },
};
