import { NextResponse } from 'next/server';
import { getPennyStocks, LiveQuote } from '@/lib/stock-api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch the main penny stocks list
        const stocks = await getPennyStocks(200);
        const pennyTickers = stocks.map(s => s.ticker);
        const tickerSet = new Set(pennyTickers);

        // 2. Fetch movers for these specific tickers from Prisma
        let moversRows: any[] = [];
        try {
            moversRows = await prisma.marketMover.findMany({
                where: {
                    ticker: { in: pennyTickers }
                }
            });
        } catch (e: any) {
            console.error("[API Penny] Failed to fetch market_movers from Prisma:", e.message);
        }

        // 3. Map into categories but ONLY for penny stocks
        const m1 = { rippers: [] as any[], dippers: [] as any[] };
        const m5 = { rippers: [] as any[], dippers: [] as any[] };
        const m30 = { rippers: [] as any[], dippers: [] as any[] };
        const day = { rippers: [] as any[], dippers: [] as any[] };

        moversRows.forEach(row => {
            if (!tickerSet.has(row.ticker)) return;

            const changePct = row.changePercent || 0;
            const price = row.price || 0;
            const change = row.change || 0;

            const item = {
                ticker: row.ticker,
                price: price,
                change: change,
                changePercent: changePct,
            };

            if (row.type === '1m_ripper') m1.rippers.push(item);
            else if (row.type === '1m_dipper') m1.dippers.push(item);
            else if (row.type === '5m_ripper') m5.rippers.push(item);
            else if (row.type === '5m_dipper') m5.dippers.push(item);
            else if (row.type === '30m_ripper') m30.rippers.push(item);
            else if (row.type === '30m_dipper') m30.dippers.push(item);
            else if (row.type === 'day_ripper') day.rippers.push(item);
            else if (row.type === 'day_dipper') day.dippers.push(item);
        });

        const sortByChange = (arr: any[], desc: boolean) =>
            [...arr].sort((a, b) => {
                const valA = a.changePercent || 0;
                const valB = b.changePercent || 0;
                return desc ? (valB - valA) : (valA - valB);
            });

        // 4. Get engine status (simulated using updatedAt from movers since 'stks' might be separate)
        let engineStatus = { isLive: false, statusText: 'Offline', statusColor: 'red', lastUpdate: new Date().toISOString() };
        try {
            const latestMover = await prisma.marketMover.findFirst({
                orderBy: { updatedAt: 'desc' }
            });
            if (latestMover?.updatedAt) {
                const latency = Date.now() - latestMover.updatedAt.getTime();
                engineStatus = {
                    isLive: latency < 120000,
                    statusText: latency < 60000 ? 'Live' : (latency < 120000 ? 'Delayed' : 'Offline'),
                    statusColor: latency < 60000 ? 'green' : (latency < 120000 ? 'orange' : 'red'),
                    lastUpdate: latestMover.updatedAt.toISOString()
                };
            }
        } catch (e) { }

        return NextResponse.json({
            stocks,
            m1: { rippers: sortByChange(m1.rippers, true), dippers: sortByChange(m1.dippers, false) },
            m5: { rippers: sortByChange(m5.rippers, true), dippers: sortByChange(m5.dippers, false) },
            m30: { rippers: sortByChange(m30.rippers, true), dippers: sortByChange(m30.dippers, false) },
            day: { rippers: sortByChange(day.rippers, true), dippers: sortByChange(day.dippers, false) },
            engineStatus
        });
    } catch (error) {
        console.error('API Error (Penny Stocks):', error);
        return NextResponse.json({ error: 'Failed to fetch penny stocks' }, { status: 500 });
    }
}
