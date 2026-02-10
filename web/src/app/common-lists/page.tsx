'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/page.module.css';

const Table = dynamic(() => import('@/components/Table'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-900/10 h-64 rounded-xl w-full"></div>
});

const columns = [
    { header: 'Ticker', accessor: 'ticker', render: (val: string) => <span className="font-bold text-[var(--text-primary)]">{val || '---'}</span> },
    { header: 'Last Price', accessor: 'price', render: (val: number) => `$${(val || 0).toFixed(2)}` },
    {
        header: 'oChange %',
        accessor: 'oChangePercent',
        render: (val: number) => (
            <span className="font-bold tabular-nums" style={{ color: (val || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {(val || 0).toFixed(2)}%
            </span>
        )
    },
    {
        header: 'oPrice',
        accessor: 'openPrice',
        render: (val: number, row: any) => (val || row?.prevClose || 0).toFixed(2)
    },
    {
        header: 'pChange %',
        accessor: 'pChangePercent',
        render: (val: number) => (
            <span className="font-bold tabular-nums" style={{ color: (val || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {(val || 0).toFixed(2)}%
            </span>
        )
    },
    {
        header: 'Last Update',
        accessor: 'lastUpdated',
        render: (val: number) => {
            try {
                const ts = val || Date.now();
                return <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase">{new Date(ts > 1e11 ? ts : ts * 1000).toLocaleTimeString()}</span>;
            } catch (e) { return '--:--'; }
        }
    }
];

export default function CommonListsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/movers');
            const json = await res.json();

            if (json.movers) {
                const commonRaw = json.movers.filter((m: any) => m.common_flag === 1);
                const uniqueTickers = Array.from(new Set(commonRaw.map((m: any) => m.ticker))) as string[];

                const tableData = uniqueTickers.map(ticker => {
                    const m = commonRaw.find((item: any) => item.ticker === ticker);
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

                setData(tableData);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch common lists', error);
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
            <header className="mb-4">
                <h1 className={styles.title}>⚡ Common Lists</h1>
                <p className={styles.subtitle}>Stocks appearing on multiple momentum lists simultaneously.</p>
            </header>

            <section className={styles.section}>
                <Table columns={columns} data={data} loading={loading && data.length === 0} />
            </section>
        </div>
    );
}
