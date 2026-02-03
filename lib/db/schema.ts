import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const newsCategoryEnum = pgEnum('NewsCategory', [
  'OFICIAL',
  'REDES_SOCIALES',
  'NOTICIAS',
]);
export const newsFlagEnum = pgEnum('NewsFlag', [
  'IMPORTANTE',
  'ACTUALIZACION',
  'URGENTE',
  'CAIDA_SISTEMA',
  'SALA_PRENSA',
]);

// Export types for application use
export type NewsCategory = 'OFICIAL' | 'REDES_SOCIALES' | 'NOTICIAS';
export type NewsFlag =
  | 'IMPORTANTE'
  | 'ACTUALIZACION'
  | 'URGENTE'
  | 'CAIDA_SISTEMA'
  | 'SALA_PRENSA';

// News Table
export const news = pgTable(
  'News',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    title: varchar('title', { length: 500 }).notNull(),
    content: text('content').notNull(),
    source: varchar('source', { length: 255 }).notNull(),
    sourceUrl: varchar('sourceUrl', { length: 1000 }),
    category: newsCategoryEnum('category').notNull(),
    published: boolean('published').notNull().default(false),
    flags: text('flags')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    publishedAt: timestamp('publishedAt', { withTimezone: true }),
    scrapedAt: timestamp('scrapedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    originalDate: timestamp('originalDate', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    publishedDateIdx: index('news_published_date_idx').on(
      table.published,
      table.originalDate.desc()
    ),
    categoryIdx: index('news_category_idx').on(table.category),
  })
);

// EmailSubscription Table
export const emailSubscription = pgTable(
  'EmailSubscription',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    email: varchar('email', { length: 255 }).notNull().unique(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index('email_subscription_email_idx').on(table.email),
  })
);

// Admin Table
export const admin = pgTable('Admin', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('passwordHash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ScraperRun Table
export const scraperRun = pgTable(
  'ScraperRun',
  {
    id: varchar('id', { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    scraperName: varchar('scraperName', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    itemsScraped: integer('itemsScraped').notNull().default(0),
    errorMessage: text('errorMessage'),
    startedAt: timestamp('startedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completedAt', { withTimezone: true }),
  },
  (table) => ({
    scraperNameDateIdx: index('scraper_run_name_date_idx').on(
      table.scraperName,
      table.startedAt.desc()
    ),
  })
);

// TypeScript type inference
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type EmailSubscription = typeof emailSubscription.$inferSelect;
export type NewEmailSubscription = typeof emailSubscription.$inferInsert;
export type Admin = typeof admin.$inferSelect;
export type NewAdmin = typeof admin.$inferInsert;
export type ScraperRun = typeof scraperRun.$inferSelect;
export type NewScraperRun = typeof scraperRun.$inferInsert;
