import type { Metadata } from "next";
import "./globals.css";
import { SchedulerInitializer } from "@/components/SchedulerInitializer";


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
      <body
        className="bg-gray-50 dark:bg-gray-900 antialiased"
      >
        <SchedulerInitializer />
        {children}
      </body>
    </html>
  );
}
