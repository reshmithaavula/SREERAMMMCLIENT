import { getPennyStocks, getCSVWatchlistStocks } from '@/lib/stock-api';

export async function generateTwitterPost(): Promise<string> {
    try {
        // Fetch live data from both watchlists
        const [pennyStocks, watchlistStocks] = await Promise.all([
            getPennyStocks(100),
            getCSVWatchlistStocks(100)
        ]);

        const allStocks = [...pennyStocks, ...watchlistStocks];

        // Filter out stocks with no price data
        const validStocks = allStocks.filter(s => s.price > 0);

        // Sort for Gainers and Losers
        const topGainers = [...validStocks]
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 5);

        const topLosers = [...validStocks]
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 5);

        let tweet = `📊 Market Movers Alert 🚀\n\n`;

        // Top Gainers
        if (topGainers.length > 0) {
            tweet += `📈 TOP GAINERS:\n`;
            topGainers.forEach((stock, i) => {
                tweet += `${i + 1}. $${stock.ticker}: +${stock.changePercent.toFixed(2)}% ($${stock.price.toFixed(2)})\n`;
            });
            tweet += `\n`;
        }

        // Top Losers
        if (topLosers.length > 0) {
            tweet += `📉 TOP LOSERS:\n`;
            topLosers.forEach((stock, i) => {
                tweet += `${i + 1}. $${stock.ticker}: ${stock.changePercent.toFixed(2)}% ($${stock.price.toFixed(2)})\n`;
            });
            tweet += `\n`;
        }

        if (validStocks.length === 0) {
            tweet += `No significant market movement detected at the moment.\n\n`;
        }

        tweet += `⏰ Updated: ${new Date().toLocaleTimeString()}\n`;
        tweet += `\n#StockMarket #Trading #Stocks #DayTrading`;

        return tweet;
    } catch (error) {
        console.error('Error generating tweet:', error);
        return `📊 Market Update 🚀\n\nUnable to fetch live data at this moment.\n\n⏰ ${new Date().toLocaleTimeString()}\n\n#StockMarket #Stocks`;
    }
}

export async function generateTwitterPostCompact(): Promise<string> {
    const stocks = await getCSVWatchlistStocks(10);
    const top = stocks.length > 0 ? stocks[0] : null;

    let tweet = `🔥 MARKET RADAR:\n\n`;

    if (top) {
        const arrow = top.changePercent > 0 ? '🚀' : '📉';
        tweet += `${arrow} $${top.ticker} is leading the board at ${top.changePercent > 0 ? '+' : ''}${top.changePercent.toFixed(2)}%!\n`;
    }

    tweet += `\n⚡ Real-time momentum tracking enabled.\n`;
    tweet += `#StockMarket #DayTrading`;

    return tweet;
}
