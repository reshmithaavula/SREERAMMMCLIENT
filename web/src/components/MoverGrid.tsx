import React, { useState } from 'react';
import { MoverList } from './MoverList';

interface MoverValues {
    rippers: any[];
    dippers: any[];
}

interface MoverData {
    m1: MoverValues;
    m5: MoverValues;
    m30: MoverValues;
    day: MoverValues;
}

interface MoverGridProps {
    data: MoverData | null;
}

type TabKey = 'm1' | 'm5' | 'm30' | 'day';

export function MoverGrid({ data }: MoverGridProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('m1');

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full opacity-70 gap-3">
                <div className="animate-pulse text-sm font-bold tracking-wider text-[var(--accent-blue)]">
                    ⚡ Syncing Market Data...
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-black">
                    Establishing Feed Link
                </div>
            </div>
        );
    }

    const tabs: { key: TabKey; label: string }[] = [
        { key: 'm1', label: '1 Min' },
        { key: 'm5', label: '5 Min' },
        { key: 'm30', label: '30 Min' },
        { key: 'day', label: 'Daily' },
    ];

    const currentData = data[activeTab];

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 p-1 bg-[var(--background)] border border-[var(--border-color)] rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-5 py-2.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.key
                            ? 'text-white bg-[var(--accent-blue)] shadow-md'
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/[0.03]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-auto">
                <div className="min-h-0">
                    <MoverList
                        title={`${activeTab.toUpperCase()} Ripper Feed`}
                        movers={(currentData?.rippers || []).slice(0, 6)}
                        type="gainer"
                    />
                </div>
                <div className="min-h-0">
                    <MoverList
                        title={`${activeTab.toUpperCase()} Dipper Feed`}
                        movers={(currentData?.dippers || []).slice(0, 6)}
                        type="loser"
                    />
                </div>
            </div>
        </div>
    );
}
