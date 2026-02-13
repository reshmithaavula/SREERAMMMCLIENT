import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/* =========================
   Types
========================= */
interface WatchlistRow {
    Category: string;
    Ticker: string;
    ConvictionStocks: string;
    DecidingTheMarketDirections: string;
    DollarMoves: string;
}

interface CategoryAnalysis {
    category: string;
    totalStocks: number;
    gainers: number;
    losers: number;
    neutral: number;
    gainersPercent: number;
    losersPercent: number;
    neutralPercent: number;
    trend: 'up' | 'down' | 'neutral';
    strength: number;
    averageChange: number;
}

/* =========================
   Cache
========================= */
let cachedData: { data: CategoryAnalysis[]; timestamp: number } | null = null;
const CACHE_TTL = 0;

/* =========================
   API Route
========================= */
export async function GET(request: Request) {   // ✅ changed (added request)

    try {
        // Return cache if valid
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                categories: cachedData.data,
                cached: true,
            });
        }

        // ✅ MINIMUM FIX: use request.url instead of process.env
        const response = await fetch(
            new URL('/Watchlist_New.csv', request.url)
        );

        if (!response.ok) {
            throw new Error('Failed to fetch Watchlist_New.csv');
        }

        const csvContent = await response.text();

        // Parse CSV (unchanged logic)
        const lines = csvContent
            .replace(/^\uFEFF/, '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .filter(Boolean);

        const records: WatchlistRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            records.push({
                Category: values[0] || 'Uncategorized',
                Ticker: values[1] || '',
                ConvictionStocks: values[2] || '',
                DecidingTheMarketDirections: values[3] || '',
                DollarMoves: values[4] || '',
            });
        }

        // Analyze categories (unchanged)
        const categoryMap = new Map<string, CategoryAnalysis>();

        records.forEach(row => {
            if (!categoryMap.has(row.Category)) {
                categoryMap.set(row.Category, {
                    category: row.Category,
                    totalStocks: 0,
                    gainers: 0,
                    losers: 0,
                    neutral: 0,
                    gainersPercent: 0,
                    losersPercent: 0,
                    neutralPercent: 0,
                    trend: 'neutral',
                    strength: 0,
                    averageChange: 0,
                });
            }

            const cat = categoryMap.get(row.Category)!;
            cat.totalStocks++;
            cat.neutral++;
        });

        const analyses = Array.from(categoryMap.values());

        cachedData = {
            data: analyses,
            timestamp: Date.now(),
        };

        return NextResponse.json({
            success: true,
            categories: analyses,
            cached: false,
        });

    } catch (error) {
        console.error('Category analysis error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to analyze categories',
                categories: [],
            },
            { status: 500 }
        );
    }
}
