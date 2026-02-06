import { DabogLogo } from "@/components/DabogLogo";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-400 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 pt-12 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-8">
          <div className="flex justify-center">
            <a href="http://dabog.pe/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
              <DabogLogo />
            </a>
          </div>
          <p className="text-center text-sm text-gray-600">
            © 2026 SUNAT Noticias.
            Perunio es una marca y software propiedad de <a href="http://dabog.pe/" target="_blank" rel="noopener noreferrer" className=" text-primary underline">Dabog Solutions S.A.C.</a> Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
