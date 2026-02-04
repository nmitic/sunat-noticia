import { BaseScraper, ScrapedNewsItem } from './base';

/**
 * Scraper for Gestion.pe news about SUNAT
 * Source: https://gestion.pe/buscar/sunat/todas/descendiente/?query=sunat
 */
export class NoticiasGestionScraper extends BaseScraper {
    private readonly source = 'NOTICIAS gestion';
    private readonly searchUrl =
        'https://gestion.pe/buscar/sunat/todas/descendiente/?query=sunat';

    async scrape(): Promise<ScrapedNewsItem[]> {
        const response = await fetch(this.searchUrl, {
            headers: {
                'User-Agent': 'SUNAT-Noticias/1.0',
                'Accept': 'text/html',
            },
        });

        if (!response.ok) {
            throw new Error(
                `Gestion.pe error: ${response.status} ${response.statusText}`
            );
        }

        const html = await response.text();
        return this.parseStoryItems(html);
    }

    private parseStoryItems(html: string): ScrapedNewsItem[] {
        const items: ScrapedNewsItem[] = [];

        // Split HTML at each story-item div boundary (space after "story-item" avoids matching sub-elements like story-item__bottom)
        const chunks = html.split(/<div[^>]*class="story-item\s/i);

        // Skip first chunk (content before the first story-item)
        for (let i = 1; i < chunks.length; i++) {
            const block = chunks[i];
            const item = this.parseStoryBlock(block);
            if (item) {
                items.push(item);
            }
        }

        return items;
    }

    private parseStoryBlock(block: string): ScrapedNewsItem | null {
        // Extract title and URL from h2.story-item__content-title > a
        const titleMatch = /<h2[^>]*class="[^"]*story-item__content-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
        if (!titleMatch) return null;

        const rawUrl = titleMatch[1].trim();
        const title = this.stripHtml(titleMatch[2]).trim();
        if (!title) return null;

        // Build full URL
        const sourceUrl = rawUrl.startsWith('http')
            ? rawUrl
            : `https://gestion.pe${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

        // Extract content from p.story-item__subtitle
        const contentMatch = /<p[^>]*class="[^"]*story-item__subtitle[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block);
        const content = contentMatch
            ? this.stripHtml(contentMatch[1]).trim()
            : title;

        // Extract date from span.story-item__date-time
        const dateMatch = /<span[^>]*class="[^"]*story-item__date-time[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
        const originalDate = dateMatch
            ? this.parseDate(this.stripHtml(dateMatch[1]).trim())
            : new Date();

        return {
            title,
            content,
            source: this.source,
            sourceUrl,
            category: 'NOTICIAS',
            originalDate,
        };
    }

    private parseDate(dateStr: string): Date {
        // Gestion dates can be relative ("hace 2 horas") or absolute ("15/01/2026 10:30")
        const absoluteMatch = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateStr);
        if (absoluteMatch) {
            const [, day, month, year] = absoluteMatch;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(date.getTime())) return date;
        }
        // Fallback to current date for relative or unparseable dates
        return new Date();
    }

    private stripHtml(html: string): string {
        return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
}
