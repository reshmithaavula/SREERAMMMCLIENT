'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Twitter, Settings, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from '@/app/page.module.css';

interface BotStats {
    tweetCount: number;
    lastTweet: string | null;
    status: string;
    lastLog: string;
    isActive: boolean;
}

export function BotStatus({ stats }: { stats: BotStats }) {
    const { data: session } = useSession();
    const isOwner = (session?.user as any)?.role === 'owner';
    const [isEditing, setIsEditing] = useState(false);
    const [config, setConfig] = useState({ username: '', password: '' });
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (isEditing) {
            fetch('/api/bot/config')
                .then(res => res.json())
                .then(data => setConfig(data))
                .catch(err => console.error('Failed to load bot config:', err));
        }
    }, [isEditing]);

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            const res = await fetch('/api/bot/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => {
                    setSaveStatus('idle');
                    setIsEditing(false);
                }, 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (e) {
            setSaveStatus('error');
        }
    };

    const statusColor = stats.status === 'Running' ? 'text-green-500' :
        stats.status === 'Sleeping' ? 'text-blue-500' : 'text-gray-400';

    return (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-full shadow-sm">
            <div className="flex items-center gap-2 border-r border-[var(--border-color)] pr-3">
                <Twitter className={`w-3.5 h-3.5 ${stats.isActive ? 'text-[#1DA1F2]' : 'text-gray-400'}`} />
                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">
                    X-BOT: <span className={statusColor}>{stats.status}</span>
                </span>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <span className="text-[var(--text-tertiary)] text-[9px]">DAILY POSTS:</span>
                    <span className="text-[var(--accent-blue)]">{stats.tweetCount}</span>
                </div>

                {stats.lastLog && (
                    <div className="hidden md:flex items-center gap-1.5">
                        <span className="text-[var(--text-tertiary)] text-[9px]">LAST ACTION:</span>
                        <span className="text-[var(--text-secondary)] lowercase italic">{stats.lastLog}</span>
                    </div>
                )}
            </div>

            {isOwner && (
                <>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Bot Settings"
                    >
                        <Settings className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    </button>

                    {isEditing && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-[var(--border-color)] bg-[var(--card-bg-alt)]">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Twitter className="text-[#1DA1F2]" />
                                        Twitter Bot Configuration
                                    </h3>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Configure automation credentials</p>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Twitter Username / Email</label>
                                        <input
                                            type="text"
                                            value={config.username}
                                            onChange={e => setConfig({ ...config, username: e.target.value })}
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="@username"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">Password</label>
                                        <input
                                            type="password"
                                            value={config.password}
                                            onChange={e => setConfig({ ...config, password: e.target.value })}
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                                        <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                            Changes take effect on the next bot cycle (5 min). Ensure 2FA is handled if prompted on first login.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-[var(--card-bg-alt)] border-t border-[var(--border-color)] flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saveStatus === 'saving'}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-2"
                                    >
                                        {saveStatus === 'saving' ? 'Saving...' : (
                                            <>
                                                <Save className="w-3.5 h-3.5" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>

                                {saveStatus === 'success' && (
                                    <div className="absolute top-0 left-0 w-full p-2 bg-green-500 text-white text-[10px] font-bold text-center animate-in slide-in-from-top duration-300">
                                        <CheckCircle2 className="w-3 h-3 inline mr-1" /> SETTINGS UPDATED SUCCESSFULLY
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
