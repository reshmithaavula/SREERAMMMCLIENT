import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const db = getDb(true); // Open as Read-Only
        const latestTsRow = db.prepare('SELECT MAX(ts) as ts FROM stks').get() as any;
        const latestTs = latestTsRow?.ts || null;

        return NextResponse.json({
            status: 'success',
            latestTs: latestTs,
            time: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[API Test DB] Error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
