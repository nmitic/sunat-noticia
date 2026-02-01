import { prisma } from '@/lib/db/prisma';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@prisma/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Agregador de Noticias',
  description: 'Últimas noticias sobre SUNAT de fuentes oficiales y medios de comunicación',
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  publishedAt: Date | null;
}

// Mock data for local development - showcases all categories, flags, and features
const MOCK_NEWS: NewsItem[] = [
  {
    id: 'mock-1',
    title: 'Caída de Sistema de Recaudación - Atención Requerida',
    content: 'El sistema de recaudación de SUNAT ha experimentado una caída temporal. Se recomienda no realizar trámites hasta que el sistema esté completamente restablecido. El equipo técnico está trabajando para resolver el inconveniente lo antes posible.',
    source: 'SUNAT Oficial',
    sourceUrl: 'https://www.sunat.gob.pe',
    category: 'OFICIAL' as NewsCategory,
    flags: ['CAIDA_SISTEMA' as NewsFlag, 'URGENTE' as NewsFlag],
    originalDate: new Date(Date.now() - 30 * 60000),
    publishedAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: 'mock-2',
    title: 'Se Actualiza Procedimiento de Inscripción en RUC',
    content: 'SUNAT ha actualizado el procedimiento de inscripción en el Registro Único de Contribuyentes. Los contribuyentes deben considerar estos cambios en futuras solicitudes. La actualización entra en vigor a partir del próximo mes.',
    source: 'Portal SUNAT',
    sourceUrl: 'https://www.sunat.gob.pe',
    category: 'OFICIAL' as NewsCategory,
    flags: ['ACTUALIZACION' as NewsFlag],
    originalDate: new Date(Date.now() - 2 * 3600000),
    publishedAt: new Date(Date.now() - 1.5 * 3600000),
  },
  {
    id: 'mock-3',
    title: 'Importante: Plazo Vencido para Declaración de Marzo',
    content: 'Se informa que el plazo para la presentación de declaraciones mensuales correspondientes a marzo ha vencido. Los contribuyentes que no hayan cumplido deben regularizar su situación para evitar sanciones.',
    source: 'Facebook SUNAT',
    sourceUrl: 'https://www.facebook.com/sunat',
    category: 'REDES_SOCIALES' as NewsCategory,
    flags: ['IMPORTANTE' as NewsFlag],
    originalDate: new Date(Date.now() - 4 * 3600000),
    publishedAt: new Date(Date.now() - 3.5 * 3600000),
  },
  {
    id: 'mock-4',
    title: 'SUNAT Amplía Horarios de Atención al Público',
    content: 'Para mejorar la atención a los contribuyentes, SUNAT ha extendido los horarios de atención en sus oficinas. Los nuevos horarios están disponibles en la página web institucional.',
    source: 'Twitter SUNAT',
    sourceUrl: 'https://twitter.com/sunatperu',
    category: 'REDES_SOCIALES' as NewsCategory,
    flags: ['ACTUALIZACION' as NewsFlag, 'IMPORTANTE' as NewsFlag],
    originalDate: new Date(Date.now() - 6 * 3600000),
    publishedAt: new Date(Date.now() - 5.5 * 3600000),
  },
  {
    id: 'mock-5',
    title: 'Nuevas Normas Tributarias Entran en Vigencia',
    content: 'El Ministerio de Economía y Finanzas ha emitido nuevas normas tributarias que afectarán a contribuyentes del sector comercial. Se recomienda revisar los detalles completos en el Diario Oficial El Peruano.',
    source: 'Gestión',
    sourceUrl: 'https://gestión.pe',
    category: 'NOTICIAS' as NewsCategory,
    flags: ['IMPORTANTE' as NewsFlag, 'URGENTE' as NewsFlag, 'ACTUALIZACION' as NewsFlag],
    originalDate: new Date(Date.now() - 8 * 3600000),
    publishedAt: new Date(Date.now() - 7.5 * 3600000),
  },
  {
    id: 'mock-6',
    title: 'Cronograma de Pagos del IGV para el Primer Trimestre',
    content: 'SUNAT ha publicado el cronograma oficial de pagos del Impuesto General a las Ventas para el primer trimestre. Recomendamos que todos los contribuyentes revisen las fechas de vencimiento correspondientes a su régimen tributario.',
    source: 'SUNAT Portal',
    sourceUrl: 'https://www.sunat.gob.pe',
    category: 'OFICIAL' as NewsCategory,
    flags: [],
    originalDate: new Date(Date.now() - 12 * 3600000),
    publishedAt: new Date(Date.now() - 11.5 * 3600000),
  },
  {
    id: 'mock-7',
    title: 'Webinar Gratuito: Obligaciones Tributarias 2026',
    content: 'SUNAT convoca a contribuyentes a participar en una serie de webinars sobre las obligaciones tributarias vigentes para el año 2026. Inscripciones disponibles a través de la web institucional sin costo alguno.',
    source: 'Correo SUNAT',
    sourceUrl: 'https://www.sunat.gob.pe',
    category: 'OFICIAL' as NewsCategory,
    flags: ['ACTUALIZACION' as NewsFlag],
    originalDate: new Date(Date.now() - 24 * 3600000),
    publishedAt: new Date(Date.now() - 23.5 * 3600000),
  },
  {
    id: 'mock-8',
    title: 'Sector Comercial en Alerta por Nuevas Inspecciones',
    content: 'Fuentes cercanas al sector comercial indican que SUNAT ha intensificado las inspecciones tributarias. Los contribuyentes del rubro deben tener la documentación en regla para evitar problemas.',
    source: 'Perú 21',
    sourceUrl: 'https://peru21.pe',
    category: 'NOTICIAS' as NewsCategory,
    flags: ['URGENTE' as NewsFlag],
    originalDate: new Date(Date.now() - 36 * 3600000),
    publishedAt: new Date(Date.now() - 35.5 * 3600000),
  },
];

