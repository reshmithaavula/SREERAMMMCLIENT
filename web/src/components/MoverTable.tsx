import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Mover {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    openPrice?: number;
    common_flag?: number;
}

interface MoverTableProps {
    title: string;
    movers: Mover[];
    type: 'gainer' | 'loser';
}

export function MoverTable({ title, movers, type }: MoverTableProps) {
    const isGainer = type === 'gainer';
    const accentColor = isGainer ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]';
    const Icon = isGainer ? ArrowUp : ArrowDown;

    // Ensure unique tickers
    const uniqueMovers: Mover[] = [];
    const seen = new Set();
    for (const m of movers) {
        if (!seen.has(m.ticker)) {
            seen.add(m.ticker);
            uniqueMovers.push(m);
        }
    }

    return (
        <div className="h-full border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--card-bg)] flex flex-col">
            <div className={`px-4 py-3 border-b border-[var(--border-color)] flex justify-between items-center shrink-0 ${isGainer ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${accentColor}`} />
                    <h3 className="font-bold uppercase tracking-[0.1em] text-[10px] text-[var(--text-primary)]">{title}</h3>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${isGainer ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]'} animate-pulse`}></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs border-collapse table-fixed">
                    <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] z-10">
                        <tr>
                            <th className="text-left px-3 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[65px]">
                                TICKER
                            </th>
                            <th className="text-right px-2 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[100px]">
                                PRICE
                            </th>
                            <th className="text-right px-2 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[90px]">
                                OCHG %
                            </th>
                            <th className="text-right px-3 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)]">
                                DAY %
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {uniqueMovers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-[var(--text-tertiary)] italic font-bold uppercase tracking-widest opacity-40">
                                    -- Waiting for Market Criteria --
                                </td>
                            </tr>
                        ) : (
                            uniqueMovers.map((m, idx) => {
                                const oChg = m.openPrice ? ((m.price - m.openPrice) / m.openPrice) * 100 : 0;
                                return (
                                    <tr
                                        key={`${m.ticker}-${type}-${idx}`}
                                        className="hover:bg-gray-50/50 transition-colors border-b border-[var(--border-color)]"
                                    >
                                        <td className="px-3 py-4 w-[65px]">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-[var(--text-primary)] text-[14px]">
                                                    {m.ticker}
                                                </span>
                                                {m.common_flag === 1 && (
                                                    <span className="text-[9px] text-yellow-500 font-bold" title="Common Mover (Multiple Timeframes)">★</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-2 py-4 text-right w-[100px]">
                                            <span className="font-bold text-[var(--text-primary)] text-[14px] tabular-nums">
                                                ${(m.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4 text-right w-[90px]">
                                            <span className={`font-bold tabular-nums text-[13px] ${oChg >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                                                {m.openPrice ? (oChg > 0 ? '+' : '') + oChg.toFixed(2) + '%' : '--'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4 text-right">
                                            <span className={`font-bold tabular-nums text-[14px] ${m.changePercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                                                {m.changePercent > 0 ? '+' : ''}{(m.changePercent || 0).toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
