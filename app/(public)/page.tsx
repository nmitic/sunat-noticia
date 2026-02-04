import { db, newsTable } from '@/lib/db/drizzle';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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

export default async function HomePage() {
  // Fetch published news
  let news: NewsItem[] = [];
  let dbError = false;

  try {
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
      .where(eq(newsTable.published, true))
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
              ) : news.length > 0 ? (
                <NewsFeed initialNews={news} />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-gray-50 dark:bg-gray-900 p-12 text-center">
                  <p className="text-muted-foreground">{UI_TEXT.public.noNews}</p>
                </div>
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
