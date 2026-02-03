import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db, newsTable } from '@/lib/db/drizzle';
import { inArray } from 'drizzle-orm';
import { NewsFlag } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newsIds, flags } = body;

    // Validate newsIds is array
    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return NextResponse.json(
        { error: 'newsIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Update each news item with its corresponding flags
    let processedCount = 0;
    const errors: string[] = [];

    for (const newsId of newsIds) {
      try {
        const itemFlags = flags && flags[newsId] ? flags[newsId] : [];

        await db.update(newsTable)
          .set({
            published: true,
            flags: itemFlags,
            publishedAt: new Date(),
          })
          .where(inArray(newsTable.id, [newsId]));

        processedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to publish ${newsId}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      processedCount,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in batch publish:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newsIds } = body;

    // Validate newsIds is array
    if (!Array.isArray(newsIds) || newsIds.length === 0) {
      return NextResponse.json(
        { error: 'newsIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Delete all news items in the list
    await db.delete(newsTable)
      .where(inArray(newsTable.id, newsIds));

    return NextResponse.json({
      success: true,
      processedCount: newsIds.length,
      errors: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in batch delete:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
