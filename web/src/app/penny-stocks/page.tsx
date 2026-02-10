'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/page.module.css';

const Table = dynamic(() => import('@/components/Table'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-black/5 h-64 rounded-xl"></div>
});

const StyledTable = dynamic(() => import('@/components/StyledTable'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-black/5 h-64 rounded-xl"></div>
});

const columns = [
    { header: 'Ticker', accessor: 'ticker', render: (v: string) => <span className="font-bold text-[var(--text-primary)] text-[13px]">{v}</span> },
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
    }
];

const miniColumns = [
    { header: 'Tick', accessor: 'ticker', render: (v: string) => <span className="font-bold text-[12px]">{v}</span> },
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

export default function PennyStocksPage() {
    const [data, setData] = useState<any[]>([]);
    const [movers, setMovers] = useState<any>({
        m1: { rippers: [], dippers: [] },
        m5: { rippers: [], dippers: [] },
        m30: { rippers: [], dippers: [] },
        day: { rippers: [], dippers: [] }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastSynced, setLastSynced] = useState<Date>(new Date());
    const [nextRefresh, setNextRefresh] = useState(15);
    const [isMounted, setIsMounted] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/penny-stocks');
            if (!res.ok) throw new Error('Failed to fetch penny stocks');
            const json = await res.json();

            if (json.stocks) {
                setData(json.stocks);
            }
            setMovers({
                m1: json.m1 || { rippers: [], dippers: [] },
                m5: json.m5 || { rippers: [], dippers: [] },
                m30: json.m30 || { rippers: [], dippers: [] },
                day: json.day || { rippers: [], dippers: [] },
                engineStatus: json.engineStatus
            });
            setLastSynced(new Date());
            setNextRefresh(15);
            setError('');
        } catch (err: any) {
            console.error('API Error:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        fetchData();

        const syncInterval = setInterval(fetchData, 15000);
        const countdownInterval = setInterval(() => {
            setNextRefresh(prev => (prev > 0 ? prev - 1 : 15));
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(countdownInterval);
        };
    }, []);

    return (
        <div className={styles.dashboard}>
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className={styles.title}>🔭 Penny Stock Insights</h1>
                        <p className={styles.subtitle}>Micro-cap volatility and momentum scanner tracks moves across multiple timeframes.</p>
                    </div>
                    <div className={`px-4 py-1.5 ${movers?.engineStatus?.isLive ? 'bg-[var(--accent-green)]/5 border-[var(--accent-green)]/10' : 'bg-[var(--accent-red)]/5 border-[var(--accent-red)]/10'} rounded-full border flex items-center gap-2.5 transition-all shadow-sm`}>
                        <span className={`w-2.5 h-2.5 ${movers?.engineStatus?.isLive ? 'bg-[var(--accent-green)] shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--accent-red)]'} rounded-full animate-pulse`}></span>
                        <span suppressHydrationWarning className={`text-[10px] font-bold ${movers?.engineStatus?.isLive ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'} uppercase tracking-widest`}>
                            {movers?.engineStatus?.isLive ? 'Live Engine' : (movers?.engineStatus?.statusText || 'Offline')}
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
                        <span className="text-[11px] font-bold text-[var(--accent-blue)] uppercase tracking-wider">Penny Registry</span>
                        <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-widest">{data.length} Positions</span>
                    </div>
                    <div className="flex-1 overflow-auto border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-sm custom-scrollbar">
                        {isMounted ? (
                            <StyledTable columns={columns} data={data} minWidth="360px" />
                        ) : (
                            <div className="p-10 text-center animate-pulse">
                                <p className="text-[var(--text-tertiary)] uppercase tracking-widest text-[10px] font-bold">Initializing Registry...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col gap-1 px-1 shrink-0">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Penny Momentum Matrix</span>
                        <span className="text-[10px] text-[var(--text-primary)] font-bold uppercase tracking-widest">Real-time Micro-cap Scanner</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-2 flex-1 custom-scrollbar pr-1">
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
