/**
 * Shared HTML fetching with charset handling.
 *
 * sunat.gob.pe serves windows-1252/ISO-8859-1 while gob.pe serves UTF-8, and
 * the charset is sometimes declared only in a <meta> tag rather than the
 * Content-Type header. Decoding with the wrong table turns every accented
 * Spanish character into mojibake, so detection is done from the bytes.
 */

const USER_AGENT = 'SUNAT-Noticias/1.0';

/** Bytes → string via direct code-point mapping (latin-1 family). */
function decodeLatin1(bytes: Uint8Array): string {
  let result = '';
  // Chunked to avoid blowing the argument limit on large pages.
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return result;
}

function isLatin1Charset(charset: string): boolean {
  return ['iso-8859-1', 'latin1', 'windows-1252', 'iso8859-1'].includes(charset);
}

export interface FetchHtmlOptions {
  /** Charset to assume when neither the header nor a meta tag declares one. */
  fallbackCharset?: string;
  timeoutMs?: number;
}

/**
 * Fetch a page and decode it using the charset it actually declares.
 */
export async function fetchHtml(url: string, options: FetchHtmlOptions = {}): Promise<string> {
  const { fallbackCharset = 'utf-8', timeoutMs = 20000 } = options;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';

  // Binary attachments (.doc/.docx on sala de prensa) have no HTML to parse.
  if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType) && contentType) {
    throw new Error(`Not an HTML document (${contentType}): ${url}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  let charset = contentType.match(/charset=([^\s;]+)/i)?.[1]?.replace(/['"]/g, '').trim().toLowerCase();

  if (!charset) {
    // Sniff the <meta> declaration from the ASCII-safe head region.
    const head = decodeLatin1(bytes.subarray(0, 2048));
    charset = (
      head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ||
      head.match(/content=["'][^"']*charset=([\w-]+)/i)?.[1]
    )?.toLowerCase();
  }

  charset = charset || fallbackCharset;

  if (isLatin1Charset(charset)) {
    return decodeLatin1(bytes);
  }

  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    console.warn(`[fetchHtml] Unsupported charset "${charset}" for ${url}; falling back to latin-1`);
    return decodeLatin1(bytes);
  }
}
