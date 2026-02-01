import { prisma } from '@/lib/db/prisma';

// Global set to store active SSE connections
// In production with multiple servers, this should use Redis
let connections: Set<ReadableStreamDefaultController<Uint8Array>> = new Set();

/**
 * Register an SSE connection
 */
export function registerConnection(
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  connections.add(controller);
}

/**
 * Unregister an SSE connection
 */
export function unregisterConnection(
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  connections.delete(controller);
}

/**
 * Broadcast a new published news item to all connected clients
 */
export async function broadcastNewNews(newsId: string) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news || !news.published) {
      return;
    }

    const message = `data: ${JSON.stringify({
      type: 'new-news',
      data: news,
    })}\n\n`;

    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    // Send to all connected clients
    const failedConnections: ReadableStreamDefaultController<Uint8Array>[] = [];

    connections.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch (error) {
        // Connection is dead, mark for removal
        failedConnections.push(controller);
      }
    });

    // Clean up dead connections
    failedConnections.forEach((controller) => {
      connections.delete(controller);
    });

    console.log(`Broadcasted news to ${connections.size} clients`);
  } catch (error) {
    console.error('Error broadcasting news:', error);
  }
}

/**
 * Get current connection count
 */
export function getConnectionCount(): number {
  return connections.size;
}
