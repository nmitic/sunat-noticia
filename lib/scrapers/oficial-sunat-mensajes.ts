import { BaseScraper, ScrapedNewsItem } from './base';
import { decodeContent } from '@/lib/utils/decode-content';

/**
 * Scraper for official SUNAT mensajes (messages)
 * Source: https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html
 *
 * Scrapes SUNAT official messages/announcements from the mensajes page.
 */
export class OficialSunatMensajesScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html';
  private readonly baseDir = 'https://www.sunat.gob.pe/mensajes/';
  private readonly source = 'SUNAT mensajes';

  async scrape(): Promise<ScrapedNewsItem[]> {
    const html = await this.fetchPageHtml();
    return this.parseTable(html);
  }

  /**
   * Fetch HTML from SUNAT website with proper encoding handling
   * SUNAT serves ISO-8859-1 encoded content, not UTF-8
   */
  private async fetchPageHtml(): Promise<string> {
    const response = await fetch(this.baseUrl, {
      headers: {
        'User-Agent': 'SUNAT-Noticias/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch SUNAT mensajes page: ${response.status} ${response.statusText}`
      );
    }

    // Check Content-Type header for charset
    const contentType = response.headers.get('content-type') || '';
    console.log(`Content-Type: ${contentType}`);

    // Get raw buffer to handle encoding properly
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect charset from HTML meta tag or Content-Type
    let charset = 'iso-8859-1'; // Default for SUNAT

    // Check for charset in Content-Type header
    const headerCharset = contentType.match(/charset=([^\s;]+)/i)?.[1];
    if (headerCharset) {
      charset = headerCharset.replace(/['"]/g, '').trim().toLowerCase();
    }

    console.log(`Detected charset: ${charset}`);

    // Convert bytes to string based on detected encoding
    if (charset === 'utf-8' || charset === 'utf8') {
      // UTF-8: use standard decoder
      return new TextDecoder('utf-8').decode(bytes);
    } else if (charset === 'iso-8859-1' || charset === 'latin1' || charset === 'windows-1252') {
      // ISO-8859-1 / Latin-1: each byte maps directly to Unicode code point
      let result = '';
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return result;
    } else {
      // Fallback: try TextDecoder with detected charset
      try {
        return new TextDecoder(charset).decode(bytes);
      } catch (error) {
        console.warn(`Charset ${charset} not supported, using ISO-8859-1 fallback`);
        // Fallback to ISO-8859-1
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
          result += String.fromCharCode(bytes[i]);
        }
        return result;
      }
    }
  }

  /**
   * Parse HTML table and extract news items
   * Optimized for performance using regex matching instead of DOM parsing
   */
  private parseTable(html: string): ScrapedNewsItem[] {
    const items: ScrapedNewsItem[] = [];

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
   * Parse a single table row to extract news item data
   */
  private parseRow(rowContent: string): ScrapedNewsItem | null {
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

    let content = contentMatch[1].trim();
    // Remove the trailing <a href="+"> link
    content = content.replace(/<a[^>]*>\+<\/a>/i, '').trim();
    // Strip HTML tags for clean content
    content = this.stripHtmlTags(content);

    // Parse date from dd/mm/yyyy format
    const originalDate = this.parseSpanishDate(dateStr);
    if (!originalDate) return null;

    return {
      title: 'COMUNICADO',
      content,
      source: this.source,
      sourceUrl: this.baseDir + relativeUrl,
      category: 'OFICIAL',
      originalDate,
    };
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
