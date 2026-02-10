import { NextResponse } from 'next/server';
import { getMarketMovers, getLiveQuotes } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

import { getWatchlistTickers } from '@/lib/stock-api';

export async function GET() {
    try {
        // Fetch movers (Gainers/Losers)
        const { gainers, losers } = await getMarketMovers(5);

        // Dynamically fetch watchlist tickers from CSV
        const tickers = await getWatchlistTickers();
        const watchlistMap = await getLiveQuotes(tickers);
        const watchlist = Object.values(watchlistMap);

        return NextResponse.json({
            gainers,
            losers,
            watchlist
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
