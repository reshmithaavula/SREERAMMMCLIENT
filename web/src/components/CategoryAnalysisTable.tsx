'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CategoryData {
    category: string;
    totalStocks: number;
    gainers: number;
    losers: number;
    neutral: number;
    gainersPercent: number;
    losersPercent: number;
    neutralPercent: number;
    trend: 'up' | 'down' | 'neutral';
    strength: number;
    averageChange: number;
}

interface CategoryAnalysisTableProps {
    categories: CategoryData[];
    title?: string;
    icon?: React.ReactNode;
}

export function CategoryAnalysisTable({ categories, title = "Sector Matrix", icon }: CategoryAnalysisTableProps) {
    if (!categories || categories.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                <div className="text-center">
                    <div className="animate-pulse mb-2">⚡ Analyzing Categories...</div>
                    <div className="text-xs text-gray-600">Loading category trends</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--card-bg)] flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-white/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    {icon || <TrendingUp className="w-4 h-4 text-[var(--accent-blue)]" />}
                    <h3 className="font-bold text-[var(--text-primary)] tracking-[0.05em] uppercase text-[0.75rem]">{title}</h3>
                </div>
                <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-xs border-collapse table-fixed">
                    <thead className="sticky top-0 bg-[var(--card-bg)] border-b border-[var(--border-color)] z-10">
                        <tr>
                            <th className="text-center px-2 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[40px]">
                                #
                            </th>
                            <th className="text-left px-3 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] min-w-[120px]">
                                SECTOR
                            </th>
                            <th className="text-right px-2 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[85px]">
                                AVG %
                            </th>
                            <th className="text-center px-2 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[85px]">
                                STATUS
                            </th>
                            <th className="text-right px-4 py-4 font-bold text-[var(--text-primary)] uppercase text-[0.7rem] tracking-[0.05em] border-b border-[var(--border-color)] w-[90px]">
                                G/L
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {categories.map((cat, idx) => {
                            // Robust trend determination based on actual percentage
                            const isActuallyUp = cat.averageChange > 0.005;
                            const isActuallyDown = cat.averageChange < -0.005;
                            const trendColor = isActuallyUp ? 'text-[var(--accent-green)]' : isActuallyDown ? 'text-[var(--accent-red)]' : 'text-[var(--text-tertiary)]';
                            const statusColor = isActuallyUp ? 'bg-[var(--accent-green)]' : isActuallyDown ? 'bg-[var(--accent-red)]' : 'bg-[var(--text-tertiary)]';
                            const statusLabel = isActuallyUp ? 'UP' : isActuallyDown ? 'DOWN' : 'STABLE';

                            return (
                                <tr
                                    key={`${cat.category}-${idx}`}
                                    className="hover:bg-gray-50/50 transition-colors border-b border-[var(--border-color)]"
                                >
                                    <td className="px-2 py-4 text-center w-[40px]">
                                        <span className="font-bold text-[var(--text-tertiary)] text-[13px]">{idx + 1}</span>
                                    </td>
                                    <td className="px-3 py-4 overflow-hidden">
                                        <span className="font-bold text-[var(--text-primary)] text-[14px] truncate block" title={cat.category.replace(/_/g, ' ')}>
                                            {cat.category.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 text-right w-[85px]">
                                        <span className={`font-bold tabular-nums text-[14px] ${trendColor}`}>
                                            {cat.averageChange > 0 ? '+' : ''}{(cat.averageChange || 0).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 text-center w-[85px]">
                                        <div className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] text-white ${statusColor} min-w-[50px]`}>
                                            {statusLabel}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right w-[90px]">
                                        <span className="text-[var(--text-tertiary)] font-bold text-[13px]">
                                            {cat.gainers}/{cat.losers}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
