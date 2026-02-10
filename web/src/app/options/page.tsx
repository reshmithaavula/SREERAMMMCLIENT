'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/page.module.css';
import { Target } from 'lucide-react';

const Table = dynamic(() => import('@/components/Table'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-100 h-64 rounded-xl w-full"></div>
});

const columns = [
    { header: 'Ticker', accessor: 'ticker' },
    { header: 'Strategy', accessor: 'strategy' },
    { header: 'Strike', accessor: 'strike' },
    { header: 'Exp', accessor: 'exp' },
    { header: 'IV Estimate', accessor: 'iv' },
];

export default function OptionsPage() {
    const [optionsData, setOptionsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch('/api/options');
                const json = await res.json();
                setOptionsData(json.options || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchOptions();
    }, []);

    return (
        <div className="max-w-[100%] mx-auto px-6 py-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--accent-blue)]/10 rounded-lg">
                    <Target className="w-5 h-5 text-[var(--accent-blue)]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Option Analysis</h1>
                    <p className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase tracking-widest mt-0.5">Sentiment-Driven Strategy Matrix</p>
                </div>
            </div>

            <section className="bg-white rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[var(--border-color)] bg-gray-50/50">
                    <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Inferred Institutional Flows</h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-6 h-6 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[var(--text-tertiary)] font-bold text-[10px] uppercase tracking-widest animate-pulse">Scanning Option Markets...</p>
                    </div>
                ) : optionsData.length > 0 ? (
                    <div className="overflow-hidden">
                        <Table columns={columns} data={optionsData} />
                    </div>
                ) : (
                    <div className="p-20 text-center bg-gray-50/30">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                            <Target className="w-6 h-6 text-gray-400 opacity-50" />
                        </div>
                        <p className="text-[var(--text-tertiary)] uppercase tracking-[0.2em] text-[10px] font-black">No institutional option flows detected in current session.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
