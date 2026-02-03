import * as cron from 'node-cron';
import { BaseScraper, ScraperConfig } from './base';
import { FacebookScraper } from './facebook';
import { OficialSunatMensajesScraper } from './oficial-sunat-mensajes';
import { OficialSunatSalaPresaScraper } from './oficial-sunat-salapresa';
import { OficialSunatInstitucionScraper } from './oficial-sunat-institucion';
import { NoticiasScraper } from './noticias-placeholder';
import { NewsCategory } from '@/lib/db/schema';

/**
 * Global list of all scrapers
 */
const scrapers: BaseScraper[] = [
  new FacebookScraper({
    name: 'facebook-sunat',
    category: 'REDES_SOCIALES' as NewsCategory,
    enabled: true,
    cronSchedule: '0 */2 * * *', // Every 2 hours
  }),
  new OficialSunatMensajesScraper({
    name: 'oficial-sources-mensaje',
    category: 'OFICIAL' as NewsCategory,
    enabled: true,
    cronSchedule: '0 */6 * * *', // Every 6 hours
  }),
  new OficialSunatSalaPresaScraper({
    name: 'oficial-sources-sala',
    category: 'OFICIAL' as NewsCategory,
    enabled: true,
    cronSchedule: '0 */6 * * *', // Every 6 hours
  }),
  new OficialSunatInstitucionScraper({
    name: 'oficial-sources-institucion',
    category: 'OFICIAL' as NewsCategory,
    enabled: true,
    cronSchedule: '0 */6 * * *', // Every 6 hours
  }),
  new NoticiasScraper({
    name: 'news-outlets',
    category: 'NOTICIAS' as NewsCategory,
    enabled: false, // Disabled until implemented
    cronSchedule: '0 */4 * * *', // Every 4 hours
  }),
];

/**
 * Global variable to store scheduled tasks
 */
let scheduledTasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();

/**
 * Start the scheduler - runs all enabled scrapers on their cron schedules
 */
export function startScheduler() {
  console.log('Starting scraper scheduler...');

  scrapers.forEach((scraper) => {
    const config = (scraper as any).config as ScraperConfig;

    if (config.enabled) {
      console.log(`Scheduling scraper: ${config.name} (${config.cronSchedule})`);

      const task = cron.schedule(config.cronSchedule, async () => {
        console.log(`[${new Date().toISOString()}] Running scraper: ${config.name}`);
        await scraper.execute();
      });

      scheduledTasks.set(config.name, task);
    } else {
      console.log(`Scraper disabled: ${config.name}`);
    }
  });

  console.log('Scraper scheduler started successfully');
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  console.log('Stopping scraper scheduler...');

  scheduledTasks.forEach((task, name) => {
    task.stop();
    console.log(`Stopped scraper task: ${name}`);
  });

  scheduledTasks.clear();
  console.log('Scraper scheduler stopped');
}

/**
 * Manually run a specific scraper by name
 */
export async function runScraperManually(name: string) {
  const scraper = scrapers.find((s) => (s as any).config.name === name);

  if (!scraper) {
    throw new Error(`Scraper not found: ${name}`);
  }

  console.log(`Manually running scraper: ${name}`);
  return await scraper.execute();
}

/**
 * Get status of all scrapers
 */
export function getScraperStatus() {
  return scrapers.map((scraper) => {
    const config = (scraper as any).config as ScraperConfig;
    const isRunning = scheduledTasks.has(config.name);

    return {
      name: config.name,
      category: config.category,
      enabled: config.enabled,
      schedule: config.cronSchedule,
      running: isRunning,
    };
  });
}
