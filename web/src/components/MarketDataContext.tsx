'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface MarketData {
    watchlist: any[];
    movers: any;
    pennyStocks: any[];
    lastUpdate: number;
}

interface MarketDataContextType {
    data: MarketData;
    refreshAll: () => Promise<void>;
    isLoading: boolean;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export function MarketDataProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [data, setData] = useState<MarketData>({
        watchlist: [],
        movers: {
            m1: { rippers: [], dippers: [] },
            m5: { rippers: [], dippers: [] },
            m30: { rippers: [], dippers: [] },
            day: { rippers: [], dippers: [] },
            common: [],
            engineStatus: { isLive: false, session: 'Closed' }
        },
        pennyStocks: [],
        lastUpdate: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    const refreshAll = useCallback(async () => {
        // Skip background fetching on login page to avoid noise and potential HTML parsing errors
        if (pathname === '/login') return;

        // Only show loading if we have no data at all
        if (data.watchlist.length === 0) setIsLoading(true);

        try {
            const [momRes, movRes] = await Promise.all([
                fetch('/api/momentum'),
                fetch('/api/movers')
            ]);

            // Safe JSON parsing: check content type and status
            const getJson = async (res: Response) => {
                const contentType = res.headers.get("content-type");
                if (res.ok && contentType && contentType.includes("application/json")) {
                    return await res.json();
                }
                return null;
            };

            const momJson = await getJson(momRes);
            const movJson = await getJson(movRes);

            if (momJson || movJson) {
                setData(prev => ({
                    ...prev,
                    watchlist: momJson?.stocks || prev.watchlist,
                    movers: movJson || prev.movers,
                    lastUpdate: (momJson || movJson) ? Date.now() : prev.lastUpdate
                }));
            }
        } catch (e) {
            console.error("Failed to refresh market data context:", e);
        } finally {
            setIsLoading(false);
        }
    }, [data.watchlist.length, pathname]);

    // Initial fetch and periodic sync
    useEffect(() => {
        refreshAll();
        const interval = setInterval(refreshAll, 10000); // Global refresh every 10s
        return () => clearInterval(interval);
    }, [refreshAll]);

    return (
        <MarketDataContext.Provider value={{ data, refreshAll, isLoading }}>
            {children}
        </MarketDataContext.Provider>
    );
}

export function useMarketData() {
    const context = useContext(MarketDataContext);
    if (context === undefined) {
        throw new Error('useMarketData must be used within a MarketDataProvider');
    }
    return context;
}
