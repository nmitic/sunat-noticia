import { BaseScraper, ScrapedNewsItem } from './base';

/**
 * Placeholder scraper for official SUNAT sources
 *
 * TODO: Implement scraping for:
 * - https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html
 * - https://www.gob.pe/institucion/sunat/noticias
 * - https://www.sunat.gob.pe/salaprensa/lima/index.html
 *
 * Recommended libraries:
 * - cheerio: HTML parsing
 * - puppeteer: JavaScript-heavy sites
 */
export class OficialScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.sunat.gob.pe/mensajes/mensajes-SUNAT.html';
  private readonly baseDir = 'https://www.sunat.gob.pe/mensajes/';
  private readonly source = 'SUNAT mensajes';

  async scrape(): Promise<ScrapedNewsItem[]> {
    const html = await this.fetchPageHtml();
    return this.parseTable(html);
  }

  /**
   * Fetch HTML from SUNAT website
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

    return response.text();
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
   * Strip HTML tags from string efficiently
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Convert HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }
}
