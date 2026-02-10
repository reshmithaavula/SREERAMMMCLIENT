import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import styles from "./layout.module.css";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import TickerHeader from "@/components/TickerHeader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "StockTrack - Real-time Stock Tracking",
    template: "%s | StockTrack"
  },
  description: "Track your real-time stock portfolio, watchlist, and options with StockTrack.",
  openGraph: {
    title: "StockTrack - Real-time Stock Tracking",
    description: "Track your real-time stock portfolio, watchlist, and options with StockTrack.",
    url: '/',
    siteName: 'StockTrack',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "StockTrack",
    description: "Real-time stock tracking application",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            <div className={styles.container}>
              <Sidebar />
              <main className={styles.main}>
                <TickerHeader />
                {children}
              </main>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
