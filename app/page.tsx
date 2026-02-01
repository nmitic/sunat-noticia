import { prisma } from '@/lib/db/prisma';
import { NewsFeed } from '@/components/news/NewsFeed';
import { UI_TEXT } from '@/lib/utils/constants';
import { NewsCategory, NewsFlag } from '@prisma/client';

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
  let errorMessage = '';

  try {
    news = await prisma.news.findMany({
      where: { published: true },
      orderBy: { originalDate: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        source: true,
        sourceUrl: true,
        category: true,
        flags: true,
        originalDate: true,
        publishedAt: true,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    dbError = true;
    errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-gray-50 dark:bg-gray-900 border-b border-border shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">SUNAT Noticias</h1>
            <nav className="hidden md:flex gap-6">
              <a href="#" className="hover:text-primary transition-colors text-sm text-foreground">
                Noticias
              </a>
              <a href="#" className="hover:text-primary transition-colors text-sm text-foreground">
                Categorías
              </a>
              <a href="#" className="hover:text-primary transition-colors text-sm text-foreground">
                Acerca de
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">
              Noticias de SUNAT
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Últimas noticias de fuentes oficiales, redes sociales y medios de comunicación
            </p>
          </div>

          {dbError ? (
            <div className="rounded-lg border border-destructive bg-destructive/5 p-8 text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error de Conexión</h3>
              <p className="text-foreground/80 mb-4">
                No se pudo conectar a la base de datos. Por favor, asegúrate de que:
              </p>
              <ul className="text-left text-foreground/80 space-y-1 ml-4 mb-4">
                <li>• PostgreSQL está instalado y en ejecución</li>
                <li>• La variable DATABASE_URL está configurada en .env.local</li>
                <li>• La base de datos "sunat_noticias" existe</li>
                <li>• Has ejecutado las migraciones: <code className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded text-foreground">npm run db:push</code></li>
              </ul>
              <p className="text-sm text-foreground/70">
                Para más ayuda, consulta <a href="/SETUP.md" className="underline text-primary hover:text-primary/80">SETUP.md</a>
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
      </main>

      <footer className="border-t border-border bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">
                {UI_TEXT.public.subscribe}
              </h3>

              <form className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder={UI_TEXT.public.emailPlaceholder}
                    className="flex-1 rounded-lg border border-input bg-gray-50 dark:bg-gray-900 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {UI_TEXT.public.subscribeButton}
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-center text-sm text-muted-foreground">
                © 2026 SUNAT Noticias. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
