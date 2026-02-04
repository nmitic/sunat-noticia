import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';

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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmbeddedPage({ searchParams }: PageProps) {
  // Fetch published news with filters
  let news: NewsItem[] = [];
  let dbError = false;

  // Await and extract search params
  const params = await searchParams;
  const categoryParam = params.category as string | undefined;
  const flagsParam = params.flags as string | undefined;

  // Create a key for NewsFeed based on filters to force remount when filters change
  const feedKey = `${categoryParam || 'all'}-${flagsParam || 'none'}`;

  try {
    // Build query conditions
    const conditions = [eq(newsTable.published, true)];

    // Add category filter
    if (categoryParam) {
      conditions.push(eq(newsTable.category, categoryParam as NewsCategory));
    }

    // Add flags filter
    if (flagsParam) {
      const flags = flagsParam.split(',') as NewsFlag[];
      if (flags.length > 0) {
        // Use PostgreSQL array overlap operator
        const flagConditions = flags.map(flag =>
          sql`${newsTable.flags} @> ARRAY[${flag}]::text[]`
        );
        conditions.push(or(...flagConditions)!);
      }
    }

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
      .where(and(...conditions))
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
        <NewsFeed key={feedKey} initialNews={news} embeded />
      )}
    </>
  );
}
