/**
 * The queries behind the status page.
 *
 * A sibling of `news-query.ts` rather than an extension of it: `queryPublishedNews`
 * has one coherent job — the paginated public feed, shared by two API routes and
 * two pages — and bolting these shapes onto it would mean optional parameters
 * that only one caller ever passes.
 */

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFlag } from '@/lib/db/schema';
import type { OutageItem } from '@/lib/outage/status';
import type { NewsRow } from './news-query';

/**
 * How far back an outage notice can be dated and still be worth evaluating.
 * A window that opened more than this ago has closed under any reading, and the
 * staleness guard in `isActive` would discard it anyway.
 */
const OUTAGE_LOOKBACK_DAYS = 14;
const OUTAGE_LIMIT = 30;

export type OutageCandidates = {
  /** Notices with admin-approved structured data, newest first. */
  items: OutageItem[];
  /**
   * Notices flagged as an outage that nobody has reviewed yet. They carry no
   * window, so they cannot be placed in time — the page reports them as
   * pending rather than guessing whether they are current.
   */
  unreviewedCount: number;
};

/** `flags` is a plain text[], so containment needs the explicit cast. */
const IS_OUTAGE = sql`${newsTable.flags} @> ARRAY['CAIDA_SISTEMA']::text[]`;

export async function queryOutageCandidates(params?: {
  lookbackDays?: number;
  limit?: number;
}): Promise<OutageCandidates> {
  const lookbackDays = params?.lookbackDays ?? OUTAGE_LOOKBACK_DAYS;
  const limit = params?.limit ?? OUTAGE_LIMIT;
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: newsTable.id,
      title: newsTable.title,
      sourceUrl: newsTable.sourceUrl,
      originalDate: newsTable.originalDate,
      structuredData: newsTable.structuredData,
    })
    .from(newsTable)
    .where(and(eq(newsTable.published, true), IS_OUTAGE, gte(newsTable.originalDate, since)))
    .orderBy(desc(newsTable.originalDate))
    .limit(limit);

  const items: OutageItem[] = [];
  let unreviewedCount = 0;

  // Splitting reviewed from unreviewed here rather than in SQL is deliberate:
  // both numbers come out of one round trip instead of two.
  for (const row of rows) {
    if (row.structuredData) {
      items.push({
        id: row.id,
        title: row.title,
        sourceUrl: row.sourceUrl,
        originalDate: row.originalDate,
        structuredData: row.structuredData,
      });
    } else {
      unreviewedCount++;
    }
  }

  return { items, unreviewedCount };
}

/**
 * The newest items that are *not* outage notices — the status page already
 * covers those in its own sections, so repeating them in the news strip would
 * just say the same thing twice.
 */
export async function queryLatestNonOutageNews(limit = 5): Promise<NewsRow[]> {
  const rows = await db
    .select({
      id: newsTable.id,
      title: newsTable.title,
      content: newsTable.content,
      source: newsTable.source,
      sourceUrl: newsTable.sourceUrl,
      category: newsTable.category,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
      publishedAt: newsTable.publishedAt,
      structuredData: newsTable.structuredData,
    })
    .from(newsTable)
    // Safe because `flags` is NOT NULL with an empty-array default: an empty
    // array does not contain the flag, so unflagged items pass the negation.
    .where(and(eq(newsTable.published, true), sql`NOT (${IS_OUTAGE})`))
    .orderBy(desc(newsTable.originalDate))
    .limit(limit);

  return rows.map((row) => ({ ...row, flags: (row.flags as NewsFlag[]) ?? [] }));
}

/**
 * When the site last heard anything from SUNAT, for the freshness line.
 *
 * Kept separate from the strip above, whose newest row excludes outages and so
 * would understate freshness during an incident.
 */
export async function queryLastNewsAt(): Promise<Date | null> {
  const [row] = await db
    .select({ originalDate: newsTable.originalDate })
    .from(newsTable)
    .where(eq(newsTable.published, true))
    .orderBy(desc(newsTable.originalDate))
    .limit(1);

  return row?.originalDate ?? null;
}
