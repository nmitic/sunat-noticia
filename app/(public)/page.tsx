import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EmailSubscriptionForm } from '@/components/layout/EmailSubscriptionForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Agregador de Noticias',
  description: 'Últimas noticias sobre SUNAT de fuentes oficiales y medios de comunicación',
};

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string | null;
  category: NewsCategory;
  flags: NewsFlag[];
  originalDate: Date;
  publishedAt: Date | null;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  // Await and extract search params
  const params = await searchParams;
  const categoryParam = params.category as string | undefined;
  const flagsParam = params.flags as string | undefined;

  // Create a key for NewsFeed based on filters to force remount when filters change
  const feedKey = `${categoryParam || 'all'}-${flagsParam || 'none'}`;

  // Fetch published news with filters
  let news: NewsItem[] = [];
  let dbError = false;

  try {
    // Build query conditions
    const conditions = [eq(newsTable.published, true)];

    // Add category filter (single category)
    if (categoryParam) {
      const category = categoryParam as NewsCategory;
      conditions.push(eq(newsTable.category, category));
    }

    // Add flags filter (array of flags - item must have at least one)
    if (flagsParam) {
      const flags = flagsParam.split(',') as NewsFlag[];
      if (flags.length > 0) {
        // Use PostgreSQL array overlap operator: flags && ARRAY['flag1', 'flag2']
        const flagConditions = flags.map(flag =>
          sql`${newsTable.flags} @> ARRAY[${flag}]::text[]`
        );
        conditions.push(or(...flagConditions)!);
      }
    }

    const newsRows = await db.select({
      id: newsTable.id,
      title: newsTable.title,
      content: newsTable.content,
      source: newsTable.source,
      sourceUrl: newsTable.sourceUrl,
      category: newsTable.category,
      flags: newsTable.flags,
      originalDate: newsTable.originalDate,
      publishedAt: newsTable.publishedAt,
    }).from(newsTable)
      .where(and(...conditions))
      .orderBy(desc(newsTable.originalDate))
      .limit(50);

    news = newsRows.map(row => ({
      ...row,
      flags: (row.flags as NewsFlag[]) || [],
    }));
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Desktop layout: title + content + sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                  Noticias de SUNAT
                </h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Últimas noticias de fuentes oficiales, redes sociales y medios de comunicación
                </p>
              </div>

              {dbError ? (
                <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
                  <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
                  <p className="text-foreground/80">
                    Ocurrió un error al cargar las noticias. Por favor, inténtalo más tarde.
                  </p>
                </div>
              ) : (
                <NewsFeed key={feedKey} initialNews={news} />
              )}
            </div>
          </div>

          {/* Subscription form */}
          <EmailSubscriptionForm />
        </div>
      </div>
      <Footer />
    </>

  );
}
