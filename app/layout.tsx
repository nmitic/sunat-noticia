import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "SUNAT Noticias",
  description: "Agregador de noticias de SUNAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
