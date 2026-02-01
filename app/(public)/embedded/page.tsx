import { prisma } from '@/lib/db/prisma';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Embedded',
};

export default async function EmbeddedPage() {
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">SUNAT Noticias</h1>

      {news.length > 0 ? (
        <NewsFeed initialNews={news} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">{UI_TEXT.public.noNews}</p>
        </div>
      )}
    </div>
  );
}
