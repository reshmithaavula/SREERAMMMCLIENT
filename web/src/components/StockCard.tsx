import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StockCardProps {
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
}

export default function StockCard({ ticker, price, change, changePercent }: StockCardProps) {
    const isPositive = change >= 0;
    const Icon = isPositive ? ArrowUp : ArrowDown;
    const accentColor = isPositive ? 'text-[#00ff9d]' : 'text-[#ff4d4d]';
    // More subtle background with glass effect
    const bgClass = isPositive ? 'bg-[#00ff9d]/5 border-[#00ff9d]/10' : 'bg-[#ff4d4d]/5 border-[#ff4d4d]/10';

    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm p-5 hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex justify-between items-start mb-3">
                <span className="text-xl font-bold text-gray-100 tracking-tight drop-shadow-sm">{ticker}</span>
                <div className={`p-1.5 rounded-lg ${bgClass}`}>
                    <Icon className={`w-4 h-4 ${accentColor}`} />
                </div>
            </div>

            <div className="relative">
                <div className="text-2xl font-bold text-gray-100 mb-1 tracking-tight">
                    ${price.toFixed(2)}
                </div>
                <div className={`flex items-center gap-2 font-mono text-xs font-semibold ${accentColor}`}>
                    <span>{change > 0 ? '+' : ''}{change.toFixed(2)}</span>
                    <span className={`px-1.5 py-0.5 rounded border ${bgClass} bg-opacity-20`}>
                        {changePercent.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
