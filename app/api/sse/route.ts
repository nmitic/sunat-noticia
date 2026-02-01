import { NextRequest, NextResponse } from 'next/server';
import { registerConnection, unregisterConnection } from '@/lib/sse/broadcast';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      registerConnection(controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      const connected = encoder.encode(
        `data: ${JSON.stringify({ type: 'connected' })}\n\n`
      );
      controller.enqueue(connected);

      // Clean up on client disconnect
      const handleAbort = () => {
        unregisterConnection(controller);
        controller.close();
      };

      request.signal.addEventListener('abort', handleAbort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}
