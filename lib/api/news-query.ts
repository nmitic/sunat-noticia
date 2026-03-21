import { eq, desc, and, lt, or, sql } from 'drizzle-orm';
import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFlag, NewsCategory } from '@/lib/db/schema';

export type NewsRow = {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  publishedAt: Date | null;
};

export type NewsQueryResult = {
  news: NewsRow[];
  hasMore: boolean;
  nextCursor: string | null;
};

export async function queryPublishedNews(params: {
  cursor?: string | null;
  limit?: number;
  category?: string | null;
  flags?: string | null;
}): Promise<NewsQueryResult> {
  const limit = Math.min(params.limit ?? 50, 100);
  const { cursor, category: categoryParam, flags: flagsParam } = params;

  const conditions = [eq(newsTable.published, true)];

  if (cursor) {
    conditions.push(lt(newsTable.originalDate, new Date(cursor)));
  }

  if (categoryParam) {
    conditions.push(eq(newsTable.category, categoryParam as NewsCategory));
  }

  if (flagsParam) {
    const flags = flagsParam.split(',') as NewsFlag[];
    if (flags.length > 0) {
      const flagConditions = flags.map(flag =>
        sql`${newsTable.flags} @> ARRAY[${flag}]::text[]`
      );
      conditions.push(or(...flagConditions)!);
    }
  }

  const rows = await db.select({
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
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const news = rows.slice(0, limit).map(row => ({
    ...row,
    flags: (row.flags as NewsFlag[]) || [],
  }));

  const nextCursor = hasMore && news.length > 0
    ? news[news.length - 1].originalDate.toISOString()
    : null;

  return { news, hasMore, nextCursor };
}
