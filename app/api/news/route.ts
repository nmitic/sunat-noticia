import { NextResponse } from 'next/server';
import { injectAds } from '@/lib/ads';
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

    let { news } = result;

    // Check if embedded mode (from referer header)
    const referer = request.headers.get('referer') || '';
    const isEmbedded = referer.includes('/embeded');

    // Inject ads only if not embedded
    if (!isEmbedded) {
      const { items: newsWithAds } = injectAds({ items: news });
      news = newsWithAds;
    }

    return NextResponse.json({ news, hasMore: result.hasMore, nextCursor: result.nextCursor });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
