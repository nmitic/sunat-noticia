import { DabogLogo } from "@/components/DabogLogo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30 print:hidden">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-6">
          <div className="flex justify-center">
            <a
              href="http://dabog.pe/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <DabogLogo />
            </a>
          </div>

          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            © 2026 SUNAT Noticias. Perunio es una marca y software propiedad de{' '}
            <a
              href="http://dabog.pe/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Dabog Solutions S.A.C.
            </a>{' '}
            Todos los derechos reservados.
          </p>

          <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/80">
            Este sitio recopila comunicados publicados por fuentes oficiales de SUNAT. No es un
            portal oficial de la SUNAT ni sustituye la información publicada en sus canales.
          </p>
        </div>
      </div>
    </footer>
  );
}
