import { BaseScraper, ScrapedNewsItem } from './base';
import { decodeContent } from '@/lib/utils/decode-content';
import { fetchHtml } from './fetch-html';
import {
  cleanArticleText,
  htmlToText,
  isUsableContent,
  normalizeWhitespace,
} from '@/lib/utils/extract-article';

/** Listing-page metadata, before the detail page is fetched. */
interface MensajeListing {
  summary: string;
  sourceUrl: string;
  originalDate: Date;
}

/**
 * Scraper for official SUNAT mensajes (messages)
 * Source: https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html
 *
 * Two-stage: the listing table gives a date, a one-line summary and a link;
 * each linked page is then fetched for the full comunicado body, which is what
 * gets stored as the item content.
 */
export class OficialSunatMensajesScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html';
  private readonly baseDir = 'https://www.sunat.gob.pe/mensajes/';
  private readonly source = 'SUNAT mensajes';

  async scrape(): Promise<ScrapedNewsItem[]> {
    const html = await this.fetchPageHtml();
    const listings = this.parseTable(html);

    console.log(`[${this.source}] Found ${listings.length} listings to process`);

    const items: ScrapedNewsItem[] = [];

    for (const listing of listings) {
      items.push(await this.buildItem(listing));
    }

    return items;
  }

  /**
   * Fetch the full comunicado from its own page, falling back to the listing
   * summary when the detail page is unreachable or unparseable — a missing
   * detail page should degrade the item, not drop it.
   */
  private async buildItem(listing: MensajeListing): Promise<ScrapedNewsItem> {
    let content = listing.summary;
    let title = this.deriveTitle(listing.summary);

    try {
      const detail = await this.fetchDetail(listing.sourceUrl);

      if (detail && isUsableContent(detail.content)) {
        content = detail.content;
        title = detail.title ?? title;
      } else {
        console.warn(`[${this.source}] Thin detail page, keeping summary: ${listing.sourceUrl}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[${this.source}] Detail fetch failed (${message}): ${listing.sourceUrl}`);
    }

    return {
      title,
      content,
      source: this.source,
      sourceUrl: listing.sourceUrl,
      category: 'OFICIAL',
      originalDate: listing.originalDate,
    };
  }

  /**
   * Extract the comunicado body from a detail page.
   */
  private async fetchDetail(
    url: string
  ): Promise<{ content: string; title: string | null } | null> {
    const html = await fetchHtml(url, { fallbackCharset: 'windows-1252' });

    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    const body = bodyMatch ? bodyMatch[1] : html;

    const content = cleanArticleText(htmlToText(body));
    if (!content) return null;

    return { content, title: this.deriveTitle(content) };
  }

  /**
   * Build a headline from the body text.
   *
   * These pages carry no usable <title> (every one is literally "COMUNICADO"),
   * which also defeats deduplication in base.ts since that keys on the title.
   * The first substantive sentence is the closest thing to a headline.
   */
  private deriveTitle(text: string): string {
    // "Estimado(a) contribuyente:", "Estimada(o) contribuyente:", "Estimados usuarios:"
    const SALUTATION = /^estimad[oa]s?\s*(?:\([oa]\))?\s*(?:contribuyentes?|usuarios?)?\s*[:,.]?$/i;

    const candidate = normalizeWhitespace(text)
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 25 && !SALUTATION.test(line));

    if (!candidate) return 'Comunicado SUNAT';

    let title = this.firstSentence(candidate);

    // Column limit is 500; leave headroom and never cut mid-word.
    const MAX = 300;
    if (title.length > MAX) {
      title = title.slice(0, MAX).replace(/\s+\S*$/, '') + '…';
    }

    return title;
  }

  /**
   * First sentence of a paragraph, ignoring full stops that belong to
   * abbreviations. These comunicados are dense with them — "a. m.", "p. m.",
   * "N° 271-2013/SUNAT.", "Sr.", "Av." — and naively splitting on the first
   * period truncates the headline mid-phrase.
   */
  private firstSentence(paragraph: string): string {
    const ABBREVIATIONS =
      /(?:\b[a-zA-Z]|\bsr|\bsra|\bdr|\bav|\bee\.\s?uu|\bnro|\bn|\bart|\binc|\bpág|\bapprox)$/i;

    const boundary = /[.!?](?=\s|$)/g;
    let match;

    while ((match = boundary.exec(paragraph)) !== null) {
      const head = paragraph.slice(0, match.index);

      // A single letter or a known abbreviation before the dot means the
      // sentence continues (e.g. "a. m.", "N.").
      if (ABBREVIATIONS.test(head)) continue;

      // Too short to be a headline on its own — keep reading.
      if (match.index < 40) continue;

      return paragraph.slice(0, match.index + 1);
    }

    return paragraph;
  }

  /**
   * Fetch HTML from SUNAT website with proper encoding handling.
   * SUNAT serves windows-1252 content, not UTF-8.
   */
  private async fetchPageHtml(): Promise<string> {
    return fetchHtml(this.baseUrl, { fallbackCharset: 'windows-1252' });
  }

  /**
   * Parse HTML table and extract listing metadata
   */
  private parseTable(html: string): MensajeListing[] {
    const items: MensajeListing[] = [];

    // Match all table rows: <tr>...</tr>
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const rowContent = match[1];
      const item = this.parseRow(rowContent);

      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Parse a single table row to extract listing metadata
   */
  private parseRow(rowContent: string): MensajeListing | null {
    // Extract first TD (date + link)
    const firstTdMatch = /<td[^>]*>(.*?)<\/td>/is.exec(rowContent);
    if (!firstTdMatch) return null;

    const dateLink = firstTdMatch[1];

    // Extract date from <a> tag content
    const dateMatch = />([^<]+)<\/a>/i.exec(dateLink);
    const dateStr = dateMatch?.[1]?.trim();
    if (!dateStr) return null;

    // Extract href from <a> tag
    const hrefMatch = /href=["']([^"']+)["']/i.exec(dateLink);
    const relativeUrl = hrefMatch?.[1];
    if (!relativeUrl) return null;

    // Extract second TD (content)
    const tds = rowContent.split(/<\/td>/i);
    if (tds.length < 2) return null;

    const contentTd = tds[1];
    const contentMatch = /<td[^>]*>(.*)/is.exec(contentTd);
    if (!contentMatch) return null;

    let summary = contentMatch[1].trim();
    // Remove the trailing <a href="+"> link
    summary = summary.replace(/<a[^>]*>\+<\/a>/i, '').trim();
    // Strip HTML tags for clean content
    summary = this.stripHtmlTags(summary);

    // Parse date from dd/mm/yyyy format
    const originalDate = this.parseSpanishDate(dateStr);
    if (!originalDate) return null;

    return {
      summary,
      sourceUrl: this.resolveUrl(relativeUrl),
      originalDate,
    };
  }

  /**
   * Resolve a listing href against the mensajes directory. Some rows link to
   * absolute or root-relative paths rather than the usual "month/year/file".
   */
  private resolveUrl(href: string): string {
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith('/')) return `https://www.sunat.gob.pe${href}`;
    return this.baseDir + href.replace(/^\.\//, '');
  }

  /**
   * Parse Spanish date format dd/mm/yyyy to Date object
   */
  private parseSpanishDate(dateStr: string): Date | null {
    const match = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateStr);
    if (!match) return null;

    const [, day, month, year] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day)
    );

    // Validate date
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Strip HTML tags and decode entities
   */
  private stripHtmlTags(html: string): string {
    // First decode HTML entities
    let content = decodeContent(html);
    // Then remove HTML tags
    content = content.replace(/<[^>]+>/g, '');
    // Collapse multiple spaces and trim
    return content.replace(/\s+/g, ' ').trim();
  }
}
