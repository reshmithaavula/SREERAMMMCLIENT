import "server-only"
import { NextResponse } from 'next/server';
import { getLiveQuotes } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tickersParam = searchParams.get('tickers');

        if (!tickersParam) {
            return NextResponse.json({ error: 'Tickers parameter is required' }, { status: 400 });
        }

        const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean);

        if (tickers.length === 0) {
            return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
        }

        const liveData = await getLiveQuotes(tickers);

        return NextResponse.json(liveData);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch live stock data' },
            { status: 500 }
        );
    }
}
