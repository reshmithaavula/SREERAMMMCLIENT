import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Use read-write mode (false) to ensure migrations run if they hasn't yet
        // This creates the 'ticker_stats' table if missing
        const db = getDb(false);

        // Fetch stats
        let stats: any[] = [];
        try {
            stats = db.prepare(`
                SELECT 
                    ticker, 
                    dma_50, 
                    swing_avg, 
                    beta, 
                    updated_at 
                FROM ticker_stats 
                ORDER BY ticker ASC
            `).all();
        } catch (e: any) {
            console.warn("ticker_stats table not found or empty:", e.message);
            // Return empty array
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
