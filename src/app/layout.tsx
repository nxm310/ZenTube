import type { Metadata } from "next";
import "./globals.css";
import React, { Suspense } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "ZenTube - SmartFeed & One-Shot Sandbox",
  description: "Expérience YouTube épurée, flux personnalisé par piliers thématiques et recherches isolées sans pollution d'algorithme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <SessionProvider>
          <Suspense fallback={<div className="h-16 border-b border-zinc-800/80 bg-zinc-950/80" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
            <p>ZenTube / SmartFeed • Conçu pour une consommation vidéo intentionnelle & respectueuse de votre attention.</p>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}

