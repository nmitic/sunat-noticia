import { NextRequest, NextResponse } from 'next/server';
import { startScheduler } from '@/lib/scrapers/scheduler';

// Global flag to prevent multiple scheduler starts
let schedulerStarted = false;

export async function POST(request: NextRequest) {
  try {
    if (schedulerStarted) {
      return NextResponse.json(
        { message: 'Scheduler already running' },
        { status: 200 }
      );
    }

    startScheduler();
    schedulerStarted = true;

    return NextResponse.json(
      { message: 'Scheduler initialized successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to initialize scheduler' },
      { status: 500 }
    );
  }
}
