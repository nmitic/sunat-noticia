import { EmailSignup } from './EmailSignup';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <EmailSignup />

          <div className="border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-600">
              © 2026 SUNAT Noticias. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
