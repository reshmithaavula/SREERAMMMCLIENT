// @ts-ignore
import { getDb } from './db';
import { unstable_cache } from 'next/cache';
// No fallback imports - we only show real data now


const BASE_URL = 'https://api.polygon.io';

export const dynamic = 'force-dynamic';

export interface LiveQuote {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    openPrice?: number;
    prevClose?: number;
    lastUpdated?: number;
}

// Timeout wrapper for fetch calls
async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}



// Internal fetcher that does the actual work
async function fetchLiveQuotesInternal(tickers: string[]): Promise<Record<string, LiveQuote>> {
    const results: Record<string, LiveQuote> = {};
    const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

    if (!POLYGON_API_KEY) {
        console.error('POLYGON_API_KEY is not defined');
        return results;
    }

    try {
        const cryptoTickers = tickers.filter(t => t.includes('-'));
        const stockTickers = tickers.filter(t => !t.includes('-'));

        const promises = [];

        // --- FETCH CRYPTO (Parallel) ---
        if (cryptoTickers.length > 0) {
            promises.push(Promise.allSettled(cryptoTickers.map(async (t) => {
                try {
                    const [base, quote] = t.split('-');
                    const lastTradeUrl = `${BASE_URL}/v1/last/crypto/${base}/${quote}?apiKey=${POLYGON_API_KEY}`;
                    const res = await fetchWithTimeout(lastTradeUrl, 5000);

                    if (res.ok) {
                        const data = await res.json();
                        if (data.last) {
                            const price = data.last.price;

                            results[t] = {
                                ticker: t,
                                price: price,
                                change: 0,
                                changePercent: 0,
                                lastUpdated: data.last.timestamp || Date.now()
                            };
                            return;
                        }
                    }
                } catch (e) {
                    console.warn(`Timeout/Error fetching crypto ${t}, skipping`);
                }
            })));
        }

        // --- FETCH STOCKS (Parallel Batches) ---
        if (stockTickers.length > 0) {
            // Batch tickers to avoid URL length issues (max 50 per request)
            const batchSize = 50;
            const batches = [];
            for (let i = 0; i < stockTickers.length; i += batchSize) {
                batches.push(stockTickers.slice(i, i + batchSize));
            }

            promises.push(Promise.allSettled(batches.map(async (batch) => {
                try {
                    const tickerString = batch.join(',');
                    const snapshotUrl = `${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerString}&apiKey=${POLYGON_API_KEY}`;

                    const response = await fetchWithTimeout(snapshotUrl, 10000);

                    if (response.status === 403) {
                        console.warn('Polygon Snapshot API 403 (Stock). Using DB fallback.');
                        return;
                    } else if (!response.ok) {
                        console.warn(`Polygon Snapshot API failed with status: ${response.status}`);
                        return;
                    }

                    const data = await response.json();
                    if (data.tickers) {
                        data.tickers.forEach((t: any) => {
                            const price = t.lastTrade?.p || t.min?.c || t.prevDay?.c || 0;
                            const prevClose = t.prevDay?.c || 0;
                            let change = t.todaysChange || 0;
                            let changePerc = t.todaysChangePerc || 0;

                            if ((change === 0) && prevClose > 0 && price > 0) {
                                change = price - prevClose;
                                changePerc = (change / prevClose) * 100;
                            }

                            results[t.ticker] = {
                                ticker: t.ticker,
                                price: price,
                                change: change,
                                changePercent: changePerc,
                                volume: t.day?.v || 0,
                                openPrice: t.day?.o || prevClose || 0,
                                prevClose: prevClose,
                                lastUpdated: t.lastTrade?.t ? t.lastTrade.t / 1000000 : Date.now()
                            };
                        });
                    }
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.warn(`Polygon API timeout for batch, skipping`);
                    } else {
                        console.error(`Error fetching batch:`, err.message);
                    }
                }
            })));
        }

        await Promise.all(promises);

    } catch (error) {
        console.error('Error fetching quotes from Polygon:', error);
    }

    return results;
}

interface QuotesCache {
    data: Record<string, LiveQuote>;
    timestamp: number;
}
declare global {
    var quotesCache: QuotesCache | undefined;
}

