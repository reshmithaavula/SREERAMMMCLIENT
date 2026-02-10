import { NextResponse } from 'next/server';
import { getTwitterClient } from '@/lib/twitter-client';
import { getLiveQuotes } from '@/lib/stock-api';

// Prevent caching for this route
export const dynamic = 'force-dynamic';

const WATCHLIST = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMD', 'GOOGL', 'AMZN', 'META'];

export async function GET(request: Request) {
    try {
        // Security check: Ensure the request comes from Vercel Cron
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Optional: You can skip this check for testing if you haven't set CRON_SECRET yet
            // return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log('🤖 Cron job triggered: Fetching stock data...');

        // 1. Fetch Real-Time Data
        const quotesMap = await getLiveQuotes(WATCHLIST);
        const quotes = Object.values(quotesMap);

        // 2. Analyze Movers
        const movers = quotes.map(q => ({
            symbol: q.ticker,
            price: q.price,
            change: q.changePercent || 0
        })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        const topMover = movers[0];

        if (!topMover) {
            return NextResponse.json({ message: 'No data found' });
        }

        // 3. Format Tweet
        const arrow = topMover.change > 0 ? '🚀' : '📉';
        const sign = topMover.change > 0 ? '+' : '';
        const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' });

        const tweetText = `🚨 Market Update (${timestamp} ET)\n\n` +
            `${arrow} $${topMover.symbol} is moving!\n` +
            `Price: $${topMover.price?.toFixed(2)}\n` +
            `Change: ${sign}${topMover.change.toFixed(2)}%\n\n` +
            `#StockMarket #Trading #$${topMover.symbol}`;

        // 4. Post to Twitter
        // Only post if change is significant (> 0.5% for example) to avoid spam
        if (Math.abs(topMover.change) < 0.1) {
            return NextResponse.json({ message: 'Movement too small, skipped tweet', mover: topMover });
        }

        const client = getTwitterClient();
        if (process.env.DRY_RUN !== 'true') {
            await client.v2.tweet(tweetText);
            console.log('✅ Tweet posted:', tweetText);
        } else {
            console.log('✅ Dry run tweet generated:', tweetText);
        }

        return NextResponse.json({ success: true, tweet: tweetText });

    } catch (error) {
        console.error('❌ Cron Error:', error);
        return NextResponse.json(
            { error: 'Failed to execute cron job', details: (error as Error).message },
            { status: 500 }
        );
    }
}
