import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({ news }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching unpublished news:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
