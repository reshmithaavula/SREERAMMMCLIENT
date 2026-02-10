import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/db';

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

// Cache for category analysis - aggressive TTL for near‑real‑time data
let cachedData: { data: CategoryAnalysis[]; timestamp: number } | null = null;
// Disable cache for instant freshness
const CACHE_TTL = 0;

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Return cached data if still valid
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                timestamp: new Date(cachedData.timestamp).toISOString(),
                categories: cachedData.data,
                cached: true,
            });
        }

        // Read the CSV file - try multiple possible locations
        let csvContent = '';
        const possiblePaths = [
            path.join(process.cwd(), '..', 'Watchlist_New.csv'),
            path.join(process.cwd(), 'Watchlist_New.csv')
        ];

        for (const csvPath of possiblePaths) {
            try {
                if (fs.existsSync(csvPath)) {
                    csvContent = fs.readFileSync(csvPath, 'utf-8');
                    // Handle BOM and line endings
                    csvContent = csvContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    break;
                }
            } catch (e) {
                // Try next path
            }
        }

        if (!csvContent) {
            console.error('Watchlist CSV not found for category analysis');
            // If we have cached data (even expired), return it rather than failing
            if (cachedData) {
                return NextResponse.json({
                    success: true,
                    categories: cachedData.data,
                    cached: true,
                    stale: true
                });
            }
            throw new Error('Watchlist CSV file not found');
        }

        // Simple CSV parser
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const records: WatchlistRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 2 && values[1]) { // Ensure at least category and ticker exist
                records.push({
                    Category: values[0] || 'Uncategorized',
                    Ticker: values[1] || '',
                    ConvictionStocks: values[2] || '',
                    DecidingTheMarketDirections: values[3] || '',
                    DollarMoves: values[4] || ''
                });
            }
        }

        // Get data from database using optimized Read-Only connection
        const db = getDb(true);
        const tickerData: Record<string, any> = {};

        try {
            // Always fetch the most recent timestamp directly from the stks table – guarantees freshest data
            const latestRow = db.prepare('SELECT MAX(ts) as ts FROM stks').get() as any;
            const ts = latestRow?.ts;

            if (ts) {
                const rows = db.prepare(`
                    SELECT tckr as ticker, idv_regularMarketPrice as price, todays_change_percent as changePercent 
                    FROM stks 
                    WHERE ts = ?
                `).all(ts) as any[];

                rows.forEach(row => {
                    tickerData[row.ticker] = {
                        price: row.price || 0,
                        changePercent: row.changePercent || 0
                    };
                });
            }
        } catch (e) {
            console.error('Error fetching from stks for category analysis:', e);
        }

        // Analyze categories
        const categoryMap = new Map<string, CategoryAnalysis>();

        records.forEach((row) => {
            const category = row.Category;
            const ticker = row.Ticker;
            const data = tickerData[ticker];

            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category,
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

            const cat = categoryMap.get(category)!;
            cat.totalStocks++;

            if (data && data.price > 0) {
                cat.averageChange += (data.changePercent || 0);

                if (data.changePercent > 0.05) {
                    cat.gainers++;
                } else if (data.changePercent < -0.05) {
                    cat.losers++;
                } else {
                    cat.neutral++;
                }
            } else {
                cat.neutral++;
            }
        });

        // Calculate percentages and trends
        const analyses: CategoryAnalysis[] = [];
        categoryMap.forEach((cat) => {
            if (cat.totalStocks > 0) {
                cat.averageChange = cat.averageChange / cat.totalStocks;
                cat.gainersPercent = (cat.gainers / cat.totalStocks) * 100;
                cat.losersPercent = (cat.losers / cat.totalStocks) * 100;
                cat.neutralPercent = (cat.neutral / cat.totalStocks) * 100;
                // Determine trend - STATED RULE: Direction must match averageChange
                if (cat.averageChange > 0.005) {
                    cat.trend = 'up';
                } else if (cat.averageChange < -0.005) {
                    cat.trend = 'down';
                } else {
                    // Only use headcount as a tie-breaker if average is basically flat
                    if (cat.gainers > cat.losers) cat.trend = 'up';
                    else if (cat.losers > cat.gainers) cat.trend = 'down';
                    else cat.trend = 'neutral';
                }
                cat.strength = Math.abs(cat.averageChange);
                analyses.push(cat);
            }
        });

        // Sort by average change (most positive first) for ranking
        analyses.sort((a, b) => b.averageChange - a.averageChange);

        // Update cache
        cachedData = {
            data: analyses,
            timestamp: Date.now(),
        };

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            categories: analyses,
            cached: false,
        });

    } catch (error) {
        console.error('Category analysis error:', error);

        // Return cached data if available on error
        if (cachedData) {
            return NextResponse.json({
                success: true,
                categories: cachedData.data,
                cached: true,
                error: 'Using cached data due to error'
            });
        }

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
