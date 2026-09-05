import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

/**
 * Absolute base for the canonical and og:url paths that article pages emit.
 * Without it a shared link carries a bare path and no preview renders.
 *
 * NEXT_PUBLIC_SITE_URL is the explicit override; VERCEL_URL is injected per
 * deployment, so previews get their own correct base for free.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://sunat-noticias.perunio.pe";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "SUNAT Noticias",
  description: "Agregador de noticias de SUNAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
