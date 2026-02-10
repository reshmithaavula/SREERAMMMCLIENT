import { NextResponse } from 'next/server';
import { getCSVPortfolioHoldings } from '@/lib/stock-api';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const holdings = await getCSVPortfolioHoldings();
        return NextResponse.json(holdings);
    } catch (error) {
        console.error('Error in portfolio API:', error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}
