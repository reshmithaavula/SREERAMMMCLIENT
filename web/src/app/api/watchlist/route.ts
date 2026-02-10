import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function POST(req: Request) {
    try {
        const { ticker } = await req.json();
        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        const db = getDb();
        const stmt = db.prepare('INSERT OR IGNORE INTO watched_stocks (ticker) VALUES (?)');
        const info = stmt.run(ticker.toUpperCase());

        if (info.changes > 0) {
            return NextResponse.json({ success: true, message: `Added ${ticker}` });
        } else {
            return NextResponse.json({ success: false, message: 'Already exists' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
