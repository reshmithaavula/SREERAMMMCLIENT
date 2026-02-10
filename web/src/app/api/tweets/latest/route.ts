import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getDb();
        const news = db.prepare(`
            SELECT id, headline, publisher, ts as time, url 
            FROM news 
            ORDER BY ts DESC 
            LIMIT 4
        `).all();

        return NextResponse.json(news);
    } catch (e) {
        return NextResponse.json([]);
    }
}
