import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

/**
 * Shown when a shared link points at an item that was never published, was
 * removed, or carries a mistyped id.
 */
export default function NewsNotFound() {
  return (
    <>
      <Header />

      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <FileQuestion className="size-10 text-muted-foreground" aria-hidden="true" />

        <h1 className="mt-5 text-2xl font-bold tracking-tight">Noticia no encontrada</h1>

        <p className="mt-3 text-muted-foreground">
          Es posible que esta noticia haya sido retirada o que el enlace sea incorrecto.
        </p>

        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft />
            Ver todas las noticias
          </Link>
        </Button>
      </div>

      <Footer />
    </>
  );
}
