import { NextResponse } from 'next/server';
import { queryPublishedNews } from '@/lib/api/news-query';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await queryPublishedNews({
      cursor: searchParams.get('cursor'),
      limit: parseInt(searchParams.get('limit') || '50'),
      category: searchParams.get('category'),
      flags: searchParams.get('flags'),
    });

    const { news } = result;

    return NextResponse.json({ news, hasMore: result.hasMore, nextCursor: result.nextCursor });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
