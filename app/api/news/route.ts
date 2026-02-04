import { NextResponse } from 'next/server';
import { db, newsTable } from '@/lib/db/drizzle';
import { eq, desc, and, lt } from 'drizzle-orm';
import { NewsFlag } from '@/lib/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  try {
    // Build query with optional cursor
    const conditions = [eq(newsTable.published, true)];
    if (cursor) {
      conditions.push(lt(newsTable.originalDate, new Date(cursor)));
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
    const news = newsRows.slice(0, limit).map(row => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));

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
