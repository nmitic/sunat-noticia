import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { structuredOutageSchema } from '@/lib/outage/schema';
import type { StructuredOutage } from '@/lib/outage/types';
import { eq } from 'drizzle-orm';

/**
 * Stores the outage data an admin has reviewed and approved.
 *
 * This is the only writer of `structuredData`. Extraction itself persists
 * nothing, so anything saved here has been seen by a human.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = structuredOutageSchema.safeParse(body?.structured);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos de interrupción inválidos',
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ flags: newsTable.flags })
      .from(newsTable)
      .where(eq(newsTable.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    // Outage data belongs only to outage notices. The admin may still be
    // holding the flag in unsaved state, so accept it from the request too.
    const pendingFlags: string[] = Array.isArray(body?.flags) ? body.flags : [];
    const isOutage =
      existing.flags.includes('CAIDA_SISTEMA') || pendingFlags.includes('CAIDA_SISTEMA');

    if (!isOutage) {
      return NextResponse.json(
        { error: 'La noticia debe estar marcada como Caída de Sistema' },
        { status: 400 }
      );
    }

    // Only these two columns are touched — title, content and flags are left
    // exactly as they were.
    const [updated] = await db
      .update(newsTable)
      .set({
        structuredData: parsed.data as StructuredOutage,
        structuredDataAt: new Date(),
      })
      .where(eq(newsTable.id, id))
      .returning({
        id: newsTable.id,
        structuredData: newsTable.structuredData,
        structuredDataAt: newsTable.structuredDataAt,
      });

    return NextResponse.json(
      {
        ...updated,
        structuredDataAt: updated.structuredDataAt?.toISOString() ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving structured outage data:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Clears approved outage data, so a mistaken approval is reversible. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db
      .update(newsTable)
      .set({ structuredData: null, structuredDataAt: null })
      .where(eq(newsTable.id, id));

    return NextResponse.json({ message: 'Datos eliminados' }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error clearing structured outage data:', message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
