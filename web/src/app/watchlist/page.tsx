'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/page.module.css';
import { useMarketData } from '@/components/MarketDataContext';
import { FALLBACK_WATCHLIST, FALLBACK_MOVER_DATA } from '@/lib/fallback-data';


const Table = dynamic(() => import('@/components/Table'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-black/5 h-64 rounded-xl"></div>
});

const StyledTable = dynamic(() => import('@/components/StyledTable'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-black/5 h-64 rounded-xl"></div>
});

const columns = [
    {
        header: 'Ticker', accessor: 'ticker', render: (v: string) => (
            <div className="flex items-center gap-2">
                <a href={`https://finance.yahoo.com/quote/${v}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--text-primary)] text-[13px] hover:text-[var(--accent-blue)] transition-colors" title="Yahoo Finance">
                    {v}
                </a>
                <a href={`https://www.cnbc.com/quotes/${v}`} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-[var(--text-tertiary)] hover:text-blue-600 opacity-40 hover:opacity-100 transition-all uppercase px-1 border border-transparent hover:border-blue-200 rounded" title="CNBC Search">
                    CNBC
                </a>
            </div>
        )
    },
    { header: 'Price', accessor: 'price', render: (val: number) => <span className="font-bold text-[12px]">${(val || 0).toFixed(2)}</span> },
    {
        header: 'OCHG %',
        accessor: 'oChangePercent',
        render: (val: number, row: any) => {
            const price = row.price || 0;
            const open = row.openPrice || 0;
            const oPercent = open > 0 ? ((price - open) / open) * 100 : 0;
            return (
                <span className={`font-bold tabular-nums text-[12px] ${oPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                    {oPercent >= 0 ? '+' : ''}{oPercent.toFixed(2)}%
                </span>
            );
        }
    },
    {
        header: 'DAY %',
        accessor: 'changePercent',
        render: (val: number) => (
            <span className={`font-bold tabular-nums text-[12px] ${val >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </span>
        )
    },
    {
        header: 'oPrice',
        accessor: 'openPrice',
        render: (val: number) => <span className="text-[var(--text-primary)] font-bold text-[12px]">${(val || 0).toFixed(2)}</span>
    },
];

function SafeTime({ value }: { value: number }) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    if (!isMounted) return <span className="text-[var(--text-tertiary)] text-[10px] opacity-40">--:--:--</span>;
    const ts = value || Date.now();
    const dateObj = new Date(ts > 1e11 ? ts : ts * 1000);
    const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return (
        <span className="text-[var(--accent-blue)] font-bold text-[11px] tabular-nums tracking-tight">
            {timeStr}
        </span>
    );
}

const miniColumns = [
    {
        header: 'Tick',
        accessor: 'ticker',
        render: (v: string, row: any) => (
            <div className="flex flex-col">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-[12px]">{v}</span>
                    {row.common_flag === 1 && (
                        <span className="text-[9px] text-yellow-500 font-bold" title="Common Signal (Multi-Timeframe)">★</span>
                    )}
                </div>
                {row.timeframes && row.timeframes.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                        {row.timeframes.map((tf: string) => (
                            <span key={tf} className="text-[7px] font-black bg-yellow-400/20 text-yellow-700 px-1 rounded uppercase">
                                {tf}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )
    },
    { header: 'Price', accessor: 'price', render: (v: number) => <span className="font-bold text-[12px] tabular-nums">${v.toFixed(2)}</span> },
    {
        header: '%',
        accessor: 'changePercent',
        render: (v: number) => (
            <span className={`font-bold tabular-nums text-[12px] ${v >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                {v >= 0 ? '+' : ''}{v.toFixed(2)}%
            </span>
        )
    }
];

const MoverBox = ({ title, items, color }: { title: string, items: any[], color: 'green' | 'red' }) => (
    <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[100px] max-h-[160px] transition-all hover:border-[var(--accent-blue)] hover:shadow-md`}>
        <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b ${color === 'green'
            ? 'bg-[var(--accent-green)]/5 text-[var(--accent-green)] border-[var(--accent-green)]/10'
            : 'bg-[var(--accent-red)]/5 text-[var(--accent-red)] border-[var(--accent-red)]/10'
            } flex justify-between items-center shrink-0`}>
            <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${color === 'green' ? 'bg-[var(--accent-green)] animate-pulse' : 'bg-[var(--accent-red)] animate-pulse'}`}></span>
                {title}
            </span>
            <span className="text-[9px] font-bold opacity-60 tracking-wider overflow-hidden whitespace-nowrap uppercase">{items.length} SIGNALS</span>
        </div>
        <div className="overflow-auto flex-1 text-[11px] custom-scrollbar">
            {items.length > 0 ? (
                <Table columns={miniColumns} data={items} minWidth="150px" />
            ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] italic text-[9px] opacity-40 uppercase tracking-widests">
                    -- Scanning --
                </div>
            )}
        </div>
    </div>
);

export default function WatchlistPage() {
    const { data: globalData, refreshAll } = useMarketData();
    const [data, setData] = useState<any[]>(globalData.watchlist);
    const [movers, setMovers] = useState<any>(globalData.movers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastSynced, setLastSynced] = useState<Date>(new Date());
    const [nextRefresh, setNextRefresh] = useState(15);
    const [isMounted, setIsMounted] = useState(false);

    // Sync from global data
    useEffect(() => {
        if (globalData.watchlist.length > 0) setData(globalData.watchlist);
        if (globalData.movers) setMovers(globalData.movers);
        setLastSynced(new Date(globalData.lastUpdate || Date.now()));
    }, [globalData]);

    const fetchData = async () => {
        setLoading(true);
        await refreshAll();
        setLoading(false);
        setNextRefresh(15);
    };

    useEffect(() => {
        setIsMounted(true);
        // data is already prefetched by context

        const countdownInterval = setInterval(() => {
            setNextRefresh(prev => (prev > 0 ? prev - 1 : 15));
        }, 1000);

        return () => {
            clearInterval(countdownInterval);
        };
    }, []);

    const [newSymbol, setNewSymbol] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAddSymbol = async () => {
        if (!newSymbol) return;
        setAdding(true);
        try {
            const res = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: newSymbol })
            });
            const json = await res.json();
            if (json.success) {
                setNewSymbol('');
                fetchData(); // Refresh list
            } else {
                alert(json.message || 'Failed');
            }
        } catch (e) {
            alert('Error adding symbol');
        } finally {
            setAdding(false);
        }
    };


    return (
        <div className={styles.dashboard}>
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className={styles.title}>🔭 Market Watchlist</h1>
                        <p className={styles.subtitle}>Real-time tracking of identified momentum signals.</p>
                    </div>

                    {/* Add Symbol Input */}
                    <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] p-1 rounded-lg shadow-sm">
                        <input
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                            placeholder="ADD SYMBOL..."
                            className="bg-transparent text-[11px] font-bold text-[var(--text-primary)] px-2 outline-none w-24 placeholder:text-[var(--text-tertiary)]"
                        />
                        <button
                            onClick={handleAddSymbol}
                            disabled={adding || !newSymbol}
                            className="bg-[var(--accent-blue)] hover:brightness-110 text-white p-1.5 rounded-md transition-all disabled:opacity-50"
                        >
                            {adding ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <div className="text-[10px] font-bold px-1">+</div>}
                        </button>
                    </div>

                    <div className={`px-4 py-1.5 ${movers?.engineStatus?.isLive ? 'bg-[var(--accent-green)]/5 border-[var(--accent-green)]/10' : 'bg-[var(--accent-red)]/5 border-[var(--accent-red)]/10'} rounded-full border flex items-center gap-2.5 transition-all shadow-sm`}>
                        <span className={`w-2.5 h-2.5 ${movers?.engineStatus?.isLive ? 'bg-[var(--accent-green)] shadow-[0_0_8px_rgba(0,143,93,0.4)]' : 'bg-[var(--accent-red)]'} rounded-full animate-pulse`}></span>
                        <span suppressHydrationWarning className={`text-[10px] font-bold ${movers?.engineStatus?.isLive ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'} uppercase tracking-widest`}>
                            {movers?.engineStatus?.isLive ? 'Live Engine' : 'Offline'}
                        </span>
                    </div>
                    <div className="px-4 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full flex items-center shadow-sm">
                        <span className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest">
                            {movers?.engineStatus?.session || 'Closed'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end px-6 border-r border-[var(--border-color)]">
                        <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-wider mb-0.5">Sync</span>
                        <span className="text-[12px] font-bold text-[var(--accent-blue)] tabular-nums">
                            {isMounted ? `${nextRefresh}s` : '--s'}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchData()}
                        disabled={loading}
                        className={`px-5 py-2.5 bg-[var(--accent-blue)] hover:brightness-110 text-white rounded-md text-[10px] font-bold tracking-widest transition-all flex items-center gap-2 shadow-sm uppercase`}
                    >
                        {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        REFRESH
                    </button>
                </div>
            </header>

            <div className="flex flex-row gap-4 h-[calc(100vh-160px)]">
                <div className="w-[380px] flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col gap-1 px-1 shrink-0">
                        <span className="text-[11px] font-bold text-[var(--accent-blue)] uppercase tracking-wider">Asset Registry</span>
                        <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-widest">{data.length} Positions</span>
                    </div>
                    <div className="flex-1 overflow-auto border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-sm custom-scrollbar">
                        <StyledTable columns={columns} data={data} minWidth="360px" />
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col gap-1 px-1 shrink-0">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Momentum Matrix</span>
                        <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-widest">Real-time Scanner</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-2 flex-1 custom-scrollbar pr-1">
                        {/* Common Movers (Golden) */}
                        <div className="col-span-2">
                            <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[100px] max-h-[160px] transition-all hover:border-yellow-400 hover:shadow-md`}>
                                <div className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b bg-yellow-400/10 text-yellow-600 border-yellow-400/20 flex justify-between items-center shrink-0`}>
                                    <span className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse`}></span>
                                        Golden Signals (Multi-Timeframe)
                                    </span>
                                    <span className="text-[9px] font-bold opacity-60 tracking-wider overflow-hidden whitespace-nowrap uppercase">{movers?.common?.length || 0} SIGNALS</span>
                                </div>
                                <div className="overflow-auto flex-1 text-[11px] custom-scrollbar">
                                    {(movers?.common && movers.common.length > 0) ? (
                                        <Table columns={miniColumns} data={movers.common} minWidth="150px" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] italic text-[9px] opacity-40 uppercase tracking-widest">
                                            -- NO CONVICTION MOVERS --
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <MoverBox title="1m Ripper" items={movers?.m1?.rippers || []} color="green" />
                        <MoverBox title="1m Dipper" items={movers?.m1?.dippers || []} color="red" />
                        <MoverBox title="5m Ripper" items={movers?.m5?.rippers || []} color="green" />
                        <MoverBox title="5m Dipper" items={movers?.m5?.dippers || []} color="red" />
                        <MoverBox title="30m Ripper" items={movers?.m30?.rippers || []} color="green" />
                        <MoverBox title="30m Dipper" items={movers?.m30?.dippers || []} color="red" />
                        <MoverBox title="Daily Ripper" items={movers?.day?.rippers || []} color="green" />
                        <MoverBox title="Daily Dipper" items={movers?.day?.dippers || []} color="red" />
                    </div>
                </div>
            </div>
        </div>
    );
}
