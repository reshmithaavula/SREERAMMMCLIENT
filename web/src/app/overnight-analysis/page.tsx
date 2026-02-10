'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/page.module.css';

import dynamic from 'next/dynamic';

const Table = dynamic(() => import('@/components/Table'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-900/10 h-64 rounded-xl w-full"></div>
});

interface StatRow {
    ticker: string;
    dma_50: number;
    swing_avg: number;
    beta: number;
    updated_at: string;
}

const formatNum = (n: number, decimals = 2) => {
    if (n === null || n === undefined) return '-';
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const columns = [
    {
        header: 'Ticker',
        accessor: 'ticker',
        render: (val: string) => <span className="font-bold text-[var(--text-primary)]">{val}</span>
    },
    {
        header: '50 Day MA',
        accessor: 'dma_50',
        render: (val: number) => <span className="font-mono text-[var(--text-secondary)]">${formatNum(val)}</span>
    },
    {
        header: 'Avg Daily Swing (50d)',
        accessor: 'swing_avg',
        render: (val: number) => <span className="font-mono text-[var(--text-secondary)]">${formatNum(val)}</span>
    },
    {
        header: 'Beta (vs SPY)',
        accessor: 'beta',
        render: (val: number) => (
            <div className={`inline-block px-2 py-0.5 rounded font-mono ${val > 1.5 ? 'bg-orange-100 text-orange-700' :
                val < 0.5 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                {formatNum(val)}
            </div>
        )
    },
    {
        header: 'Computed At',
        accessor: 'updated_at',
        render: (val: string) => <span className="text-[10px] text-[var(--text-tertiary)]">{val}</span>
    }
];

export default function OvernightAnalysisPage() {
    const [stats, setStats] = useState<StatRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/overnight-analysis');
            const json = await res.json();
            if (json.success) {
                setStats(json.data || []); // Ensure data is an array
                setLastRefreshed(new Date());
            } else {
                setStats([]); // Fallback to empty
            }
        } catch (e) {
            console.error(e);
            setStats([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className={styles.dashboard}>
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className={styles.title}>🌙 Overnight Analysis</h1>
                    <p className={styles.subtitle}>End-of-Day computed metrics: 50 DMA, Price Swings, and Beta.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest">
                        Updated: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : '--'}
                    </span>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-5 py-2.5 bg-[var(--accent-blue)] hover:brightness-110 text-white rounded-md text-[10px] font-bold tracking-widest transition-all uppercase"
                    >
                        {loading ? 'Topup...' : 'Refresh Data'}
                    </button>
                </div>
            </header>

            <div className={styles.section}>
                {/* Show empty state message if not loading and no data */}
                <Table
                    columns={columns}
                    data={stats}
                    loading={loading && stats.length === 0}
                    emptyState={
                        <div className="flex flex-col items-center justify-center py-12">
                            <p className="text-[var(--text-tertiary)] mb-2 font-medium">No analysis data found.</p>
                            <p className="text-[12px] text-[var(--text-tertiary)] opacity-70">
                                The backend calculates this once daily. Ensure "01_MASTER_START.bat" is running.
                            </p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
