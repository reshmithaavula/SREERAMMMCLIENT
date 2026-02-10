import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Mover {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
}

interface MoverListProps {
    title: string;
    movers: Mover[];
    type: 'gainer' | 'loser';
}

export function MoverList({ title, movers, type }: MoverListProps) {
    const isGainer = type === 'gainer';
    const accentColor = isGainer ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]';
    const Icon = isGainer ? ArrowUp : ArrowDown;

    return (
        <div className={`h-full border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--card-bg)] flex flex-col shadow-sm`}>
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--background)] shrink-0">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${accentColor}`} strokeWidth={3} />
                    <h3 className="font-bold text-[var(--text-primary)] tracking-widest uppercase text-[11px]">{title}</h3>
                </div>
                <div className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-50 uppercase tracking-tighter">
                    {movers.length} Signals
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(() => {
                        const uniqueMovers: Mover[] = [];
                        const seen = new Set();
                        for (const m of movers) {
                            if (!seen.has(m.ticker)) {
                                seen.add(m.ticker);
                                uniqueMovers.push(m);
                            }
                        }

                        return uniqueMovers.map((m, idx) => (
                            <div key={`${m.ticker}-${type}-${idx}`}
                                className="bg-[var(--background)] border border-[var(--border-color)] p-3 rounded-lg flex flex-col gap-2 hover:border-[var(--accent-blue)] transition-all shadow-sm group">
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight">{m.ticker}</span>
                                    <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${isGainer ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--accent-red)]/10 text-[var(--accent-red)]'}`}>
                                        {(m.changePercent || 0).toFixed(2)}%
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-0.5">
                                    <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums font-mono">
                                        ${m.price.toFixed(2)}
                                    </span>
                                    <span className={`text-[12px] font-bold tabular-nums font-mono ${isGainer ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                                        {m.change >= 0 ? '+' : ''}{(m.change || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
                {movers.length === 0 && (
                    <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] italic text-[11px] font-bold uppercase tracking-widest py-8">
                        -- No Active Signals --
                    </div>
                )}
            </div>
        </div>
    );
}
