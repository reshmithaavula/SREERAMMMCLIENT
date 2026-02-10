'use client';

import React, { useEffect, useState } from 'react';
import styles from '@/app/page.module.css';
import { safeSetItem } from '@/lib/storage-utils';

interface Holding {
    ticker: string;
    shares: number;
    avgPrice: number;
}

interface PortfolioItem extends Holding {
    currentPrice: number;
    value: number;
    gain: number;
    gainPercent: number;
    dayGain: number;       // Daily $ Gain
    dayGainPercent: number; // Daily % Change
}

interface PriceData {
    price: number;
    change: number;
    changePercent: number;
}

export default function PortfolioPage() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);
    const [prices, setPrices] = useState<Record<string, PriceData>>({});

    // Form State
    const [newTicker, setNewTicker] = useState('');
    const [newShares, setNewShares] = useState('');
    const [newPrice, setNewPrice] = useState('');

    const [mounted, setMounted] = useState(false);

    // 1. Load Holdings from Server (CSV) or LocalStorage on Mount
    useEffect(() => {
        setMounted(true);

        const loadData = async () => {
            let loaded = false;

            try {
                // Try fetching from CSV via API
                const res = await fetch('/api/portfolio');
                if (res.ok) {
                    const serverData = await res.json();
                    if (Array.isArray(serverData) && serverData.length > 0) {
                        const mapped = serverData.map((h: any) => ({
                            ticker: h.ticker,
                            shares: h.shares,
                            avgPrice: h.avgCost // API returns avgCost
                        }));
                        setHoldings(mapped);
                        loaded = true;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch portfolio from server:", e);
            }

            if (!loaded) {
                // Fallback to LocalStorage
                const saved = localStorage.getItem('userHoldings');
                if (saved) {
                    try {
                        setHoldings(JSON.parse(saved));
                    } catch (e) {
                        console.error("Failed to parse holdings", e);
                    }
                } else {
                    // Default sample data if empty
                    setHoldings([
                        { ticker: 'AAPL', shares: 10, avgPrice: 150.00 },
                        { ticker: 'TSLA', shares: 5, avgPrice: 200.00 },
                        { ticker: 'NVDA', shares: 2, avgPrice: 400.00 }
                    ]);
                }
            }
        };

        loadData();
    }, []);

    // 2. Fetch Prices when holdings change
    useEffect(() => {
        if (holdings.length === 0) {
            setLoading(false);
            return;
        }

        const fetchPrices = async () => {
            try {
                const t = holdings.map(h => h.ticker).join(',');
                const res = await fetch(`/api/movers?portfolio=${t}`);
                const json = await res.json();
                const pricing: Record<string, PriceData> = {};

                if (json.quotes) {
                    Object.values(json.quotes).forEach((q: any) => {
                        pricing[q.ticker] = {
                            price: q.price,
                            change: q.change,
                            changePercent: q.changePercent
                        };
                    });
                }
                setPrices(prev => ({ ...prev, ...pricing }));
                setLoading(false);
            } catch (e) {
                console.error("Failed to fetch prices", e);
                setLoading(false);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 3000); // ULTRA-FAST: 3 seconds
        return () => clearInterval(interval);
    }, [holdings.length]);

    // 3. Compute Portfolio Data efficiently
    const portfolioData = React.useMemo(() => {
        return holdings.map(h => {
            const quote = prices[h.ticker];
            const currentPrice = quote?.price || h.avgPrice || 0;
            const avg = h.avgPrice || 0;
            const value = h.shares * currentPrice;
            const cost = h.shares * avg;
            const gain = value - cost;
            const gainPercent = cost > 0 ? (gain / cost) * 100 : (value > 0 ? 100 : 0);

            const dayChange = quote?.change || 0;
            const dayGain = dayChange * h.shares;
            const dayGainPercent = quote?.changePercent || 0;

            return {
                ...h,
                currentPrice,
                value,
                gain,
                gainPercent,
                dayGain,
                dayGainPercent
            };
        });
    }, [holdings, prices]);

    // Save to localStorage whenever holdings change
    useEffect(() => {
        if (mounted) {
            safeSetItem('userHoldings', holdings);
        }
    }, [holdings, mounted]);

    // Handlers
    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicker || !newShares || !newPrice) return;

        const ticker = newTicker.toUpperCase();
        const shares = parseFloat(newShares);
        const avgPrice = parseFloat(newPrice);

        const existingIdx = holdings.findIndex(h => h.ticker === ticker);
        let newHoldings = [...holdings];

        if (existingIdx >= 0) {
            const h = newHoldings[existingIdx];
            const totalCost = (h.shares * h.avgPrice) + (shares * avgPrice);
            const totalShares = h.shares + shares;
            newHoldings[existingIdx] = {
                ticker,
                shares: totalShares,
                avgPrice: totalCost / totalShares
            };
        } else {
            newHoldings.push({ ticker, shares, avgPrice });
        }

        setHoldings(newHoldings);
        setNewTicker('');
        setNewShares('');
        setNewPrice('');
    };

    const handleRemove = (ticker: string) => {
        setHoldings(holdings.filter(h => h.ticker !== ticker));
    };

    const totalValue = portfolioData.reduce((sum, i) => sum + i.value, 0);
    const totalGain = portfolioData.reduce((sum, i) => sum + i.gain, 0);
    const totalGainPercent = totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0;

    return (
        <div className={styles.dashboard}>
            <header className="mb-6">
                <h1 className={styles.title}>💰 My Portfolio</h1>
                <p className={styles.subtitle}>Track your positions and daily P&L in real-time.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                    <div className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider mb-1">Total Value</div>
                    <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                    <div className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider mb-1">Total Gain/Loss</div>
                    <div className={`text-3xl font-bold tabular-nums ${totalGain >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                    <div className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-wider mb-1">Return</div>
                    <div className={`text-3xl font-bold tabular-nums ${totalGainPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                        {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </div>
                </div>
            </div>

            <div className="mb-8 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
                <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Add Position</h3>
                <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Ticker</label>
                        <input
                            type="text"
                            value={newTicker}
                            onChange={e => setNewTicker(e.target.value.toUpperCase())}
                            className="bg-[var(--background)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)] font-bold w-28 focus:border-[var(--accent-blue)] outline-none"
                            placeholder="AAPL"
                            required
                            suppressHydrationWarning={true}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Shares</label>
                        <input
                            type="number"
                            value={newShares}
                            onChange={e => setNewShares(e.target.value)}
                            className="bg-[var(--background)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)] font-bold w-24 focus:border-[var(--accent-blue)] outline-none"
                            placeholder="10"
                            required
                            suppressHydrationWarning={true}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Avg Price</label>
                        <input
                            type="number"
                            value={newPrice}
                            onChange={e => setNewPrice(e.target.value)}
                            className="bg-[var(--background)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)] font-bold w-28 focus:border-[var(--accent-blue)] outline-none"
                            placeholder="150.00"
                            step="0.01"
                            required
                            suppressHydrationWarning={true}
                        />
                    </div>
                    <button type="submit" className="h-[42px] bg-[var(--accent-blue)] hover:brightness-110 text-white font-bold py-2 px-6 rounded-md transition-all" suppressHydrationWarning={true}>
                        Add Position
                    </button>
                </form>
            </div>

            <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--card-bg)] shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--background)] text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Ticker</th>
                            <th className="px-6 py-4 text-right">Shares</th>
                            <th className="px-6 py-4 text-right">Avg Cost</th>
                            <th className="px-6 py-4 text-right">Last Price</th>
                            <th className="px-6 py-4 text-right">Value</th>
                            <th className="px-6 py-4 text-right">Day Gain</th>
                            <th className="px-6 py-4 text-right">Total Gain</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {portfolioData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-[var(--text-tertiary)] italic text-sm">
                                    No holdings yet. Add a stock above to get started.
                                </td>
                            </tr>
                        ) : (
                            portfolioData.map((item) => (
                                <tr key={item.ticker} className="hover:bg-black/[0.02] transition-colors group">
                                    <td className="px-6 py-4 font-bold text-[var(--text-primary)]">{item.ticker}</td>
                                    <td className="px-6 py-4 text-right text-[var(--text-primary)] font-bold tabular-nums">{item.shares.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-[var(--text-primary)] font-bold tabular-nums">${(item.avgPrice || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-[var(--text-primary)] tabular-nums">
                                        {prices[item.ticker] ? `$${(item.currentPrice || 0).toFixed(2)}` : <span className="text-[10px] text-[var(--accent-gold)] uppercase font-bold">Fetching...</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-[var(--text-primary)] tabular-nums">${(item.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold tabular-nums ${item.dayGain >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                                            {item.dayGain >= 0 ? '+' : ''}${item.dayGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <div className="text-[10px] opacity-70">
                                                {item.dayGainPercent >= 0 ? '+' : ''}{(item.dayGainPercent || 0).toFixed(2)}%
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold tabular-nums ${item.gain >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                                            {item.gain >= 0 ? '+' : ''}{(typeof item.gainPercent === 'number' && !isNaN(item.gainPercent) ? item.gainPercent : 0).toFixed(2)}%
                                            <div className="text-[10px] opacity-70">
                                                {item.gain >= 0 ? '+' : ''}${typeof item.gain === 'number' && !isNaN(item.gain) ? item.gain.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleRemove(item.ticker)}
                                            className="text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all p-2 text-xs"
                                            title="Remove"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
