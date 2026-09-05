import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { db, newsTable, scraperRunTable } from '@/lib/db/drizzle';
import { eq, and, inArray } from 'drizzle-orm';

export interface ScrapedNewsItem {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  category: NewsCategory;
  originalDate: Date;
  flags?: NewsFlag[];
}

export interface ScraperConfig {
  name: string;
  category: NewsCategory;
  enabled: boolean;
  cronSchedule: string;
}

export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Public, read-only view of this scraper's configuration
   */
  get settings(): Readonly<ScraperConfig> {
    return this.config;
  }

  /**
   * Main scraping method to implement in subclasses
   */
  abstract scrape(): Promise<ScrapedNewsItem[]>;

  /**
   * Lifecycle hook: run before scraping
   */
  protected async beforeScrape(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Lifecycle hook: run after successful scraping
   */
  protected async afterScrape(_items: ScrapedNewsItem[]): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Which of these source URLs are already stored for this scraper's source.
   *
   * Two-stage scrapers call this with the listing URLs so they can skip the
   * detail fetch for items already held: a steady-state run then costs one
   * listing request instead of one request per listing row.
   *
   * Scoped by source because the same URL could in principle be surfaced by
   * more than one listing, and the index is on (source, sourceUrl).
   */
  protected async findKnownUrls(source: string, urls: string[]): Promise<Set<string>> {
    const known = new Set<string>();
    const unique = [...new Set(urls.filter(Boolean))];

    if (unique.length === 0) return known;

    // Chunked to stay well clear of the bind-parameter ceiling on large listings.
    const CHUNK = 500;

    for (let i = 0; i < unique.length; i += CHUNK) {
      const rows = await db
        .select({ sourceUrl: newsTable.sourceUrl })
        .from(newsTable)
        .where(
          and(
            eq(newsTable.source, source),
            inArray(newsTable.sourceUrl, unique.slice(i, i + CHUNK))
          )
        );

      for (const row of rows) {
        if (row.sourceUrl) known.add(row.sourceUrl);
      }
    }

    return known;
  }

  /**
   * Execute the scraper with error handling and logging
   */
  async execute(): Promise<{ success: boolean; count: number; newCount: number; duplicateCount: number; error?: string }> {
    const runId = await this.logStart();

    try {
      await this.beforeScrape();
      const items = await this.scrape();

      let newCount = 0;
      let duplicateCount = 0;

      if (items.length > 0) {
        const result = await this.saveToDatabase(items);
        newCount = result.newCount;
        duplicateCount = result.duplicateCount;
      }

      await this.afterScrape(items);
      await this.logSuccess(runId, items.length);

      console.log(
        `[${this.config.name}] Successfully scraped ${items.length} items (${newCount} new, ${duplicateCount} duplicates)`
      );
      return { success: true, count: items.length, newCount, duplicateCount };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logFailure(runId, errorMsg);
      console.error(`[${this.config.name}] Error during scraping:`, errorMsg);
      return { success: false, count: 0, newCount: 0, duplicateCount: 0, error: errorMsg };
    }
  }

  /**
   * Save items to database with deduplication
   */
  private async saveToDatabase(items: ScrapedNewsItem[]): Promise<{ newCount: number; duplicateCount: number }> {
    let newCount = 0;
    let duplicateCount = 0;

    for (const item of items) {
      // sourceUrl is the stable identity when there is one: titles are derived
      // from page content and shift whenever extraction improves, which would
      // otherwise make every item look new. Fall back to title + date for rows
      // with no URL.
      const identity = item.sourceUrl
        ? and(
            eq(newsTable.source, item.source),
            eq(newsTable.sourceUrl, item.sourceUrl)
          )
        : and(
            eq(newsTable.title, item.title),
            eq(newsTable.source, item.source),
            eq(newsTable.originalDate, item.originalDate)
          );

      const [existing] = await db.select()
        .from(newsTable)
        .where(identity)
        .limit(1);

      if (!existing) {
        await db.insert(newsTable)
          .values({
            title: item.title,
            content: item.content,
            source: item.source,
            sourceUrl: item.sourceUrl,
            category: item.category,
            originalDate: item.originalDate,
            published: false,
            flags: item.flags ?? [],
          });
        newCount++;
      } else {
        // Update flags on existing items if the scraper provides default flags
        if (item.flags?.length && existing.flags.length === 0) {
          await db.update(newsTable)
            .set({ flags: item.flags })
            .where(eq(newsTable.id, existing.id));
        }
        duplicateCount++;
      }
    }

    return { newCount, duplicateCount };
  }

  /**
   * Log scraper run start
   */
  private async logStart(): Promise<string> {
    const [run] = await db.insert(scraperRunTable)
      .values({
        scraperName: this.config.name,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      })
      .returning();
    return run.id;
  }

  /**
   * Log successful scraper run
   */
  private async logSuccess(runId: string, count: number): Promise<void> {
    await db.update(scraperRunTable)
      .set({
        status: 'SUCCESS',
        itemsScraped: count,
        completedAt: new Date(),
      })
      .where(eq(scraperRunTable.id, runId));
  }

  /**
   * Log failed scraper run
   */
  private async logFailure(runId: string, error: string): Promise<void> {
    await db.update(scraperRunTable)
      .set({
        status: 'FAILURE',
        errorMessage: error,
        completedAt: new Date(),
      })
      .where(eq(scraperRunTable.id, runId));
  }
}
