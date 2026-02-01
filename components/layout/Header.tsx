import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold">SUNAT Noticias</div>
          </Link>
        </div>
      </div>
    </header>
  );
}