export default async function HomePage() {
  // Fetch published news
  let news: NewsItem[] = [];
  let dbError = false;

  try {
    news = await prisma.news.findMany({
      where: { published: true },
      orderBy: { originalDate: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        source: true,
        sourceUrl: true,
        category: true,
        flags: true,
        originalDate: true,
        publishedAt: true,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
  }

  // Use mock data if no news from database (for local development)
  if (news.length === 0 && !dbError) {
    news = MOCK_NEWS;
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Desktop layout: title + content + sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                  Noticias de SUNAT
                </h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Últimas noticias de fuentes oficiales, redes sociales y medios de comunicación
                </p>
              </div>

              {dbError ? (
                <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
                  <h3 className="text-lg font-semibold text-destructive mb-2">Error de Conexión</h3>
                  <p className="text-foreground/80 mb-4">
                    No se pudo conectar a la base de datos. Por favor, asegúrate de que:
                  </p>
                  <ul className="text-left text-foreground/80 space-y-1 ml-4 mb-4">
                    <li>• PostgreSQL está instalado y en ejecución</li>
                    <li>• La variable DATABASE_URL está configurada en .env.local</li>
                    <li>• La base de datos "sunat_noticias" existe</li>
                    <li>• Has ejecutado las migraciones: <code className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded text-foreground">npm run db:push</code></li>
                  </ul>
                  <p className="text-sm text-foreground/70">
                    Para más ayuda, consulta <a href="/SETUP.md" className="underline text-primary hover:text-primary/80">SETUP.md</a>
                  </p>
                </div>
              ) : news.length > 0 ? (
                <NewsFeed initialNews={news} />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-gray-50 dark:bg-gray-900 p-12 text-center">
                  <p className="text-muted-foreground">{UI_TEXT.public.noNews}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar subscribe form - desktop only */}
          <div className="hidden lg:block lg:w-80">
            <div className="sticky top-20 rounded-lg bg-gray-50 dark:bg-gray-800 p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                {UI_TEXT.public.subscribe}
              </h3>

              <form className="space-y-3">
                <input
                  type="email"
                  placeholder={UI_TEXT.public.emailPlaceholder}
                  className="w-full rounded-lg border border-input bg-gray-50 dark:bg-gray-900 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  className="w-full rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {UI_TEXT.public.subscribeButton}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile sticky subscribe form */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-border shadow-lg z-40">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={UI_TEXT.public.emailPlaceholder}
                className="flex-1 min-w-0 rounded border border-input bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                className="whitespace-nowrap rounded bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {UI_TEXT.public.subscribeButton}
              </button>
            </form>
          </div>
        </div>

        {/* Add bottom padding on mobile to account for sticky form */}
        <div className="lg:hidden h-20" />
      </div>
      <Footer />
    </>

  );
}
