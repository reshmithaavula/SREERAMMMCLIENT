import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const portfolioTickers = searchParams.get('portfolio')?.split(',') || [];
    const portfolioSet = new Set(portfolioTickers.map(t => t.toUpperCase()));

    try {
        // 0. LOAD THE MASTER WATCHLIST (RUTHLESS FILTERING) - OPTIMIZED CACHING
        const csvPath = path.join(process.cwd(), '../Watchlist_New.csv');

        // Cache mechanism
        const CACHE_TTL = 60000; // 60 seconds
        const getGlobalCache = () => (global as any).watchlistCache;
        const setGlobalCache = (val: any) => { (global as any).watchlistCache = val; };

        if (!getGlobalCache() || (Date.now() - getGlobalCache().timestamp > CACHE_TTL)) {
            try {
                if (fs.existsSync(csvPath)) {
                    // Check file stats to avoid unnecessary reads
                    const stats = fs.statSync(csvPath);
                    if (!getGlobalCache() || stats.mtimeMs !== getGlobalCache().fileMtime) {
                        const content = fs.readFileSync(csvPath, 'utf-8');
                        const lines = content.split('\n');
                        const newSet = new Set<string>();
                        for (let i = 1; i < lines.length; i++) {
                            const parts = lines[i].split(',');
                            if (parts.length > 1) {
                                const t = parts[1]?.trim().toUpperCase();
                                if (t) newSet.add(t);
                            }
                        }

                        // Also include symbols specifically being tracked in the DB
                        try {
                            const dbTemp = getDb(true);
                            const dbRows = dbTemp.prepare('SELECT ticker FROM watched_stocks').all() as any[];
                            dbRows.forEach((r: any) => { if (r.ticker) newSet.add(r.ticker.toUpperCase()); });
                        } catch (e) {
                            // Table might not exist yet, ignore
                        }

                        setGlobalCache({
                            set: newSet,
                            timestamp: Date.now(),
                            fileMtime: stats.mtimeMs
                        });
                        console.log(`[API Movers] Refreshed Watchlist Cache: ${newSet.size} tickers`);
                    }
                }
            } catch (e) {
                console.error("[API Movers] Error reading Watchlist_New.csv:", e);
            }
        }

        const allowedTickersSet = getGlobalCache()?.set || new Set<string>();

        // IMPORTANT: Open in Read-Only mode to prevent locking issues with MainTack.py
        const db = getDb(true);

        // 1. Helper to handle SQLite timestamps with many decimal places
        const cleanTs = (ts: any): string | null => {
            if (typeof ts !== 'string') return null;
            // Clean e.g. .822288Z -> .822Z for JS Date compatibility
            return ts.replace(/(\.\d{3})\d+/, '$1');
        };

        // 2. Get the most recent snapshot timestamp
        let latestTs: string | null = null;
        try {
            const latestTsRow = db.prepare('SELECT MAX(ts) as ts FROM stks').get() as any;
            latestTs = latestTsRow?.ts || null;
        } catch (e: any) {
            console.error("[API Movers] Failed to get latest timestamp:", e.message);
        }

        const cleanedLatestTs = cleanTs(latestTs);

        // 3. Fetch primary data
        let watchlist: any[] = [];
        let quotesObj: Record<string, any> = {};
        let filteredStks: any[] = [];

        if (latestTs) {
            try {
                console.time('fetchStks');
                // Fetch everything from the last 30 seconds to handle staggered updates
                // This is much safer than ts = latestTs
                const safetyWindow = 30 * 1000;
                const latestDate = new Date(latestTs);
                const cutoffDate = new Date(latestDate.getTime() - safetyWindow);
                const cutoffTs = cutoffDate.toISOString();

                const stksData = db.prepare(`
                    SELECT 
                        tckr as ticker, 
                        idv_regularMarketPrice as price, 
                        todays_change as change, 
                        todays_change_percent as changePercent,
                        idv_dayOpen as openPrice,
                        idv_prevdayClose as prevClose,
                        csession as session,
                        ts as lastUpdated
                    FROM stks 
                    WHERE ts >= ?
                    ORDER BY ts DESC
                `).all(cutoffTs) as any[];
                console.timeEnd('fetchStks');

                // OPTIMIZED: Filter tickers FIRST before building huge objects
                // Include both Watchlist AND Portfolio tickers
                filteredStks = stksData.filter(item =>
                    allowedTickersSet.has(item.ticker.toUpperCase()) ||
                    portfolioSet.has(item.ticker.toUpperCase())
                );

                watchlist = filteredStks.filter(s => allowedTickersSet.has(s.ticker.toUpperCase()));

                filteredStks.forEach(s => {
                    const tckr = s.ticker.toUpperCase();
                    if (quotesObj[tckr]) return; // Keep the newest one due to ORDER BY ts DESC

                    const tsStr = cleanTs(s.lastUpdated);
                    quotesObj[tckr] = {
                        ...s,
                        price: s.price || 0,
                        change: s.change || 0,
                        changePercent: s.changePercent || 0,
                        lastUpdated: tsStr ? new Date(tsStr).getTime() : Date.now()
                    };
                });
            } catch (e: any) {
                console.error("[API Movers] Failed to fetch watchlist/stks:", e.message);
            }
        }

        // 4. Fetch Momentum Movers
        let moversRows: any[] = [];
        try {
            moversRows = db.prepare('SELECT * FROM market_movers').all() as any[];
        } catch (e: any) {
            console.error("[API Movers] Failed to fetch market_movers:", e.message);
        }

        // 5. Map movers into categories
        const m1 = { rippers: [] as any[], dippers: [] as any[] };
        const m5 = { rippers: [] as any[], dippers: [] as any[] };
        const m30 = { rippers: [] as any[], dippers: [] as any[] };
        const day = { rippers: [] as any[], dippers: [] as any[] };

        moversRows.forEach(row => {
            // RUTHLESS FILTERING: Skip if not in the allowed watchlist
            if (!allowedTickersSet.has(row.ticker.toUpperCase())) {
                return;
            }

            // RUTHLESS FRESHNESS: Use latest quote if available
            const tickerKey = row.ticker.toUpperCase();
            const quote = quotesObj[tickerKey];
            const price = quote?.price || row.price || 0;
            const change = quote?.change || row.change || 0;
            const changePct = quote?.changePercent || row.change_percent || 0;

            const item = {
                ticker: row.ticker,
                price: price,
                change: change,
                changePercent: changePct,
                openPrice: quote?.openPrice || (price - change),
                common_flag: row.common_flag,
                prev_close_gap: row.prev_close_gap
            };

            // RUTHLESS ACCURACY: Filter based on ACTUAL current percentage
            if (row.type === '1m_ripper' && changePct > 0) m1.rippers.push(item);
            else if (row.type === '1m_dipper' && changePct < 0) m1.dippers.push(item);
            else if (row.type === '5m_ripper' && changePct > 0) m5.rippers.push(item);
            else if (row.type === '5m_dipper' && changePct < 0) m5.dippers.push(item);
            else if (row.type === '30m_ripper' && changePct > 0) m30.rippers.push(item);
            else if (row.type === '30m_dipper' && changePct < 0) m30.dippers.push(item);
            else if (row.type === 'day_ripper' && changePct > 0) day.rippers.push(item);
            else if (row.type === 'day_dipper' && changePct < 0) day.dippers.push(item);
        });

        // 6. Engine Status Logic
        let latencyMs = 0;
        if (cleanedLatestTs) {
            const parsedDate = new Date(cleanedLatestTs).getTime();
            if (!isNaN(parsedDate)) {
                latencyMs = Date.now() - parsedDate;
            }
        }

        let statusText = 'Optimal (Live)';
        let statusColor = 'green';
        let isLive = true;

        if (latencyMs > 60000) { // > 1 min
            statusText = latestTs ? 'Engine Delayed' : 'Engine Offline';
            statusColor = 'orange';
            isLive = false;
        }
        if (latencyMs > 120000) { // > 2 mins
            statusText = 'Engine Offline';
            statusColor = 'red';
            isLive = false;
        }

        // 7. News
        let newsRows: any[] = [];
        try {
            newsRows = db.prepare('SELECT * FROM news ORDER BY ts DESC LIMIT 15').all() as any[];
        } catch (e: any) {
            console.error("[API Movers] Failed to fetch news:", e.message);
        }

        // 7.5 Institutional Stats (DMAs, Beta, etc.)
        let institutionalStats: Record<string, any> = {};
        try {
            const statsRows = db.prepare('SELECT * FROM ticker_stats').all() as any[];
            statsRows.forEach(row => {
                institutionalStats[row.ticker] = {
                    dma50: row.dma_50,
                    dma200: row.dma_200,
                    beta: row.beta,
                    swingRange: row.swing_range,
                    updatedAt: row.updated_at
                };
            });
        } catch (e) {
            // Table might not exist yet
        }

        // 8. Bot Stats
        let botStats = { tweetCount: 0, lastTweet: null, status: 'Offline', lastLog: '' };
        try {
            const statusPath = path.resolve(process.cwd(), 'data/bot-status.json');
            if (fs.existsSync(statusPath)) {
                const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
                botStats = {
                    tweetCount: statusData.tweetCount || 0,
                    lastTweet: statusData.lastUpdate || null,
                    status: statusData.status || 'Active',
                    lastLog: statusData.lastLog || ''
                };
            }
        } catch (e) {
            console.error("[API Movers] Failed to read bot status:", e);
        }

        // Final sort helper with STRICT FILTERING
        const processAndSort = (arr: any[], desc: boolean) =>
            arr
                .sort((a, b) => {
                    // Prioritize Common Movers
                    if ((a.common_flag || 0) !== (b.common_flag || 0)) {
                        return (b.common_flag || 0) - (a.common_flag || 0);
                    }
                    const valA = a.changePercent || 0;
                    const valB = b.changePercent || 0;
                    return desc ? (valB - valA) : (valA - valB);
                });

        // RUTHLESS CONVERGENCE: If a ticker appears in 2+ timeframes, it MUST be in the common list.
        const tickerOccurrenceMap = new Map<string, Set<string>>();
        const allMoverLists = [
            { list: m1.rippers, name: '1m_ripper' },
            { list: m1.dippers, name: '1m_dipper' },
            { list: m5.rippers, name: '5m_ripper' },
            { list: m5.dippers, name: '5m_dipper' },
            { list: m30.rippers, name: '30m_ripper' },
            { list: m30.dippers, name: '30m_dipper' },
            { list: day.rippers, name: 'day_ripper' },
            { list: day.dippers, name: 'day_dipper' }
        ];

        allMoverLists.forEach(({ list, name }) => {
            list.forEach(m => {
                if (!tickerOccurrenceMap.has(m.ticker)) {
                    tickerOccurrenceMap.set(m.ticker, new Set());
                }
                tickerOccurrenceMap.get(m.ticker)!.add(name.split('_')[0]); // e.g. '1m', '5m', 'day'
            });
        });

        // Identify common tickers (2+ unique timeframes)
        const commonTickers = new Set<string>();
        tickerOccurrenceMap.forEach((timeframes, ticker) => {
            if (timeframes.size >= 2) {
                commonTickers.add(ticker);
            }
        });

        // Update common_flag for all items based on this real-time check
        [m1, m5, m30, day].forEach(group => {
            [group.rippers, group.dippers].forEach(list => {
                list.forEach(m => {
                    if (commonTickers.has(m.ticker)) {
                        m.common_flag = 1;
                    }
                });
            });
        });

        const responseData = {
            m1: { rippers: processAndSort(m1.rippers, true), dippers: processAndSort(m1.dippers, false) },
            m5: { rippers: processAndSort(m5.rippers, true), dippers: processAndSort(m5.dippers, false) },
            m30: { rippers: processAndSort(m30.rippers, true), dippers: processAndSort(m30.dippers, false) },
            day: { rippers: processAndSort(day.rippers, true), dippers: processAndSort(day.dippers, false) },

            // Common Movers (Multi-Timeframe Convergence)
            common: Array.from(tickerOccurrenceMap.entries())
                .filter(([_, timeframes]) => timeframes.size >= 2)
                .map(([ticker, timeframes]) => {
                    // Find the best available data for this ticker
                    const quote = quotesObj[ticker];
                    const moverRow = moversRows.find(r => r.ticker === ticker);
                    return {
                        ticker,
                        price: quote?.price || moverRow?.price || 0,
                        change: quote?.change || moverRow?.change || 0,
                        changePercent: quote?.changePercent || moverRow?.change_percent || 0,
                        common_flag: 1,
                        timeframes: Array.from(timeframes) // e.g. ["1m", "5m"]
                    };
                })
                .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),

            watchlist: watchlist,
            quotes: quotesObj,
            news: newsRows.map(n => ({
                id: n.id,
                headline: n.headline || n.title || 'No Headline',
                publisher: n.publisher || 'Unknown',
                time: n.ts,
                url: n.url,
                image: n.image_url
            })),
            movers: moversRows.map(m => ({
                ticker: m.ticker,
                price: m.price || 0,
                change_percent: m.change_percent || 0,
                session: m.session || 'Regular',
                type: m.type,
                common_flag: m.common_flag || 0
            })),

            // DEDICATED MARKET SESSION LISTS
            sessions: {
                preMarket: processAndSort(
                    moversRows.filter(m => m.session === 'Pre-Market').map(m => quotesObj[m.ticker] || { ticker: m.ticker }),
                    true
                ),
                regular: processAndSort(
                    moversRows.filter(m => m.session === 'Regular').map(m => quotesObj[m.ticker] || { ticker: m.ticker }),
                    true
                ),
                postMarket: processAndSort(
                    moversRows.filter(m => m.session === 'Post-Market').map(m => quotesObj[m.ticker] || { ticker: m.ticker }),
                    true
                ),
            },

            engineStatus: {
                lastUpdate: cleanedLatestTs || new Date().toISOString(),
                isLive,
                statusText,
                statusColor,
                latencyMs: isNaN(latencyMs) ? 0 : latencyMs,
                session: (watchlist && watchlist.length > 0) ? watchlist[0].session : 'Closed'
            },
            botStats: {
                tweetCount: botStats.tweetCount,
                lastTweet: botStats.lastTweet,
                status: botStats.status,
                lastLog: botStats.lastLog,
                isActive: true
            },
            institutionalStats: institutionalStats,
            debug: {
                allowedTickersCount: allowedTickersSet.size,
                stksRawCount: filteredStks?.length || 0,
                moversRawCount: moversRows?.length || 0,
                timestamp: new Date().toISOString(),
                latestTsFound: latestTs
            }

        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[API Movers] TOP LEVEL CRASH:', error.message);
        return NextResponse.json({
            error: 'Fatal API error',
            message: error.message
        }, { status: 500 });
    }
}
