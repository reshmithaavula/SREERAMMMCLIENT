import { NextResponse } from 'next/server';
import { getPennyStocks } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stocks = await getPennyStocks(200);

        return NextResponse.json({
            stocks,
            count: stocks.length
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch penny stock data' },
            { status: 500 }
        );
    }
}
