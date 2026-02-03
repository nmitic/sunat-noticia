import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFlag } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { published, flags } = body;

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        { error: 'published must be a boolean' },
        { status: 400 }
      );
    }

    // Update news item
    const [news] = await db.update(newsTable)
      .set({
        published,
        flags: flags || [],
        publishedAt: published ? new Date() : null,
      })
      .where(eq(newsTable.id, id))
      .returning();

    return NextResponse.json(news, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating news:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Hard delete the news item
    await db.delete(newsTable)
      .where(eq(newsTable.id, id));

    return NextResponse.json(
      { message: 'News deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting news:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
