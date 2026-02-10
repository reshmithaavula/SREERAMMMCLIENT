import { NextResponse } from 'next/server';
import { getMomentumStocks } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stocks = await getMomentumStocks(100);
        return NextResponse.json({
            stocks: Array.isArray(stocks) ? stocks : [],
            count: Array.isArray(stocks) ? stocks.length : 0
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ stocks: [], count: 0 });
    }
}
