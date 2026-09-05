import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { parseOutage } from '@/lib/outage/parse';
import { eq } from 'drizzle-orm';

/**
 * Parses a notice into structured outage fields and returns them.
 *
 * Writes nothing. The result is a proposal for an admin to correct; only
 * PATCH /api/admin/news/[id]/structured-data persists anything.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [news] = await db
      .select({
        content: newsTable.content,
        flags: newsTable.flags,
        originalDate: newsTable.originalDate,
        structuredData: newsTable.structuredData,
      })
      .from(newsTable)
      .where(eq(newsTable.id, id))
      .limit(1);

    if (!news) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    // In the review queue the admin ticks "Caída de Sistema" before publishing,
    // so the flag is still only in the browser's state — the client sends it
    // along and either source satisfies the check.
    const pending = await readPendingFlags(request);
    const isOutage =
      news.flags.includes('CAIDA_SISTEMA') || pending.includes('CAIDA_SISTEMA');

    if (!isOutage) {
      return NextResponse.json(
        { error: 'La noticia debe estar marcada como Caída de Sistema' },
        { status: 400 }
      );
    }

    const structured = parseOutage(news.content, news.originalDate);

    // The already-approved record travels back alongside the fresh parse so the
    // form can show what would change instead of silently replacing it.
    return NextResponse.json({ structured, existing: news.structuredData ?? null }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error extracting outage data:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * The flags the admin has selected but not yet saved. An absent or malformed
 * body is normal here — the check falls back to the stored flags.
 */
async function readPendingFlags(request: NextRequest): Promise<string[]> {
  try {
    const body = await request.json();
    return Array.isArray(body?.flags) ? body.flags.filter((f: unknown) => typeof f === 'string') : [];
  } catch {
    return [];
  }
}