export async function getLiveQuotes(tickers: string[]): Promise<Record<string, LiveQuote>> {
    const CACHE_DURATION = 1000; // 1 second
    const now = Date.now();

    // Simple cache check
    if (globalThis.quotesCache) {
        const age = now - globalThis.quotesCache.timestamp;
        const cached = globalThis.quotesCache.data;
        const allPresent = tickers.every(t => cached[t]);

        // Return cached data if fresh and complete
        if (allPresent && age < CACHE_DURATION) {
            console.log(`[Cache HIT] Returning cached data (age: ${age}ms)`);
            return cached;
        }
    }

    // Fetch fresh data
    console.log(`[Cache MISS] Fetching ${tickers.length} quotes from API`);
    const results = await fetchLiveQuotesInternal(tickers);

    // Update global cache
    globalThis.quotesCache = {
        data: { ...(globalThis.quotesCache?.data || {}), ...results },
        timestamp: now
    };

    return results;
}

export async function getLiveQuote(ticker: string): Promise<LiveQuote | null> {
    const quotes = await getLiveQuotes([ticker]);
    return quotes[ticker] || null;
}

// Ensure this matches the backend engine's types
// --- WATCHLIST CACHING ---
let cachedWatchlist: string[] = [];
let lastWatchlistRead = 0;
const WATCHLIST_CACHE_TTL = 10000; // 10 seconds

export async function getWatchlistTickers(): Promise<string[]> {
    const now = Date.now();
    if (cachedWatchlist.length > 0 && (now - lastWatchlistRead < WATCHLIST_CACHE_TTL)) {
        return cachedWatchlist;
    }

    const possiblePaths = [
        path.join(process.cwd(), '../Watchlist_New.csv'),
        path.join(process.cwd(), '../../Watchlist_New.csv'),
        path.join(process.cwd(), 'Watchlist_New.csv')
    ];

    try {
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                const fileContent = fs.readFileSync(p, 'utf-8');
                const lines = fileContent.split('\n');
                const tickers: string[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const parts = lines[i].split(',');
                    if (parts.length > 1) {
                        const t = parts[1]?.trim();
                        if (t) tickers.push(t);
                    }
                }
                if (tickers.length > 0) {
                    cachedWatchlist = tickers;
                    lastWatchlistRead = now;
                    return tickers;
                }
            }
        }
    } catch (e) {
        console.error("Error reading watchlist:", e);
    }
    return cachedWatchlist;
}

export async function getRealTimeMovers(timeframe: '1m' | '5m' | '30m' | 'day' = 'day'): Promise<{ rippers: any[], dippers: any[] }> {
    const db = getDb();
    const prefix = timeframe === 'day' ? 'day' : timeframe;
    const ripType = `${prefix}_ripper`;
    const dipType = `${prefix}_dipper`;

    const tickers = await getWatchlistTickers();
    if (tickers.length === 0) return { rippers: [], dippers: [] };

    try {
        // Optimization: Filter by tickers in SQL to reduce data transfer and processing
        const placeholders = tickers.map(() => '?').join(',');
        const query = `
            SELECT ticker, price, change, change_percent as changePercent, updated_at, common_flag, prev_close_gap 
            FROM market_movers 
            WHERE type IN (?, ?) AND ticker IN (${placeholders})
            ORDER BY ABS(change_percent) DESC
        `;

        const rows = db.prepare(query).all(ripType, dipType, ...tickers) as any[];

        const rippers = rows.filter(r => r.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 50);
        const dippers = rows.filter(r => r.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 50);

        return { rippers, dippers };
    } catch (e) {
        console.error('Error reading movers from DB:', e);
        return { rippers: [], dippers: [] };
    }
}

export async function getMarketMovers(limit: number = 5): Promise<{ gainers: LiveQuote[], losers: LiveQuote[] }> {
    const { rippers, dippers } = await getRealTimeMovers('day');
    return {
        gainers: rippers.slice(0, limit),
        losers: dippers.slice(0, limit)
    };
}

