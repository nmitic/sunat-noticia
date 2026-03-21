import { NextResponse } from 'next/server';
import { isOriginAllowed, buildCorsHeaders, handlePreflight } from '@/lib/api/cors';
import { queryPublishedNews } from '@/lib/api/news-query';

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return handlePreflight(origin);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');

  if (!isOriginAllowed(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const corsHeaders = buildCorsHeaders(origin!);
  const { searchParams } = new URL(request.url);

  try {
    const result = await queryPublishedNews({
      cursor: searchParams.get('cursor'),
      limit: parseInt(searchParams.get('limit') || '50'),
      category: searchParams.get('category'),
      flags: searchParams.get('flags'),
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching public news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500, headers: corsHeaders }
    );
  }
}
