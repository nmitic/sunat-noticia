import { NextResponse } from 'next/server';
import { isOriginAllowed, buildCorsHeaders, handlePreflight } from '@/lib/api/cors';
import { loadSiteStatus, toPublicStatus } from '@/lib/api/status';

/**
 * Unlike its `/api/public/news` sibling this handler reads nothing from the
 * request URL — the status has no filters — so say explicitly that it must not
 * be treated as static.
 */
export const dynamic = 'force-dynamic';

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

  try {
    const loaded = await loadSiteStatus(new Date());

    return NextResponse.json(toPublicStatus(loaded), { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching public status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
