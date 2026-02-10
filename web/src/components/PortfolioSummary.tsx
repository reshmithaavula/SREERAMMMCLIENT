'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { safeSetItem } from '@/lib/storage-utils';

interface Holding {
    ticker: string;
    shares: number;
    avgPrice: number;
}

const DEFAULT_HOLDINGS: Holding[] = [
    { ticker: 'NVDA', shares: 10, avgPrice: 850.00 },
    { ticker: 'TSLA', shares: 25, avgPrice: 195.00 },
    { ticker: 'AAPL', shares: 50, avgPrice: 175.00 },
    { ticker: 'AMD', shares: 40, avgPrice: 150.00 },
    { ticker: 'AMZN', shares: 20, avgPrice: 180.00 }
];

export function PortfolioSummary({ quotes, initialHoldings = [] }: { quotes?: Record<string, any>, initialHoldings?: Holding[] }) {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [mounted, setMounted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Edit form state
    const [newTicker, setNewTicker] = useState('');
    const [newShares, setNewShares] = useState('');
    const [newCost, setNewCost] = useState('');

    useEffect(() => {
        setMounted(true);
        if (initialHoldings && initialHoldings.length > 0) {
            setHoldings(initialHoldings);
        } else {
            const savedHoldings = localStorage.getItem('userHoldings');
            if (savedHoldings && savedHoldings.trim() !== '' && savedHoldings !== 'undefined' && savedHoldings !== 'null') {
                try {
                    const parsed = JSON.parse(savedHoldings);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const migrated = parsed.map((h: any) => ({
                            ...h,
                            avgPrice: h.avgPrice ?? h.avgCost ?? 0
                        }));
                        setHoldings(migrated);
                    } else {
                        setHoldings(DEFAULT_HOLDINGS);
                    }
                } catch (e) {
                    console.warn("Corrupted portfolio data, resetting to defaults", e);
                    localStorage.removeItem('userHoldings');
                    setHoldings(DEFAULT_HOLDINGS);
                }
            } else {
                setHoldings(DEFAULT_HOLDINGS);
            }
        }
    }, [initialHoldings]);

    useEffect(() => {
        if (!mounted) return;
        safeSetItem('userHoldings', holdings);
    }, [holdings, mounted]);

    const resetDefaults = () => {
        setHoldings(DEFAULT_HOLDINGS);
        setIsEditing(false);
    };

    const addHolding = () => {
        if (!newTicker || !newShares) return;
        const shares = parseFloat(newShares);
        const cost = parseFloat(newCost) || 0;
        if (isNaN(shares)) return;

        setHoldings(prev => [...prev, { ticker: newTicker.toUpperCase(), shares, avgPrice: cost }]);
        setNewTicker('');
        setNewShares('');
        setNewCost('');
    };

    const removeHolding = (index: number) => {
        setHoldings(prev => prev.filter((_, i) => i !== index));
    };

    if (!mounted) return <div className="animate-pulse h-48 bg-[var(--background)] rounded-xl"></div>;

    const rows = holdings.map(h => {
        const quote = quotes?.[h.ticker];
        const price = quote?.price || h.avgPrice || 0;
        const change = quote?.change || 0;
        const changePercent = quote?.changePercent || 0;
        const currentValue = price * h.shares;

        return {
            ...h,
            price: isNaN(price) ? 0 : price,
            change: isNaN(change) ? 0 : change,
            changePercent: isNaN(changePercent) ? 0 : changePercent,
            currentValue: isNaN(currentValue) ? 0 : currentValue
        };
    });

    const totalValue = rows.reduce((acc, row) => acc + (row.currentValue || 0), 0);

    return (
        <div className="flex flex-col h-full bg-[var(--card-bg)]">
            {/* Controls */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--border-color)] bg-[var(--accent-blue)]/5 shrink-0">
                <div className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest">
                    Asset Portfolio: <span className="text-[var(--text-primary)] text-[13px] font-bold tabular-nums font-mono ml-2">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-[9px] px-2.5 py-1 rounded border border-[var(--border-color)] hover:bg-[var(--background)] text-[var(--text-primary)] font-bold transition-all uppercase tracking-widest shadow-sm"
                    >
                        {isEditing ? 'COMMIT' : 'MANAGE'}
                    </button>
                    {isEditing && (
                        <button
                            onClick={resetDefaults}
                            className="text-[9px] px-2.5 py-1 rounded border border-[var(--accent-red)]/20 hover:bg-[var(--accent-red)]/10 text-[var(--accent-red)] font-bold transition-all uppercase tracking-widest shadow-sm"
                        >
                            RESET
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="p-3 border-b border-[var(--border-color)] bg-[var(--background)] shrink-0 animate-in slide-in-from-top duration-300">
                    <div className="flex gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase ml-1">Symbol</label>
                            <input
                                value={newTicker}
                                onChange={e => setNewTicker(e.target.value.toUpperCase())}
                                placeholder="AAPL"
                                className="w-24 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)] outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase ml-1">Quantity</label>
                            <input
                                value={newShares}
                                onChange={e => setNewShares(e.target.value)}
                                placeholder="100"
                                type="number"
                                className="w-20 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)] outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase ml-1">Avg Price (Optional)</label>
                            <input
                                value={newCost}
                                onChange={e => setNewCost(e.target.value)}
                                placeholder="150.00"
                                type="number"
                                className="w-32 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] font-bold focus:border-[var(--accent-blue)] outline-none"
                            />
                        </div>
                        <button onClick={addHolding} className="bg-[var(--accent-blue)] hover:brightness-110 h-[34px] w-[34px] flex items-center justify-center rounded-md text-white transition-all shadow-md active:scale-95">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Table Header */}
            <div className="grid grid-cols-[1fr_50px_80px_110px_120px] gap-1 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--background)] text-[11px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] shrink-0">
                <div className="text-left">ASSET</div>
                <div className="text-right">QTY</div>
                <div className="text-right">PRICE</div>
                <div className="text-right">DAY CHG</div>
                <div className="text-right">CURR VALUE</div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rows.map((row, i) => (
                    <div key={i} className="group grid grid-cols-[1fr_50px_80px_110px_120px] gap-1 px-4 py-4 border-b border-[var(--border-color)] hover:bg-black/[0.01] items-center text-[13px] transition-colors">
                        <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 overflow-hidden">
                            <span className="bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] px-2 py-1 rounded text-[13px] font-bold shrink-0">{row.ticker}</span>
                            {isEditing && (
                                <button onClick={() => removeHolding(i)} className="text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded p-0.5 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            )}
                        </div>
                        <div className="text-right text-[var(--text-primary)] font-bold tabular-nums font-mono">{row.shares.toLocaleString()}</div>
                        <div className="text-right text-[var(--text-primary)] font-bold tabular-nums font-mono">${(row.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`text-right font-bold tabular-nums font-mono ${row.change >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'} whitespace-nowrap`}>
                            {row.change > 0 ? '+' : ''}{(row.change || 0).toFixed(2)}
                            <span className="text-[12px] ml-0.5 opacity-60">({(row.changePercent || 0).toFixed(2)}%)</span>
                        </div>
                        <div className="text-right text-[var(--text-primary)] font-bold tabular-nums font-mono text-[16px]">
                            ${(row.currentValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="p-12 text-center text-[var(--text-tertiary)] text-[11px] font-bold uppercase tracking-widest italic opacity-50">
                        -- Empty Registry --
                    </div>
                )}
            </div>
        </div>
    );
}
