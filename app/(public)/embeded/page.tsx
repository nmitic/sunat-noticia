import { NewsFeed } from '@/components/news/NewsFeed';
import { queryPublishedNews, type NewsRow } from '@/lib/api/news-query';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SUNAT Noticias - Embedded',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmbeddedPage({ searchParams }: PageProps) {
  let news: NewsRow[] = [];
  let dbError = false;

  // Await and extract search params
  const params = await searchParams;
  const categoryParam = params.category as string | undefined;
  const flagsParam = params.flags as string | undefined;

  // Create a key for NewsFeed based on filters to force remount when filters change
  const feedKey = `${categoryParam || 'all'}-${flagsParam || 'none'}`;

  try {
    const result = await queryPublishedNews({
      limit: 50,
      category: categoryParam ?? null,
      flags: flagsParam ?? null,
    });

    news = result.news;
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
  }

  return (
    <>
      {dbError ? (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
          <p className="text-foreground/80">
            Ocurrió un error al cargar las noticias. Por favor, inténtalo más tarde.
          </p>
        </div>
      ) : (
        <NewsFeed key={feedKey} initialNews={news} embeded />
      )}
    </>
  );
}
