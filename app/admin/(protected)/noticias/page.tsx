import { db, newsTable } from '@/lib/db/drizzle';
import { AdminNoticiasContent } from '@/components/admin/AdminNoticiasContent';
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

  return <AdminNoticiasContent initialNews={news} />;
}
