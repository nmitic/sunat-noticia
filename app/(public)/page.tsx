import { prisma } from '@/lib/db/prisma';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Agregador de Noticias',
  description: 'Últimas noticias sobre SUNAT de fuentes oficiales y medios de comunicación',
};

export default async function HomePage() {
  // Fetch published news
  const news = await prisma.news.findMany({
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          Noticias de SUNAT
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Últimas noticias de fuentes oficiales, redes sociales y medios de comunicación
        </p>
      </div>

      {news.length > 0 ? (
        <NewsFeed initialNews={news} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">{UI_TEXT.public.noNews}</p>
        </div>
      )}
    </div>
  );
}
