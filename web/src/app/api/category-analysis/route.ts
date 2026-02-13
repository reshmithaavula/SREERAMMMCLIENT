import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: "API working correctly",
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

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

export const dynamic = 'force-dynamic';

/* =========================
   API Route
========================= */
export async function GET() {
    try {
        // Return cache if valid
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                categories: cachedData.data,
                cached: true,
            });
        }

        // Find CSV
        const possiblePaths = [
            path.join(process.cwd(), '..', 'Watchlist_New.csv'),
            path.join(process.cwd(), 'Watchlist_New.csv'),
        ];

        let csvContent = '';

        for (const csvPath of possiblePaths) {
            if (fs.existsSync(csvPath)) {
                csvContent = fs
                    .readFileSync(csvPath, 'utf-8')
                    .replace(/^\uFEFF/, '')
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n');
                break;
            }
        }

        if (!csvContent) {
            throw new Error('Watchlist CSV file not found');
        }

        // Parse CSV
        const lines = csvContent.split('\n').filter(Boolean);
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

        // Analyze categories
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
