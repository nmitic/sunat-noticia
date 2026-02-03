import { BaseScraper, ScrapedNewsItem } from './base';
import { decodeContent } from '@/lib/utils/decode-content';

interface NewsMetadata {
  title: string;
  sourceUrl: string;
  originalDate: Date;
}

/**
 * Scraper for SUNAT institutional news
 * Source: https://www.gob.pe/institucion/sunat/noticias
 *
 * Scrapes official SUNAT news from the institutional page.
 * Uses two-stage scraping: first fetches the news list, then fetches content for each article.
 */
export class OficialSunatInstitucionScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.gob.pe/institucion/sunat/noticias';
  private readonly source = 'SUNAT Institución';

  async scrape(): Promise<ScrapedNewsItem[]> {
    const listHtml = await this.fetchPageHtml(this.baseUrl);
    const newsMetadata = this.parseNewsList(listHtml);

    console.log(`[${this.source}] Found ${newsMetadata.length} news items to process`);

    const items: ScrapedNewsItem[] = [];

    for (const meta of newsMetadata) {
      try {
        const content = await this.fetchArticleContent(meta.sourceUrl);

        if (!content) {
          console.warn(`[${this.source}] No content extracted from ${meta.sourceUrl}`);
          continue;
        }

        items.push({
          title: meta.title,
          content,
          source: this.source,
          sourceUrl: meta.sourceUrl,
          category: 'OFICIAL',
          originalDate: meta.originalDate,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[${this.source}] Failed to fetch article from ${meta.sourceUrl}: ${errorMsg}`);
      }
    }

    return items;
  }

  /**
   * Fetch HTML from a URL with proper headers
   */
  private async fetchPageHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SUNAT-Noticias/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}`
      );
    }

    // Get raw buffer to handle encoding properly
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // gob.pe typically uses UTF-8
    return new TextDecoder('utf-8').decode(bytes);
  }

  /**
   * Parse the news list page to extract news metadata
   */
  private parseNewsList(html: string): NewsMetadata[] {
    const items: NewsMetadata[] = [];

    // Match all <li> elements within the news list
    const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
    let liMatch;

    while ((liMatch = liRegex.exec(html)) !== null) {
      const liContent = liMatch[1];
      const item = this.parseNewsItem(liContent);

      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Parse a single news item <li> to extract metadata
   */
  private parseNewsItem(liContent: string): NewsMetadata | null {
    // Extract the anchor tag with the specific classes for title and URL
    const anchorRegex = /<a[^>]*class="[^"]*text-primary[^"]*card__mock[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/is;
    const anchorMatch = anchorRegex.exec(liContent);

    if (!anchorMatch) {
      return null;
    }

    const [, relativeUrl, titleHtml] = anchorMatch;
    const title = this.stripHtmlTags(titleHtml).trim();

    if (!relativeUrl || !title) {
      return null;
    }

    // Convert relative URL to absolute
    const sourceUrl = relativeUrl.startsWith('http')
      ? relativeUrl
      : `https://www.gob.pe${relativeUrl}`;

    // Extract the time element with datetime attribute
    const timeRegex = /<time[^>]*datetime="([^"]+)"[^>]*>/i;
    const timeMatch = timeRegex.exec(liContent);

    if (!timeMatch) {
      return null;
    }

    const dateStr = timeMatch[1];
    const originalDate = this.parseIsoDateTime(dateStr);

    if (!originalDate) {
      return null;
    }

    return {
      title,
      sourceUrl,
      originalDate,
    };
  }

  /**
   * Fetch the full article content from a news URL
   */
  private async fetchArticleContent(url: string): Promise<string> {
    const html = await this.fetchPageHtml(url);

    // Extract content from the feed-content div
    const contentRegex = /<div[^>]*class="[^"]*feed-content[^"]*"[^>]*>(.*?)<\/div>/is;
    const contentMatch = contentRegex.exec(html);

    if (!contentMatch) {
      console.warn(`[${this.source}] Could not find feed-content div in ${url}`);
      return '';
    }

    let content = contentMatch[1].trim();

    // Strip HTML tags and decode entities
    content = this.stripHtmlTags(content);

    return content;
  }

  /**
   * Strip HTML tags and decode entities
   */
  private stripHtmlTags(html: string): string {
    // First decode HTML entities
    let content = decodeContent(html);

    // Convert <br> tags to newlines before removing all tags
    content = content.replace(/<br\s*\/?>/gi, '\n');

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, '');

    // Collapse multiple spaces and newlines
    content = content.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
    content = content.replace(/\n\n+/g, '\n'); // Multiple newlines to single newline

    return content.trim();
  }

  /**
   * Parse ISO datetime format: "2025-12-31 10:47:00.000"
   */
  private parseIsoDateTime(dateStr: string): Date | null {
    // Expected format: YYYY-MM-DD HH:mm:ss.SSS
    const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/.exec(dateStr);

    if (!match) {
      console.warn(`[${this.source}] Could not parse date: ${dateStr}`);
      return null;
    }

    const [, yearStr, monthStr, dayStr, hourStr, minStr, secStr] = match;

    const date = new Date(
      parseInt(yearStr),
      parseInt(monthStr) - 1, // Month is 0-indexed
      parseInt(dayStr),
      parseInt(hourStr),
      parseInt(minStr),
      parseInt(secStr)
    );

    // Validate date
    return isNaN(date.getTime()) ? null : date;
  }
}
