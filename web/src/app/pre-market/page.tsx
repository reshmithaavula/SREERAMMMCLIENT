'use client';

import React, { useEffect, useState } from 'react';
import Table from '@/components/Table';
import styles from '@/app/page.module.css';

const columns = [
    { header: 'Ticker', accessor: 'ticker', render: (val: string) => <span className="font-bold text-[var(--text-primary)]">{val}</span> },
    { header: 'Last Price', accessor: 'price', render: (val: number) => `$${val.toFixed(2)}` },
    {
        header: 'oChange %',
        accessor: 'oChangePercent',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {val.toFixed(2)}%
            </span>
        )
    },
    {
        header: 'oPrice',
        accessor: 'openPrice',
        render: (val: number, row: any) => (val || row.prevClose || 0).toFixed(2)
    },
    {
        header: 'pChange %',
        accessor: 'pChangePercent',
        render: (val: number) => (
            <span style={{ color: val >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {val.toFixed(2)}%
            </span>
        )
    },
    {
        header: 'Last Update',
        accessor: 'lastUpdated',
        render: (val: number) => {
            const ts = val || Date.now();
            return new Date(ts > 1e11 ? ts : ts * 1000).toLocaleTimeString();
        }
    }
];

export default function PreMarketPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/movers');
            const json = await res.json();

            if (json.movers) {
                const sessionMovers = json.movers.filter((m: any) => m.session === 'Pre-Market');
                const uniqueTickers = Array.from(new Set(sessionMovers.map((m: any) => m.ticker))) as string[];

                const tableData = uniqueTickers.map(ticker => {
                    const m = sessionMovers.find((item: any) => item.ticker === ticker);
                    const q = (json as any).quotes ? (json as any).quotes[ticker] : null;

                    const price = q?.price || m?.price || 0;
                    const prevClose = q?.prevClose || m?.prevClose || 0;
                    // If open is missing, use prevClose (standard for pre-market logic)
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

                setData(tableData);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch pre-market data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // ULTRA-FAST: 3 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.dashboard}>
            <header className="mb-6">
                <h1 className={styles.title}>🌅 Pre-Market Movers</h1>
                <p className={styles.subtitle}>Activity detected before regular trading hours (4:00 AM - 9:30 AM ET).</p>
            </header>

            <section className={styles.section}>
                {loading && data.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                        <p className="mt-4">Scanning pre-market volumes...</p>
                    </div>
                ) : (
                    <Table columns={columns} data={data} />
                )}
            </section>
        </div>
    );
}
