import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LINKS = {
    NASDAQ: "https://www.cnbc.com/quotes/.IXIC",
    FUTURES: "https://www.cnbc.com/quotes/@ND.1",
    BTC: "https://www.cnbc.com/quotes/BTC.CM=",
    ETH: "https://www.cnbc.com/quotes/ETH.CM="
};

interface ScrapedData {
    price: string;
    change: string;
}

// Helper to extract content using Regex (No external libs needed)
function extractValue(html: string, className: string): string | null {
    const regex = new RegExp(`<span[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\/span>`, 'i');
    const match = html.match(regex);
    return match ? match[1].trim() : null;
}

async function scrapeCNBC(url: string, symbol: string): Promise<ScrapedData> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

        const price = extractValue(html, 'QuoteStrip-lastPrice');
        let changePct = extractValue(html, 'QuoteStrip-changeDown');
        if (!changePct) changePct = extractValue(html, 'QuoteStrip-changeUp');
        if (!changePct) changePct = extractValue(html, 'QuoteStrip-changeUnch');

        if (price) {
            return {
                price: price,
                change: changePct || '0.00%'
            };
        }
        return { price: 'N/A', change: '0.00%' };
    } catch (e) {
        console.error(`[Scraper] Failed to fetch ${symbol}:`, e);
        return { price: 'N/A', change: '0.00%' };
    }
}

export async function GET() {
    try {
        const [nasdaq, futures, btc, eth] = await Promise.all([
            scrapeCNBC(LINKS.NASDAQ, 'NASDAQ'),
            scrapeCNBC(LINKS.FUTURES, 'FUTURES'),
            scrapeCNBC(LINKS.BTC, 'BTC'),
            scrapeCNBC(LINKS.ETH, 'ETH')
        ]);

        return NextResponse.json({
            QQQ: nasdaq,
            SPY: futures,
            BTC: btc,
            ETH: eth
        });
    } catch (error) {
        console.error('Ticker Scraping Error:', error);
        return NextResponse.json({
            QQQ: { price: 'N/A', change: '0.00%' },
            SPY: { price: 'N/A', change: '0.00%' },
            BTC: { price: 'N/A', change: '0.00%' },
            ETH: { price: 'N/A', change: '0.00%' }
        });
    }
}
