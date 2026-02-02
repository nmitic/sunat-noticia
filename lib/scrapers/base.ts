import { NewsCategory } from '@/lib/db/schema';
import { db, newsTable, scraperRunTable } from '@/lib/db/drizzle';
import { eq, and } from 'drizzle-orm';

export interface ScrapedNewsItem {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  category: NewsCategory;
  originalDate: Date;
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
  protected async afterScrape(items: ScrapedNewsItem[]): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Execute the scraper with error handling and logging
   */
  async execute(): Promise<{ success: boolean; count: number; error?: string }> {
    const runId = await this.logStart();

    try {
      await this.beforeScrape();
      const items = await this.scrape();

      if (items.length > 0) {
        await this.saveToDatabase(items);
      }

      await this.afterScrape(items);
      await this.logSuccess(runId, items.length);

      console.log(
        `[${this.config.name}] Successfully scraped ${items.length} items`
      );
      return { success: true, count: items.length };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logFailure(runId, errorMsg);
      console.error(`[${this.config.name}] Error during scraping:`, errorMsg);
      return { success: false, count: 0, error: errorMsg };
    }
  }

  /**
   * Save items to database with deduplication
   */
  private async saveToDatabase(items: ScrapedNewsItem[]): Promise<void> {
    for (const item of items) {
      // Check if item already exists (by title + source + date)
      const [existing] = await db.select()
        .from(newsTable)
        .where(and(
          eq(newsTable.title, item.title),
          eq(newsTable.source, item.source),
          eq(newsTable.originalDate, item.originalDate)
        ))
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
            flags: [],
          });
      }
    }
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
