import { BaseScraper, ScrapedNewsItem } from './base';
import { NewsCategory } from '@prisma/client';

export class FacebookScraper extends BaseScraper {
  private readonly pageId = 'SUNAT';
  private readonly accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  async scrape(): Promise<ScrapedNewsItem[]> {
    if (!this.accessToken) {
      throw new Error('FACEBOOK_ACCESS_TOKEN is not configured');
    }

    const url = new URL('https://graph.facebook.com/v18.0');
    url.pathname = `/${this.pageId}/posts`;
    url.searchParams.append('fields', 'message,created_time,permalink_url');
    url.searchParams.append('limit', '10');
    url.searchParams.append('access_token', this.accessToken);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'SUNAT-Noticias/1.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid Facebook API response format');
    }

    return data.data
      .filter((post: any) => post.message) // Only include posts with message
      .map((post: any) => ({
        title: this.extractTitle(post.message),
        content: post.message,
        source: 'Facebook SUNAT',
        sourceUrl: post.permalink_url,
        category: 'REDES_SOCIALES' as NewsCategory,
        originalDate: new Date(post.created_time),
      }));
  }

  /**
   * Extract title from message (first line or first 100 chars)
   */
  private extractTitle(message: string): string {
    const lines = message.split('\n');
    const firstLine = lines[0].trim();

    return firstLine.length > 100
      ? firstLine.substring(0, 97) + '...'
      : firstLine;
  }
}
