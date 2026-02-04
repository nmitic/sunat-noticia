import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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

export default async function EmbeddedPage() {
  // Fetch published news
  let news: NewsItem[] = [];
  let dbError = false;

  try {
    const newsRows = await db.select({
      id: newsTable.id,
      title: newsTable.title,
      content: newsTable.content,
      source: newsTable.source,
      sourceUrl: newsTable.sourceUrl,
      category: newsTable.category,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
      publishedAt: newsTable.publishedAt,
    }).from(newsTable)
      .where(eq(newsTable.published, true))
      .orderBy(desc(newsTable.originalDate))
      .limit(50);

    news = newsRows.map(row => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
  }

  return (
    <>
      {dbError ? (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
          <p className="text-foreground/80">
            Ocurrió un error al cargar las noticias. Por favor, inténtalo más tarde.
          </p>
        </div>
      ) : (
        <NewsFeed initialNews={news} />
      )}
    </>
  );
}
