import { prisma } from '@/lib/db/prisma';
import { ReviewQueue } from '@/components/admin/ReviewQueue';
import { UI_TEXT } from '@/lib/utils/constants';

export const metadata = {
  title: 'Noticias Pendientes - Panel Administrativo',
};

export default async function AdminNoticiasPage() {
  // Fetch unpublished news
  const news = await prisma.news.findMany({
    where: { published: false },
    orderBy: { scrapedAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      source: true,
      sourceUrl: true,
      category: true,
      flags: true,
      originalDate: true,
      scrapedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {UI_TEXT.admin.reviewQueue}
        </h1>
        <p className="mt-2 text-gray-600">
          Total: <span className="font-semibold">{news.length}</span> noticias pendientes
        </p>
      </div>

      {news.length > 0 ? (
        <ReviewQueue initialNews={news} />
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">{UI_TEXT.admin.noNews}</p>
        </div>
      )}
    </div>
  );
}