// --- PENNY STOCK LOGIC ---
export async function getPennyStocks(limit: number = 200): Promise<any[]> {
    const CACHE_DURATION = 5000; // 5 seconds
    const now = Date.now();

    if (globalThis.pennyCache && (now - globalThis.pennyCache.timestamp < CACHE_DURATION)) {
        return globalThis.pennyCache.data;
    }

    // Check Cache (using a separate cache for penny stocks if needed, or just leverage same mechanism)
    // For simplicity, we'll just fetch for now or use a dedicated global cache

    try {
        const csvPath = path.join(process.cwd(), '../Watchlist_Penny.csv');
        if (!fs.existsSync(csvPath)) {
            console.error(`Penny Watchlist CSV not found at ${csvPath}`);
            return [];
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // CSV Header: Category,Ticker,ConvictionStocks,DecidingTheMarketDirections,DollarMoves
        // Ticker is index 1
        const tickerData = lines.slice(1).map(line => {
            const parts = line.split(',');
            const category = parts[0]?.trim();
            const ticker = parts[1]?.trim();
            return { ticker, category };
        }).filter(t => t.ticker && t.ticker.length > 0);

        const uniqueTickers = Array.from(new Set(tickerData.map(d => (d.ticker || '').toUpperCase())));
        const quotes = await getLiveQuotes(uniqueTickers);

        // Fetch Momentum from DB to augment
        const db = getDb();
        const momentumMap: Record<string, any> = {};
        try {
            const tickersStr = uniqueTickers.map(t => `'${t}'`).join(',');
            const movers = db.prepare(`
                SELECT ticker, type, change_percent 
                FROM market_movers 
                WHERE ticker IN (${tickersStr})
            `).all() as any[];

            movers.forEach(m => {
                if (!momentumMap[m.ticker]) momentumMap[m.ticker] = {};
                momentumMap[m.ticker][m.type] = m.change_percent;
            });
        } catch (e) {
            console.warn("[PennyAPI] DB Momentum fetch failed (DB locked?), continuing with live quotes only");
        }

        const result = tickerData.map((data, i) => {
            const ticker = (data.ticker || '').toUpperCase();
            // Preserve existing data from cache if live quotes missing this ticker
            const cachedQuote = globalThis.quotesCache?.data?.[ticker];
            const quote = quotes[ticker] || cachedQuote || {
                ticker: ticker,
                price: 0,
                change: 0,
                changePercent: 0,
                volume: 0,
                openPrice: 0,
                prevClose: 0,
                lastUpdated: Date.now()
            };

            const momentum = momentumMap[ticker] || {};

            return {
                ...quote,
                category: data.category,
                rank: i + 1,
                momentum1m: momentum['1m_ripper'] || momentum['1m_dipper'] || 0,
                momentum5m: momentum['5m_ripper'] || momentum['5m_dipper'] || 0,
                momentum30m: momentum['30m_ripper'] || momentum['30m_dipper'] || 0,
                momentumDay: momentum['day_ripper'] || momentum['day_dipper'] || quote.changePercent || 0,
                openPrice: quote.openPrice || 0,
                prevClose: quote.prevClose || 0,
                lastUpdated: quote.lastUpdated || Date.now()
            };
        });

        globalThis.pennyCache = {
            data: result,
            timestamp: now
        };

        return result;

    } catch (error) {
        console.error('Error reading Penny Watchlist CSV:', error);
        return [];
    }
}

declare global {
    var pennyCache: { data: any[], timestamp: number } | undefined;
    var portfolioCache: { data: any[], timestamp: number } | undefined;
}

import * as fs from 'fs';
import * as path from 'path';

export async function getMomentumStocks(limit: number = 50): Promise<any[]> {
    // Legacy support or fallback if needed, but we typically redirect to getCSVWatchlistStocks
    // for the main watchlist now.
    return getCSVWatchlistStocks(limit);
}

// Cache structure
interface WatchlistCache {
    data: any[];
    timestamp: number;
}
// Add to globalThis to persist across hot reloads in dev
declare global {
    var watchlistCache: WatchlistCache | undefined;
}



export async function getCSVWatchlistStocks(limit: number = 200): Promise<any[]> {
    const CACHE_DURATION = 3000; // 3 seconds
    const now = Date.now();

    // Check Cache
    if (globalThis.watchlistCache && (now - globalThis.watchlistCache.timestamp < CACHE_DURATION)) {
        return globalThis.watchlistCache.data;
    }

    try {
        const csvPath = path.join(process.cwd(), '../Watchlist_New.csv');
        if (!fs.existsSync(csvPath)) {
            console.warn(`Watchlist CSV not found at ${csvPath}`);
            return [];
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Skip header and extract Category and Ticker
        const tickerData = lines.slice(1).map(line => {
            const parts = line.split(',');
            return {
                category: parts[0]?.trim(),
                ticker: parts[1]?.trim()
            };
        }).filter(t => t.ticker && t.ticker.length > 0);

        if (tickerData.length === 0 && !globalThis.watchlistCache) {
            // allow empty csv if we have db stocks, but for now just warn
            // console.warn('Watchlist CSV is empty');
        }

        // Add stocks from DB
        try {
            const db = getDb();
            const dbTickers = db.prepare('SELECT ticker FROM watched_stocks').all() as any[];
            dbTickers.forEach(r => {
                if (r.ticker) tickerData.push({ category: 'User Added', ticker: r.ticker });
            });
        } catch (e) { }

        const uniqueTickers = Array.from(new Set(tickerData.map(d => d.ticker)));
        const quotes = await getLiveQuotes(uniqueTickers);

        // Fetch Real Momentum from DB
        const db = getDb();
        const momentumMap: Record<string, any> = {};
        try {
            const tickersStr = uniqueTickers.map(t => `'${t}'`).join(',');
            const movers = db.prepare(`
                SELECT ticker, type, change_percent 
                FROM market_movers 
                WHERE ticker IN (${tickersStr})
            `).all() as any[];

            movers.forEach(m => {
                if (!momentumMap[m.ticker]) momentumMap[m.ticker] = {};
                momentumMap[m.ticker][m.type] = m.change_percent;
            });
        } catch (e) { }

        const result = tickerData.map((data, i) => {
            const quote = quotes[data.ticker] || {
                ticker: data.ticker,
                price: 0,
                change: 0,
                changePercent: 0,
                volume: 0,
                openPrice: 0,
                prevClose: 0,
                lastUpdated: Date.now()
            };

            const momentum = momentumMap[data.ticker] || {};

            return {
                ...quote,
                category: data.category,
                momentum1min: momentum['1m_ripper'] || momentum['1m_dipper'] || 0,
                momentum5min: momentum['5m_ripper'] || momentum['5m_dipper'] || 0,
                momentum30min: momentum['30m_ripper'] || momentum['30m_dipper'] || 0,
                momentumDay: momentum['day_ripper'] || momentum['day_dipper'] || quote.changePercent || 0,
                rank: i + 1,
                openPrice: quote.openPrice || 0,
                prevClose: quote.prevClose || 0,
                lastUpdated: quote.lastUpdated || Date.now()
            };
        });

        // Update Cache
        globalThis.watchlistCache = {
            data: result,
            timestamp: now
        };

        return result;

    } catch (error) {
        console.error('Error reading Watchlist CSV:', error);
        return [];
    }
}

export async function getCSVPortfolioHoldings(): Promise<any[]> {
    const CACHE_DURATION = 10000; // 10 seconds
    const now = Date.now();

    if (globalThis.portfolioCache && (now - globalThis.portfolioCache.timestamp < CACHE_DURATION)) {
        return globalThis.portfolioCache.data;
    }

    try {
        const csvPath = path.join(process.cwd(), '../portfolio.csv');
        if (!fs.existsSync(csvPath)) {
            console.error(`Portfolio CSV not found at ${csvPath}`);
            return [];
        }

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');

        // Header: ticker,bought_price,shares
        const holdings = lines.slice(1).map(line => {
            const parts = line.split(',');
            if (parts.length < 3) return null;

            const ticker = parts[0]?.trim();
            const priceStr = parts[1]?.trim().replace('$', '').replace(',', '');
            const sharesStr = parts[2]?.trim().replace(',', '');

            return {
                ticker,
                avgCost: parseFloat(priceStr) || 0,
                shares: parseFloat(sharesStr) || 0
            };
        }).filter(h => h && h.ticker);

        const result = holdings;
        globalThis.portfolioCache = {
            data: result,
            timestamp: now
        };

        return result;
    } catch (error) {
        console.error('Error reading Portfolio CSV:', error);
        return [];
    }
}

export async function getTopOptions(): Promise<any[]> {
    const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
    if (!POLYGON_API_KEY) return [];

    const tickers = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD'];
    const results: any[] = [];

    try {
        const quotes = await getLiveQuotes(tickers);

        for (const ticker of tickers) {
            const quote = quotes[ticker];
            if (!quote || !quote.price) continue;

            const sentiment = quote.changePercent > 1 ? 'Call' : (quote.changePercent < -1 ? 'Put' : 'Iron Condor');
            const targetStrike = sentiment === 'Call' ? Math.ceil(quote.price * 1.05) : Math.floor(quote.price * 0.95);

            results.push({
                ticker,
                strategy: sentiment,
                strike: `$${targetStrike}`,
                exp: 'Next Fri',
                iv: `${(20 + Math.abs(quote.changePercent) * 5).toFixed(1)}%`
            });
        }
    } catch (e) { console.error(e); }

    return results;
}

export async function getMarketNews(limit: number = 10): Promise<any[]> {
    // Read from DB news table
    const db = getDb();
    try {
        const rows = db.prepare(`
            SELECT id, headline, author, publisher, ts as time, url, image_url as image 
            FROM news 
            ORDER BY ts DESC 
            LIMIT ?
        `).all(limit) as any[];

        return rows.map(r => ({
            ...r,
            sentiment: 'neutral'
        }));
    } catch (e) {
        // Fallback to Polygon if DB is empty or fails
        console.error(e);
        return [];
    }
}

