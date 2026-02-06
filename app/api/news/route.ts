import { NextResponse } from 'next/server';
import { db, newsTable } from '@/lib/db/drizzle';
import { eq, desc, and, lt, or, sql } from 'drizzle-orm';
import { NewsFlag, NewsCategory } from '@/lib/db/schema';
import { injectAds } from '@/lib/ads';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Get filter parameters
  const categoryParam = searchParams.get('category');
  const flagsParam = searchParams.get('flags'); // Comma-separated string

  try {
    // Build query with optional cursor and filters
    const conditions = [eq(newsTable.published, true)];

    // Add cursor condition
    if (cursor) {
      conditions.push(lt(newsTable.originalDate, new Date(cursor)));
    }

    // Add category filter (single category)
    if (categoryParam) {
      const category = categoryParam as NewsCategory;
      conditions.push(eq(newsTable.category, category));
    }

    // Add flags filter (array of flags - item must have at least one)
    if (flagsParam) {
      const flags = flagsParam.split(',') as NewsFlag[];
      if (flags.length > 0) {
        // Use PostgreSQL array overlap operator: flags && ARRAY['flag1', 'flag2']
        const flagConditions = flags.map(flag =>
          sql`${newsTable.flags} @> ARRAY[${flag}]::text[]`
        );
        conditions.push(or(...flagConditions)!);
      }
    }

    // Fetch limit + 1 to check if more items exist
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
      .limit(limit + 1);

    // Check if more items exist
    const hasMore = newsRows.length > limit;
    let news = newsRows.slice(0, limit).map(row => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));

    // Check if embedded mode (from referer header)
    const referer = request.headers.get('referer') || '';
    const isEmbedded = referer.includes('/embeded');

    // Inject ads only if not embedded
    if (!isEmbedded) {
      const { items: newsWithAds } = injectAds({ items: news });
      news = newsWithAds;
    }

    // Next cursor is the originalDate of the last item
    const nextCursor = hasMore && news.length > 0
      ? news[news.length - 1].originalDate.toISOString()
      : null;

    return NextResponse.json({ news, hasMore, nextCursor });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
