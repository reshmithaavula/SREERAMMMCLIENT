'use client';

import React, { useEffect, useState } from 'react';
import Table from '@/components/Table';
import styles from '@/app/page.module.css';

const columns = [
    { header: 'Ticker', accessor: 'ticker', render: (val: string) => <span className="font-bold text-[var(--text-primary)]">{val}</span> },
    { header: 'Price', accessor: 'price', render: (val: number) => `$${(val || 0).toFixed(2)}` },
    {
        header: 'oChange %',
        accessor: 'oChangePercent',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} className="font-bold tabular-nums">
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </span>
        )
    },
    {
        header: 'pChange %',
        accessor: 'pChangePercent',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }} className="font-bold tabular-nums">
                {val >= 0 ? '+' : ''}{val.toFixed(2)}%
            </span>
        )
    },
    {
        header: 'Last Update',
        accessor: 'lastUpdated',
        render: (val: number) => {
            const ts = val || Date.now();
            return (
                <span className="text-[var(--accent-blue)] font-bold text-[11px] tabular-nums">
                    {new Date(ts > 1e11 ? ts : ts * 1000).toLocaleTimeString()}
                </span>
            );
        }
    }
];

export default function MarketSessionsPage() {
    const [preData, setPreData] = useState<any[]>([]);
    const [postData, setPostData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/movers');
            const json = await res.json();

            if (json.movers) {
                const processMovers = (session: string) => {
                    const sessionMovers = json.movers.filter((m: any) => m.session === session);
                    const uniqueTickers = Array.from(new Set(sessionMovers.map((m: any) => m.ticker))) as string[];

                    return uniqueTickers.map(ticker => {
                        const m = sessionMovers.find((item: any) => item.ticker === ticker);
                        const q = (json as any).quotes ? (json as any).quotes[ticker] : null;

                        const price = q?.price || m?.price || 0;
                        const prevClose = q?.prevClose || m?.prevClose || 0;
                        const open = q?.openPrice || m?.openPrice || prevClose || 0;

                        return {
                            ticker: ticker,
                            price: price,
                            openPrice: open,
                            prevClose: prevClose,
                            oChangePercent: open > 0 ? ((price - open) / open) * 100 : 0,
                            pChangePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
                            lastUpdated: q?.lastUpdated || Date.now()
                        };
                    });
                };

                setPreData(processMovers('Pre-Market'));
                setPostData(processMovers('Post-Market'));
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch market session data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.dashboard}>
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className={styles.title}>🌓 Extended Hours Activity</h1>
                    <p className={styles.subtitle}>Tracking momentum in Pre-Market and Post-Market sessions.</p>
                </div>
                <div className="text-[10px] font-bold text-[var(--accent-blue)] uppercase tracking-widest bg-[var(--accent-blue)]/5 px-4 py-1.5 rounded-full border border-[var(--accent-blue)]/10">
                    Live Session Monitor
                </div>
            </header>

            <div className="flex flex-row gap-6 h-[calc(100vh-160px)]">
                {/* Pre-Market Section */}
                <section className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <h2 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider">🌅 Pre-Market</h2>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-bold ml-auto">{preData.length} SIGNALS</span>
                    </div>

                    <div className="flex-1 border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-sm overflow-auto custom-scrollbar">
                        {loading && preData.length === 0 ? (
                            <div className="py-12 text-center text-[var(--text-tertiary)] italic text-[11px] uppercase tracking-widest">
                                -- Scanning Pre --
                            </div>
                        ) : preData.length > 0 ? (
                            <Table columns={columns} data={preData} minWidth="300px" />
                        ) : (
                            <div className="py-12 text-center text-[var(--text-tertiary)] italic text-[11px] uppercase tracking-widest opacity-40">
                                -- No Activity --
                            </div>
                        )}
                    </div>
                </section>

                {/* Post-Market Section */}
                <section className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <h2 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider">🌙 Post-Market</h2>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-bold ml-auto">{postData.length} SIGNALS</span>
                    </div>

                    <div className="flex-1 border border-[var(--border-color)] rounded-xl bg-[var(--card-bg)] shadow-sm overflow-auto custom-scrollbar">
                        {loading && postData.length === 0 ? (
                            <div className="py-12 text-center text-[var(--text-tertiary)] italic text-[11px] uppercase tracking-widest">
                                -- Scanning Post --
                            </div>
                        ) : postData.length > 0 ? (
                            <Table columns={columns} data={postData} minWidth="300px" />
                        ) : (
                            <div className="py-12 text-center text-[var(--text-tertiary)] italic text-[11px] uppercase tracking-widest opacity-40">
                                -- No Activity --
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
