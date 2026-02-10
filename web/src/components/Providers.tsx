'use client';

import { SessionProvider } from "next-auth/react";
import { MarketDataProvider } from "./MarketDataContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <MarketDataProvider>
                {children}
            </MarketDataProvider>
        </SessionProvider>
    );
}
