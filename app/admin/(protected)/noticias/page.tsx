import { db, newsTable } from '@/lib/db/drizzle';
import { ReviewQueue } from '@/components/admin/ReviewQueue';
import { UI_TEXT } from '@/lib/utils/constants';
import { eq, desc } from 'drizzle-orm';

export const metadata = {
  title: 'Noticias Pendientes - Panel Administrativo',
};

export default async function AdminNoticiasPage() {
  // Fetch unpublished news
  const newsRows = await db.select({
    id: newsTable.id,
    title: newsTable.title,
    content: newsTable.content,
    source: newsTable.source,
    sourceUrl: newsTable.sourceUrl,
    category: newsTable.category,
    flags: newsTable.flags,
    originalDate: newsTable.originalDate,
    scrapedAt: newsTable.scrapedAt,
  }).from(newsTable)
    .where(eq(newsTable.published, false))
    .orderBy(desc(newsTable.scrapedAt));

  const news = newsRows.map(row => ({
    ...row,
    flags: (row.flags as any[]) || [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          {UI_TEXT.admin.reviewQueue}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Total: <span className="font-semibold">{news.length}</span> noticias pendientes
        </p>
      </div>

      {news.length > 0 ? (
        <ReviewQueue initialNews={news} />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-gray-50 dark:bg-gray-900 p-12 text-center">
          <p className="text-muted-foreground">{UI_TEXT.admin.noNews}</p>
        </div>
      )}
    </div>
  );
}
