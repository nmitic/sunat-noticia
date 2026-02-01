import { prisma } from '@/lib/db/prisma';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Embedded',
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

// Mock data for local development
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
];

export default async function EmbeddedPage() {
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
      {news.length > 0 ? (
        <NewsFeed initialNews={news} showFilters={false} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">{UI_TEXT.public.noNews}</p>
        </div>
      )}
    </>
  );
}
