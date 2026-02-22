import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { ticker } = await req.json();
        if (!ticker) {
            return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
        }

        const item = await prisma.watchlist.upsert({
            where: { ticker: ticker.toUpperCase() },
            update: {},
            create: { ticker: ticker.toUpperCase() }
        });

        if (item) {
            return NextResponse.json({ success: true, message: `Added ${ticker}` });
        } else {
            return NextResponse.json({ success: false, message: 'Already exists' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
