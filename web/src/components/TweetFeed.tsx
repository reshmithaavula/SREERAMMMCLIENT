'use client';

import React, { useEffect, useState } from 'react';
import { Twitter, ExternalLink, Clock } from 'lucide-react';

export interface NewsItem {
    id: string;
    headline: string;
    author: string;
    publisher: string;
    time: string; // ISO string
    url: string;
    image?: string;
}

interface TweetFeedProps {
    news?: NewsItem[];
    layout?: 'vertical' | 'horizontal';
    title?: string;
}

/**
 * Deterministic placeholder + client‑side fetch.
 * The server always renders the placeholder (href="#" and static text),
 * so hydration matches. After mounting we replace it with real data.
 */

const FALLBACK_NEWS: NewsItem[] = [
    {
        id: 'sys-1',
        headline: 'System Intelligence: Monitoring real-time tick feeds across all major exchanges.',
        author: 'System',
        publisher: 'PRISM',
        time: new Date().toISOString(),
        url: '#'
    },
    {
        id: 'sys-2',
        headline: 'Market Scanner Active: Tracking unusual volume and volatility spikes.',
        author: 'System',
        publisher: 'SENTINEL',
        time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        url: '#'
    },
    {
        id: 'sys-3',
        headline: 'Sector Analysis: Tech and Energy sectors showing elevated pre-market momentum.',
        author: 'System',
        publisher: 'ALPHA',
        time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        url: '#'
    }
];

export function TweetFeed({
    news = [],
    layout = 'vertical',
    title = 'Latest Tweets',
}: TweetFeedProps) {
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<NewsItem[]>(news);
    const [loading, setLoading] = useState(true);

    // ---------- client‑only effect ----------
    useEffect(() => {
        setMounted(true);
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/tweets/latest');
                if (!res.ok) throw new Error('Network error');
                const data: NewsItem[] = await res.json();
                if (data && data.length > 0) {
                    setItems(data);
                } else {
                    setItems(FALLBACK_NEWS);
                }
            } catch (e) {
                console.warn('TweetFeed fetch failed', e);
                setItems(FALLBACK_NEWS);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    // ---------- helper for relative time ----------
    const formatTime = (utc: string) => {
        if (!mounted) return '...'; // placeholder for SSR
        const diffMs = Date.now() - new Date(utc).getTime();
        const mins = Math.round(diffMs / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.round(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.round(hrs / 24)}d ago`;
    };

    const ContainerClasses = 'h-full flex flex-col bg-transparent';

    const ContentClasses =
        layout === 'vertical'
            ? 'flex-1 overflow-y-auto custom-scrollbar p-0 divide-y divide-[var(--border-color)]'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-[var(--border-color)] p-0';

    return (
        <div className={ContainerClasses}>
            {/* Header Removed - Managed by Dashboard Title */}

            {/* Content */}
            <div className={ContentClasses}>
                {items.length === 0 ? (
                    <div className="flex items-center justify-center h-full w-full text-[var(--text-tertiary)] text-[11px] uppercase font-bold tracking-widest italic opacity-60">
                        {loading ? 'Initializing Stream...' : 'No Intelligence Data'}
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="group relative px-4 py-2 hover:bg-[var(--accent-blue)]/5 transition-colors flex items-start gap-3"
                        >
                            <div className="shrink-0 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.publisher === 'PRISM' ? 'bg-[var(--accent-green)] animate-pulse' : 'bg-[var(--accent-blue)]'}`}></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-exhibit text-[var(--accent-blue)] text-[10px] uppercase tracking-widest font-black">
                                        {item.publisher}
                                    </span>
                                    <span className="text-[9px] font-bold text-[var(--text-tertiary)] tabular-nums flex items-center gap-1 opacity-70">
                                        <Clock size={10} />
                                        {formatTime(item.time)}
                                    </span>
                                </div>
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${item.url === '#' ? 'pointer-events-none' : ''}`}>
                                    <p className="text-[var(--text-primary)] text-[12px] font-bold leading-snug group-hover:text-[var(--accent-blue)] transition-colors line-clamp-2">
                                        {item.headline}
                                    </p>
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Active Analysis Footer */}
            <div className="px-3 py-2 border-t border-[var(--border-color)] bg-gray-50 flex items-center gap-2">
                <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest opacity-60 shrink-0 hidden sm:block mr-2">
                    INTELLIGENCE
                </span>

                <div className="flex-1 relative">
                    <input
                        className="w-full bg-white border border-gray-300 rounded pl-2.5 pr-2 py-1.5 text-[10px] font-bold text-[var(--text-primary)] uppercase focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/20 outline-none transition-all placeholder:text-[var(--text-tertiary)]/50 shadow-sm"
                        placeholder="SEARCH TICKER..."
                        id="news-ticker-search"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.toUpperCase() || 'SPY';
                                window.open(`https://finance.yahoo.com/quote/${val}`, '_blank');
                            }
                        }}
                    />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => {
                            const input = document.getElementById('news-ticker-search') as HTMLInputElement;
                            const val = input?.value?.toUpperCase() || 'SPY';
                            window.open(`https://finance.yahoo.com/quote/${val}`, '_blank');
                        }}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] text-[9px] font-extrabold text-[var(--text-secondary)] transition-all uppercase tracking-normal flex items-center gap-1 shadow-sm whitespace-nowrap"
                        title="Search on Yahoo Finance"
                    >
                        YHO <ExternalLink size={10} className="opacity-50" />
                    </button>
                    <button
                        onClick={() => {
                            const input = document.getElementById('news-ticker-search') as HTMLInputElement;
                            const val = input?.value?.toUpperCase() || 'SPY';
                            window.open(`https://www.cnbc.com/quotes/${val}`, '_blank');
                        }}
                        className="px-2 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] text-[9px] font-extrabold text-[var(--text-secondary)] transition-all uppercase tracking-normal flex items-center gap-1 shadow-sm whitespace-nowrap"
                        title="Search on CNBC"
                    >
                        CNBC <ExternalLink size={10} className="opacity-50" />
                    </button>
                </div>
            </div>
        </div>
    );
}

