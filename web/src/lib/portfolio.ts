import fs from 'fs';
import path from 'path';
import { getLiveQuotes } from './stock-api';

const portfolioCsvPath = path.join(process.cwd(), 'data', 'portfolio.csv');

export interface PortfolioItem {
    ticker: string;
    boughtPrice: number;
    shares: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
    try {
        // Read portfolio CSV
        if (!fs.existsSync(portfolioCsvPath)) {
            console.warn(`Portfolio file not found at ${portfolioCsvPath}`);
            return [];
        }

        const csvContent = fs.readFileSync(portfolioCsvPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const portfolioLines = lines.slice(1); // Skip header

        const items: { ticker: string; boughtPrice: number; shares: number; }[] = [];

        for (const line of portfolioLines) {
            const [ticker, boughtPriceStr, sharesStr] = line.split(',');
            if (!ticker || !boughtPriceStr || !sharesStr) continue;

            const boughtPrice = parseFloat(boughtPriceStr.replace('$', '').trim());
            const shares = parseFloat(sharesStr.trim());
            items.push({ ticker: ticker.trim(), boughtPrice, shares });
        }

        if (items.length === 0) return [];

        // Fetch live prices for all tickers in one batch
        const tickers = items.map(i => i.ticker);
        const liveQuotes = await getLiveQuotes(tickers);

        const portfolio: PortfolioItem[] = items.map(item => {
            const quote = liveQuotes[item.ticker];
            // Use live price if available, else fallback to bought price (0 change)
            const currentPrice = quote ? quote.price : item.boughtPrice;

            const currentValue = item.shares * currentPrice;
            const profitLoss = (currentPrice - item.boughtPrice) * item.shares;
            const profitLossPercent = item.boughtPrice !== 0
                ? ((currentPrice - item.boughtPrice) / item.boughtPrice) * 100
                : 0;

            return {
                ...item,
                currentPrice,
                currentValue,
                profitLoss,
                profitLossPercent
            };
        });

        return portfolio;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        return [];
    }
}

export async function getTotalPortfolioValue(): Promise<number> {
    const portfolio = await getPortfolio();
    return portfolio.reduce((sum, item) => sum + item.currentValue, 0);
}

export async function getTotalProfitLoss(): Promise<number> {
    const portfolio = await getPortfolio();
    return portfolio.reduce((sum, item) => sum + item.profitLoss, 0);
}
