import { NextResponse } from 'next/server';

export const ALLOWED_PUBLIC_ORIGINS = [
  'https://app.perunio.pe',
  'http://localhost:5173',
] as const;

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return (ALLOWED_PUBLIC_ORIGINS as readonly string[]).includes(origin);
}

export function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function handlePreflight(origin: string | null): NextResponse {
  if (!isOriginAllowed(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin!),
  });
}
