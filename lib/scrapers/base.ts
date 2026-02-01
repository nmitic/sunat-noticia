import { NewsCategory } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

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
      const existing = await prisma.news.findFirst({
        where: {
          title: item.title,
          source: item.source,
          originalDate: item.originalDate,
        },
      });

      if (!existing) {
        await prisma.news.create({
          data: {
            title: item.title,
            content: item.content,
            source: item.source,
            sourceUrl: item.sourceUrl,
            category: item.category,
            originalDate: item.originalDate,
            published: false,
            flags: [],
          },
        });
      }
    }
  }

  /**
   * Log scraper run start
   */
  private async logStart(): Promise<string> {
    const run = await prisma.scraperRun.create({
      data: {
        scraperName: this.config.name,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
    return run.id;
  }

  /**
   * Log successful scraper run
   */
  private async logSuccess(runId: string, count: number): Promise<void> {
    await prisma.scraperRun.update({
      where: { id: runId },
      data: {
        status: 'SUCCESS',
        itemsScraped: count,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Log failed scraper run
   */
  private async logFailure(runId: string, error: string): Promise<void> {
    await prisma.scraperRun.update({
      where: { id: runId },
      data: {
        status: 'FAILURE',
        errorMessage: error,
        completedAt: new Date(),
      },
    });
  }
}
