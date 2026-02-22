import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch stats from Prisma
        let stats: any[] = [];
        try {
            const rows = await prisma.tickerStat.findMany({
                orderBy: { ticker: 'asc' }
            });
            stats = rows.map(r => ({
                ticker: r.ticker,
                dma_50: r.dma50,
                swing_avg: r.swingRange,
                beta: r.beta,
                updated_at: r.updatedAt
            }));
        } catch (e: any) {
            console.warn("TickerStat table not found or empty:", e.message);
        }

        return NextResponse.json({
            success: true,
            data: stats,
            count: stats.length,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[API Overnight] Error:', error.message);
        // Return success=false but with 200 status to prevent UI crash/ISE page
        // The UI will show "No analysis data found" which is handled
        return NextResponse.json({
            success: false,
            data: [],
            error: error.message
        }, { status: 200 });
    }
}
