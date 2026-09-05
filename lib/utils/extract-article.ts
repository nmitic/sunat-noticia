import { decodeContent } from '@/lib/utils/decode-content';

/**
 * Converts a fragment of source HTML into readable plain text, preserving
 * paragraph structure as blank-line-separated blocks.
 *
 * SUNAT's detail pages are hand-written table layouts from the early 2000s and
 * gob.pe wraps every paragraph in a bare <div>, so block boundaries have to be
 * inferred from the tags rather than from any semantic markup.
 */
export function htmlToText(html: string): string {
  let text = html;

  // Drop non-content elements outright, including their contents.
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Block-level boundaries become newlines so paragraphs survive tag stripping.
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|tr|li|h[1-6]|table|section|article)\s*>/gi, '\n\n');
  text = text.replace(/<\/td\s*>/gi, ' ');

  text = text.replace(/<[^>]+>/g, '');
  text = decodeContent(text);

  return normalizeWhitespace(text);
}

/**
 * Collapses runs of whitespace while keeping paragraph breaks intact.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    // Non-breaking spaces survive entity decoding and break trim()/length checks.
    .replace(/ /g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts the innerHTML of the element that opens at `openTagEnd`, counting
 * nested occurrences of the same tag so the result is not cut short at the
 * first closing tag.
 *
 * This is the fix for gob.pe articles: `feed-content` wraps one <div> per
 * paragraph, so a non-balanced `(.*?)</div>` match returns only the first
 * paragraph and silently discards the rest of the article.
 */
export function extractBalanced(html: string, openTagEnd: number, tagName: string): string {
  const open = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  const close = new RegExp(`</${tagName}\\s*>`, 'gi');

  let depth = 1;
  let cursor = openTagEnd;

  while (depth > 0) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;

    const nextOpen = open.exec(html);
    const nextClose = close.exec(html);

    // Unbalanced markup: take the rest of the document rather than nothing.
    if (!nextClose) return html.slice(openTagEnd);

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      if (depth === 0) return html.slice(openTagEnd, nextClose.index);
      cursor = nextClose.index + nextClose[0].length;
    }
  }

  return html.slice(openTagEnd);
}

/**
 * Finds an element by tag name and a class substring, returning its inner HTML
 * with nesting handled correctly.
 */
export function extractElementByClass(
  html: string,
  tagName: string,
  className: string
): string | null {
  const opener = new RegExp(`<${tagName}\\b[^>]*class="[^"]*${className}[^"]*"[^>]*>`, 'i');
  const match = opener.exec(html);
  if (!match) return null;

  return extractBalanced(html, match.index + match[0].length, tagName);
}

/**
 * Lines that are page furniture rather than article content. Matched against
 * the whole trimmed line, case-insensitively.
 */
const BOILERPLATE_LINES = [
  /^historial de comunicados$/i,
  /^comunicado$/i,
  /^nota de prensa$/i,
  /^informe de prensa$/i,
  /^volver$/i,
  /^regresar$/i,
  /^imprimir$/i,
  /^compartir$/i,
  /^gerencia de comunicaciones e imagen institucional$/i,
  // Trailing datelines: "Lima, 04 de setiembre de 2026"
  /^lima,\s+(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)?\s*\d{1,2}\s+de\s+\w+\s+(de|del)\s+\d{4}\.?$/i,
];

/**
 * Strips page furniture and drops empty blocks.
 */
export function cleanArticleText(text: string): string {
  const lines = normalizeWhitespace(text)
    .split('\n')
    .filter((line) => {
      if (!line) return true; // keep paragraph separators for now
      return !BOILERPLATE_LINES.some((pattern) => pattern.test(line));
    });

  return normalizeWhitespace(lines.join('\n'));
}

/**
 * Whether extracted text is substantial enough to replace a listing summary.
 * Guards against a detail page that is an error page, a redirect stub, or a
 * layout we failed to parse.
 */
export function isUsableContent(text: string, minLength = 120): boolean {
  return text.trim().length >= minLength;
}
