// Fallback data for when API is loading or unavailable
// This provides instant UI feedback instead of loading states
// RUTHLESS PURITY: ONLY tickers from Watchlist_New.csv are allowed here.

export const FALLBACK_MOVERS = {
    rippers: [
        { ticker: 'NVDA', price: 495.32, change: 12.45, changePercent: 2.58 },
        { ticker: 'TSLA', price: 248.67, change: 8.92, changePercent: 3.72 },
        { ticker: 'AMD', price: 142.18, change: 5.34, changePercent: 3.90 },
        { ticker: 'AAPL', price: 178.45, change: 3.21, changePercent: 1.83 },
        { ticker: 'MSFT', price: 412.89, change: 7.65, changePercent: 1.89 },
        { ticker: 'GOOG', price: 138.92, change: 2.87, changePercent: 2.11 },
    ],
    dippers: [
        { ticker: 'META', price: 485.23, change: -8.45, changePercent: -1.71 },
        { ticker: 'AMZN', price: 168.92, change: -3.45, changePercent: -2.00 },
        { ticker: 'NFLX', price: 612.34, change: -12.67, changePercent: -2.03 },
        { ticker: 'DIS', price: 92.45, change: -1.89, changePercent: -2.00 },
        // Replaced invalid tickers with valid ones from watchlist to maintain purity
        { ticker: 'ARM', price: 120.34, change: -2.23, changePercent: -2.07 },
        { ticker: 'MU', price: 82.18, change: -1.56, changePercent: -2.12 },
    ]
};

export const FALLBACK_NEWS = [
    {
        id: '1',
        headline: 'Tech Stocks Rally on Strong Earnings Reports',
        author: 'Market Analyst',
        publisher: 'MarketWatch / Twitter',
        time: '2024-03-20T10:00:00.000Z',
        url: '#',
        tickers: ['NVDA', 'TSLA', 'AMD']
    },
    {
        id: '2',
        headline: 'Federal Reserve Signals Rate Stability',
        author: 'Economics Desk',
        publisher: 'Financial Times',
        time: '2024-03-20T09:00:00.000Z',
        url: '#',
        tickers: ['GOOG', 'MSFT']
    },
    {
        id: '3',
        headline: 'AI Sector Sees Continued Growth',
        author: 'Tech Reporter',
        publisher: 'Tech Insider',
        time: '2024-03-20T08:00:00.000Z',
        url: '#',
        tickers: ['NVDA', 'GOOG', 'MSFT']
    },
    {
        id: '4',
        headline: 'Energy Sector Volatility Continues',
        author: 'Commodities Team',
        publisher: 'Bloomberg',
        time: '2024-03-20T07:00:00.000Z',
        url: '#',
        tickers: ['AMD', 'ARM']
    },
    {
        id: '5',
        headline: 'Retail Sales Beat Expectations',
        author: 'Business News',
        publisher: 'CNBC',
        time: '2024-03-20T06:00:00.000Z',
        url: '#',
        tickers: ['AMZN', 'AAPL']
    }
];

export const FALLBACK_WATCHLIST = [
    {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        category: 'BigTech_MagnificentSeven',
        price: 178.45,
        openPrice: 175.20,
        change: 3.21,
        changePercent: 1.83,
        momentum1min: 0.15,
        momentum5min: 0.45,
        momentum30min: 1.25,
        volume: 52341234,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'MSFT',
        name: 'Microsoft Corporation',
        category: 'BigTech_MagnificentSeven',
        price: 412.89,
        openPrice: 405.50,
        change: 7.65,
        changePercent: 1.89,
        momentum1min: 0.22,
        momentum5min: 0.78,
        momentum30min: 1.45,
        volume: 28934567,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'NVDA',
        name: 'NVIDIA Corporation',
        category: 'BigTech_MagnificentSeven',
        price: 495.32,
        openPrice: 483.20,
        change: 12.45,
        changePercent: 2.58,
        momentum1min: 0.45,
        momentum5min: 1.20,
        momentum30min: 2.15,
        volume: 45678901,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        category: 'BigTech_MagnificentSeven',
        price: 248.67,
        openPrice: 240.10,
        change: 8.92,
        changePercent: 3.72,
        momentum1min: 0.65,
        momentum5min: 1.85,
        momentum30min: 3.20,
        volume: 98765432,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'GOOG',
        name: 'Alphabet Inc.',
        category: 'BigTech_MagnificentSeven',
        price: 138.92,
        openPrice: 136.10,
        change: 2.87,
        changePercent: 2.11,
        momentum1min: 0.18,
        momentum5min: 0.92,
        momentum30min: 1.75,
        volume: 23456789,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'META',
        name: 'Meta Platforms',
        category: 'BigTech_MagnificentSeven',
        price: 485.23,
        openPrice: 493.50,
        change: -8.45,
        changePercent: -1.71,
        momentum1min: -0.25,
        momentum5min: -0.85,
        momentum30min: -1.45,
        volume: 18765432,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'AMZN',
        name: 'Amazon.com Inc.',
        category: 'BigTech_MagnificentSeven',
        price: 168.92,
        openPrice: 172.50,
        change: -3.45,
        changePercent: -2.00,
        momentum1min: -0.35,
        momentum5min: -1.10,
        momentum30min: -1.85,
        volume: 34567890,
        lastUpdated: 1710928800000
    },
    {
        ticker: 'AMD',
        name: 'Advanced Micro Devices',
        category: 'SemiconductorsandChipmakers',
        price: 142.18,
        openPrice: 137.00,
        change: 5.34,
        changePercent: 3.90,
        momentum1min: 0.55,
        momentum5min: 1.65,
        momentum30min: 3.25,
        volume: 56789012,
        lastUpdated: 1710928800000
    },
];

export const FALLBACK_QUOTES: Record<string, any> = {
    'AAPL': { price: 178.45, change: 3.21, changePercent: 1.83, volume: 52341234 },
    'MSFT': { price: 412.89, change: 7.65, changePercent: 1.89, volume: 28934567 },
    'NVDA': { price: 495.32, change: 12.45, changePercent: 2.58, volume: 45678901 },
    'TSLA': { price: 248.67, change: 8.92, changePercent: 3.72, volume: 98765432 },
    'GOOG': { price: 138.92, change: 2.87, changePercent: 2.11, volume: 23456789 },
    'META': { price: 485.23, change: -8.45, changePercent: -1.71, volume: 18765432 },
    'AMZN': { price: 168.92, change: -3.45, changePercent: -2.00, volume: 34567890 },
};

export const FALLBACK_MOVER_DATA = {
    m1: {
        rippers: FALLBACK_MOVERS.rippers.slice(0, 6),
        dippers: FALLBACK_MOVERS.dippers.slice(0, 6)
    },
    m5: {
        rippers: FALLBACK_MOVERS.rippers.slice(0, 6),
        dippers: FALLBACK_MOVERS.dippers.slice(0, 6)
    },
    m30: {
        rippers: FALLBACK_MOVERS.rippers.slice(0, 6),
        dippers: FALLBACK_MOVERS.dippers.slice(0, 6)
    },
    day: {
        rippers: FALLBACK_MOVERS.rippers.slice(0, 6),
        dippers: FALLBACK_MOVERS.dippers.slice(0, 6)
    },
    news: FALLBACK_NEWS,
    quotes: FALLBACK_QUOTES,
    watchlist: FALLBACK_WATCHLIST
};
