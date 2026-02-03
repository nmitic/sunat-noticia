import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, scraperRunTable } from '@/lib/db/drizzle';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runs = await db
      .select({
        id: scraperRunTable.id,
        scraperName: scraperRunTable.scraperName,
        status: scraperRunTable.status,
        itemsScraped: scraperRunTable.itemsScraped,
        errorMessage: scraperRunTable.errorMessage,
        startedAt: scraperRunTable.startedAt,
        completedAt: scraperRunTable.completedAt,
      })
      .from(scraperRunTable)
      .orderBy(desc(scraperRunTable.startedAt))
      .limit(20);

    return NextResponse.json({ runs }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching scraper runs:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
