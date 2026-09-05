import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFlag } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/** Newest first, capped — the panel is for recent moderation, not an archive. */
const LIMIT = 100;

/**
 * Published items, for the admin panel's "Noticias Publicadas" tab. The public
 * feed has no moderation controls any more, so this is where unpublishing,
 * deleting and outage editing reach already-live news.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newsRows = await db
      .select({
        id: newsTable.id,
        title: newsTable.title,
        content: newsTable.content,
        source: newsTable.source,
        sourceUrl: newsTable.sourceUrl,
        category: newsTable.category,
        flags: newsTable.flags,
        originalDate: newsTable.originalDate,
        scrapedAt: newsTable.scrapedAt,
        publishedAt: newsTable.publishedAt,
        structuredData: newsTable.structuredData,
      })
      .from(newsTable)
      .where(eq(newsTable.published, true))
      .orderBy(desc(newsTable.originalDate))
      .limit(LIMIT);

    const news = newsRows.map((row) => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));

    return NextResponse.json({ news }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching published news:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
