import { BaseScraper, ScrapedNewsItem } from './base';
import { decodeContent } from '@/lib/utils/decode-content';

/**
 * Scraper for SUNAT press releases (Sala de Prensa - Lima)
 * Source: https://www.sunat.gob.pe/salaprensa/lima/index.html
 *
 * Scrapes press release listings from the SUNAT sala de prensa page.
 * Each table row contains a date, press note title (em), and headline link (a).
 */
export class OficialSunatSalaPresaScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.sunat.gob.pe/salaprensa/lima/index.html';
  private readonly baseDir = 'https://www.sunat.gob.pe/salaprensa/';
  private readonly source = 'SUNAT salaprensa';

  private readonly monthMap: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
  };

  async scrape(): Promise<ScrapedNewsItem[]> {
    const html = await this.fetchPageHtml();
    return this.parseTable(html);
  }

  private async fetchPageHtml(): Promise<string> {
    const response = await fetch(this.baseUrl, {
      headers: {
        'User-Agent': 'SUNAT-Noticias/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch SUNAT sala de prensa page: ${response.status} ${response.statusText}`
      );
    }

    const buffer = await response.arrayBuffer();
    return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
  }

  private parseTable(html: string): ScrapedNewsItem[] {
    const items: ScrapedNewsItem[] = [];

    // The page has unclosed <tr> tags for news rows, so we split by <tr to get segments
    const segments = html.split(/<tr[^>]*>/i);

    for (const segment of segments) {
      const item = this.parseRow(segment);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private parseRow(rowContent: string): ScrapedNewsItem | null {
    // Skip header/separator rows (colspan rows)
    if (/colspan/i.test(rowContent)) return null;

    // Extract TDs
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 2) return null;

    const dateTd = tds[0];
    const contentTd = tds[1];

    // Extract date: "DD<br>Mon" or "DD Mon"
    const dateMatch = /(\d{1,2})\s*(?:<br\s*\/?>)?\s*([A-Za-záéíóúñ]+)/i.exec(dateTd);
    if (!dateMatch) return null;

    const day = parseInt(dateMatch[1]);
    const monthAbbr = dateMatch[2].toLowerCase().substring(0, 3);
    const monthIndex = this.monthMap[monthAbbr];
    if (monthIndex === undefined) return null;

    // Extract title from <em> tag
    const emMatch = /<em[^>]*>([\s\S]*?)<\/em>/i.exec(contentTd);
    if (!emMatch) return null;
    const title = this.stripHtmlTags(emMatch[1]);
    if (!title) return null;

    // Extract content and URL from <a> tags
    // Some rows have multiple anchors (one empty/nbsp, one with actual text)
    const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let anchorMatch;
    let href = '';
    let content = '';

    // Find the anchor with meaningful text content
    while ((anchorMatch = anchorRegex.exec(contentTd)) !== null) {
      const text = this.stripHtmlTags(anchorMatch[2]);
      if (text && text !== '\u00a0' && text.length > 1) {
        href = anchorMatch[1];
        content = text;
        break;
      }
    }

    if (!content || !href) return null;

    // Build source URL from relative href
    const sourceUrl = href.startsWith('http')
      ? href
      : this.resolveUrl(href);

    // Extract year from href path: ../YYYY/month/file
    const yearMatch = /(\d{4})\//.exec(href);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    const originalDate = new Date(year, monthIndex, day);
    if (isNaN(originalDate.getTime())) return null;

    return {
      title,
      content,
      source: this.source,
      sourceUrl,
      category: 'OFICIAL',
      originalDate,
    };
  }

  /**
   * Resolve relative href to absolute URL
   * Hrefs are relative to /salaprensa/lima/, e.g. "../2025/diciembre/file.docx"
   */
  private resolveUrl(relativeHref: string): string {
    const cleaned = relativeHref.replace(/^\.\.\//, '');
    return this.baseDir + cleaned;
  }

  private stripHtmlTags(html: string): string {
    let content = decodeContent(html);
    content = content.replace(/<br\s*\/?>/gi, ' ');
    content = content.replace(/<[^>]+>/g, '');
    content = content.replace(/\s+/g, ' ');
    return content.trim();
  }
}
