import { BaseScraper, ScrapedNewsItem } from './base';

interface LaRepublicaArticle {
  title: string;
  date: string;
  slug: string;
  data?: {
    teaser?: string;
  };
}

interface LaRepublicaResponse {
  articles?: {
    data?: LaRepublicaArticle[];
  };
}

/**
 * Scraper for La Republica news about SUNAT
 * Source: https://larepublica.pe/api/search/articles?search=sunat
 */
export class NoticiasLaRepublicaScraper extends BaseScraper {
  private readonly source = 'NOTICIAS la republica';
  private readonly apiUrl =
    'https://larepublica.pe/api/search/articles?search=sunat&limit=30&page=1&order_by=update_date';

  async scrape(): Promise<ScrapedNewsItem[]> {
    const response = await fetch(this.apiUrl, {
      headers: {
        'User-Agent': 'SUNAT-Noticias/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `La Republica API error: ${response.status} ${response.statusText}`
      );
    }

    const data: LaRepublicaResponse = await response.json();

    const articles = data.articles?.data;
    if (!articles || !Array.isArray(articles)) {
      throw new Error('Invalid La Republica API response: missing articles.data');
    }

    return articles
      .filter((article) => article.title && article.date)
      .map((article) => ({
        title: article.title,
        content: article.data?.teaser || article.title,
        source: this.source,
        sourceUrl: article.slug
          ? `https://larepublica.pe${article.slug.startsWith('/') ? '' : '/'}${article.slug}`
          : undefined,
        category: 'NOTICIAS' as const,
        originalDate: new Date(article.date),
      }));
  }
}
