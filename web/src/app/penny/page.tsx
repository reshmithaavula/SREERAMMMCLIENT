'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PennyStocksPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const response = await fetch('/api/penny');
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            const stocks = result.stocks || [];
            setData(stocks);
            localStorage.setItem('pennyWatchlistData', JSON.stringify(stocks));
        } catch (err: any) {
            console.error('Error fetching penny stocks:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = localStorage.getItem('pennyWatchlistData');
        if (cached) {
            try {
                setData(JSON.parse(cached));
                setLoading(false);
            } catch (e) { console.error(e); }
        }
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const showSpinner = loading && data.length === 0;

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        ← Home
                    </Link>
                    <h1 className="text-2xl font-bold">Penny Stocks Watchlist</h1>
                </div>
                <button
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 flex items-center gap-2"
                >
                    {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                    Refresh
                </button>
            </header>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400">
                    Error: {error}
                </div>
            )}

            <div className="overflow-x-auto bg-[#0a0a0a] rounded-xl border border-gray-800 relative min-h-[200px]">
                {showSpinner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 text-sm">Loading data...</span>
                        </div>
                    </div>
                )}
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1a1d2d] text-gray-400 uppercase font-mono">
                        <tr>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Ticker</th>
                            <th className="px-6 py-4">Last Price</th>
                            <th className="px-6 py-4 text-right">oChange %</th>
                            <th className="px-6 py-4 text-right">Change %</th>
                            <th className="px-6 py-4 text-right">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {data.map((stock, i) => {
                            const price = stock.price || 0;
                            const open = stock.openPrice || 0;

                            // oChange % = (Price - Open) / Open
                            const oChangePercent = open !== 0 ? ((price - open) / open) * 100 : 0;
                            // pChange % = (Price - PrevClose) / PrevClose
                            const pChangePercent = stock.changePercent || 0;

                            const oChangeColor = oChangePercent >= 0 ? 'text-green-500' : 'text-red-500';
                            const pChangeColor = pChangePercent >= 0 ? 'text-green-500' : 'text-red-500';

                            // Format Time
                            const ts = stock.lastUpdated || Date.now();
                            const lastUpdateStr = new Date(ts > 1e11 ? ts : ts * 1000).toLocaleTimeString();

                            return (
                                <tr key={`${stock.ticker}-${i}`} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 text-xs">{stock.category}</td>
                                    <td className="px-6 py-4 font-bold text-lg">{stock.ticker}</td>
                                    <td className="px-6 py-4 font-mono">${price.toFixed(2)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${oChangeColor}`}>
                                        {oChangePercent.toFixed(2)}%
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${pChangeColor}`}>
                                        {pChangePercent.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-right text-xs text-blue-400 font-mono">
                                        {lastUpdateStr}
                                    </td>
                                </tr>
                            );
                        })}
                        {data.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No stocks found. Check Watchlist_Penny.csv.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
