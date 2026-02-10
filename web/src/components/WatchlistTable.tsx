import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Zap, Activity, Layers } from 'lucide-react';

interface WatchlistProps {
    data: any[]; // Initial data or list of tickers
}

interface MoverData {
    ticker: string;
    type: string;
    change_percent: number;
    common_flag: number;
    prev_close_gap: number;
}

export function WatchlistTable({ data: initialData }: WatchlistProps) {
    if (!initialData || initialData.length === 0) {
        return (
            <div className="border border-gray-800 rounded-xl bg-[#0a0a0a] p-4 text-center text-gray-500">
                <p>Watchlist is empty</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#0a0a0a] flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/20 flex justify-between items-center">
                <h2 className="font-bold text-gray-100 flex items-center gap-2">
                    <ListIcon className="w-4 h-4 text-blue-400" />
                    Watchlist
                </h2>
            </div>

            <div className="overflow-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900/50 text-xs text-gray-400 sticky top-0 z-10 backdrop-blur-sm uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2 font-medium">Ticker</th>
                            <th className="px-3 py-2 font-medium text-right">Last Price</th>
                            <th className="px-3 py-2 font-medium text-right">oChange %</th>
                            <th className="px-3 py-2 font-medium text-right">oPrice</th>
                            <th className="px-3 py-2 font-medium text-right">pChange %</th>
                            <th className="px-3 py-2 font-medium text-right">LastUpdate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {initialData.map((item) => {
                            // Calculations
                            const price = item.price || 0;
                            const open = item.openPrice || 0;
                            const prevClose = item.prevClose || 0;

                            // oChange % (Change since Open)
                            const oChangePercent = open !== 0 ? ((price - open) / open) * 100 : 0;

                            // pChange % (Change since Previous Close)
                            const pChangePercent = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;

                            const lastUpdateStr = item.lastUpdated
                                ? new Date(item.lastUpdated).toISOString().slice(0, 16).replace('T', ' ')
                                : '-';

                            return (
                                <tr key={item.ticker} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                    <td className="px-3 py-2.5">
                                        <div className="font-bold text-gray-200 group-hover:text-blue-400">{item.ticker}</div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-gray-300">
                                        ${price.toFixed(2)}
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-mono ${oChangePercent >= 0 ? 'text-[#00ff9d]' : 'text-[#ff4d4d]'}`}>
                                        {oChangePercent.toFixed(2)}%
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-gray-400">
                                        {open.toFixed(2)}
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-mono ${pChangePercent >= 0 ? 'text-[#00ff9d]' : 'text-[#ff4d4d]'}`}>
                                        {pChangePercent.toFixed(2)}%
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-500">
                                        {lastUpdateStr}
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

function ListIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
    )
}
