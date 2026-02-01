import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { runScraperManually } from '@/lib/scrapers/scheduler';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scraperName } = body;

    if (!scraperName || typeof scraperName !== 'string') {
      return NextResponse.json(
        { error: 'scraperName is required' },
        { status: 400 }
      );
    }

    const result = await runScraperManually(scraperName);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error running scraper:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
