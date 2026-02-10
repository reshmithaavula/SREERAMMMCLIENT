'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import styles from '@/app/page.module.css';
import { safeSetItem } from '@/lib/storage-utils';
import {
    Settings,
    Activity,
    ShieldCheck,
    Database,
    Globe,
    ArrowLeft,
    Save,
    Download,
    CheckCircle2,
    RefreshCw,
    BarChart3,
    Cpu,
    LogOut,
    ImageIcon,
    Users,
    UserPlus
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const REFRESH_INTERVALS = [
    { label: 'Ultra-Live', value: 1 },
    { label: '9s Sync', value: 9 },
    { label: '15s Sync', value: 15 },
    { label: '30s Sync', value: 30 },
    { label: '1m Sync', value: 60 },
    { label: 'Manual', value: 0 },
];

const CURRENCIES = [
    { label: 'United States Dollar (USD)', value: '$' },
    { label: 'Euro (EUR)', value: '€' },
    { label: 'British Pound (GBP)', value: '£' },
    { label: 'Japanese Yen (JPY)', value: '¥' },
];

export default function SettingsPage() {
    const [refreshInterval, setRefreshInterval] = useState(30);
    const [decimals, setDecimals] = useState(2);
    const [currency, setCurrency] = useState('$');
    const [saved, setSaved] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [promoteEmail, setPromoteEmail] = useState('');
    const [mounted, setMounted] = useState(false);
    const { data: session } = useSession();

    useEffect(() => {
        setMounted(true);
        const savedInterval = typeof window !== 'undefined' ? localStorage.getItem('refreshInterval') : null;
        const savedDecimals = typeof window !== 'undefined' ? localStorage.getItem('displayDecimals') : null;
        const savedCurrency = typeof window !== 'undefined' ? localStorage.getItem('displayCurrency') : null;

        if (savedInterval) {
            const parsed = parseInt(savedInterval);
            if (!isNaN(parsed)) setRefreshInterval(parsed);
        }

        if (savedDecimals) {
            const parsed = parseInt(savedDecimals);
            if (!isNaN(parsed)) setDecimals(parsed);
        }

        if (savedCurrency && savedCurrency !== 'undefined') {
            setCurrency(savedCurrency);
        }

        if ((session?.user as any)?.role === 'owner') {
            fetchUsers();
        }
    }, [session]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) { console.error("Failed to fetch users"); }
    };

    const updateUserRole = async (userId: number | null, newRole: string, email?: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole, email })
            });
            if (res.ok) {
                fetchUsers();
                setPromoteEmail('');
            } else {
                const err = await res.json();
                alert(err.error || "Failed to update user");
            }
        } catch (e) { console.error("Failed to update user"); }
    };

    const handleSave = () => {
        safeSetItem('refreshInterval', refreshInterval.toString());
        safeSetItem('displayDecimals', decimals.toString());
        safeSetItem('displayCurrency', currency);

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExportImage = () => {
        const holdingsStr = localStorage.getItem('userHoldings');
        const quotesStr = localStorage.getItem('lastMarketQuotes');
        if (!holdingsStr) return alert("No portfolio data to export.");

        try {
            const rawHoldings = JSON.parse(holdingsStr);
            const quotes = quotesStr ? JSON.parse(quotesStr) : {};

            const holdingsArray = Array.isArray(rawHoldings)
                ? rawHoldings
                : Object.entries(rawHoldings).map(([ticker, data]: [string, any]) => ({ ticker, ...data }));

            if (holdingsArray.length === 0) return alert("Portfolio is empty.");

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const rowHeight = 55;
            const headerHeight = 140;
            const footerHeight = 100;
            const rowCount = holdingsArray.length;

            // Wider canvas for whole info
            canvas.width = 1100;
            canvas.height = headerHeight + (rowCount * rowHeight) + footerHeight;

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Modern Gradient Header
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#0f172a');
            gradient.addColorStop(1, '#1e293b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, 120);

            // Brand Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('💰 My Portfolio', 40, 65);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('COMPREHENSIVE ASSET INTEL REPORT', 42, 90);

            // Date
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
            ctx.fillText(dateStr.toUpperCase(), canvas.width - 280, 70);

            // Operator Info
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`ACCOUNT: ${session?.user?.email || 'OFFLINE'}`.toUpperCase(), canvas.width - 280, 95);

            // Table Header 
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 120, canvas.width, 50);

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(canvas.width, 170); ctx.stroke();

            // Headers
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 12px sans-serif';
            const headers = ['ASSET', 'QTY', 'ENTRY', 'MARKET', 'EQUITY', 'P&L', 'CHANGE'];
            const xPos = [50, 180, 310, 440, 580, 750, 920];
            headers.forEach((h, i) => ctx.fillText(h, xPos[i], 152));

            // Logic for Calculations
            let totalValue = 0;
            let totalCost = 0;
            let currentY = 210;

            holdingsArray.forEach((item: any, index: number) => {
                const ticker = (item.ticker || item.symbol || '').toUpperCase();
                const qty = Number(item.shares || item.Position || 0);
                const entry = Number(item.avgPrice || item.price || 0);
                const quote = quotes[ticker] || { price: entry, change_percent: 0 };
                const market = Number(quote.price || entry);

                const value = qty * market;
                const cost = qty * entry;
                const pnl = value - cost;
                const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                totalValue += value;
                totalCost += cost;

                // Zebra
                if (index % 2 === 1) {
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(0, currentY - 35, canvas.width, rowHeight);
                }

                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = '#0f172a';
                ctx.fillText(ticker, 50, currentY);

                ctx.font = '15px sans-serif';
                ctx.fillStyle = '#334155';
                ctx.fillText(qty.toLocaleString(), 180, currentY);
                ctx.fillText(`${currency}${entry.toFixed(2)}`, 310, currentY);
                ctx.fillText(`${currency}${market.toFixed(2)}`, 440, currentY);
                ctx.fillText(`${currency}${value.toFixed(2)}`, 580, currentY);

                // P&L Color
                ctx.font = 'bold 15px sans-serif';
                ctx.fillStyle = pnl >= 0 ? '#10b981' : '#ef4444';
                ctx.fillText(`${pnl >= 0 ? '+' : ''}${currency}${pnl.toFixed(2)}`, 750, currentY);

                ctx.font = 'bold 13px sans-serif';
                ctx.fillText(`${pnl >= 0 ? '▲' : '▼'} ${Math.abs(pnlPercent).toFixed(2)}%`, 920, currentY);

                currentY += rowHeight;
            });

            // Summary Bar
            const totalPnl = totalValue - totalCost;
            const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('TOTAL NET EQUITY', 50, canvas.height - 55);
            ctx.fillText('TOTAL P&L SUMMARY', 400, canvas.height - 55);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(`${currency}${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 50, canvas.height - 25);

            ctx.fillStyle = totalPnl >= 0 ? '#10b981' : '#ef4444';
            ctx.fillText(`${totalPnl >= 0 ? '+' : ''}${currency}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${totalPnlPercent.toFixed(2)}%)`, 400, canvas.height - 25);

            // Branding Footer
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('STOCKTRACK CORE TERMINAL', canvas.width - 220, canvas.height - 30);

            // Export
            const link = document.createElement('a');
            link.download = `Full_Portfolio_Analysis_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error(error);
            alert("Failed to render comprehensive report.");
        }
    };

    const handleExport = () => {
        const holdings = localStorage.getItem('userHoldings');
        if (!holdings) return alert("No portfolio data to export.");

        const blob = new Blob([holdings], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stocktrack-portfolio-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };


    return (
        <div className="max-w-[100%] mx-auto px-6 py-6 space-y-4">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--card-bg)] p-6 rounded-lg border border-[var(--border-color)] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--accent-blue)]/10 rounded-lg">
                        <Settings className="w-6 h-6 text-[var(--accent-blue)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">System Configuration</h1>
                        <p className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider mt-1">Terminal Environment Settings</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 lg:flex-none px-4 py-2 bg-white border border-[var(--border-color)] hover:border-[var(--text-tertiary)] rounded text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex-1 lg:flex-none px-6 py-2 rounded font-bold uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 active:scale-95 border-b-2 ${saved
                            ? 'bg-[var(--accent-green)] text-white border-green-700'
                            : 'bg-[var(--accent-blue)] hover:bg-blue-700 text-white border-blue-900'
                            }`}
                    >
                        {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {saved ? 'UPDATED' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Primary Preferences */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="!p-6 border-[var(--border-color)] shadow-sm relative overflow-hidden bg-white">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                            <Activity className="w-5 h-5 text-[var(--accent-blue)]" />
                            <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Engine Control</h2>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <RefreshCw className="w-4 h-4 text-[var(--text-tertiary)]" />
                                    <h3 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Sync Frequency</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {REFRESH_INTERVALS.map(interval => (
                                        <button
                                            key={interval.value}
                                            onClick={() => setRefreshInterval(interval.value)}
                                            className={`py-3 px-2 rounded border text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${refreshInterval === interval.value
                                                ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white shadow-sm'
                                                : 'bg-gray-50 border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                                                }`}
                                        >
                                            {interval.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)]">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        <h3 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Currency</h3>
                                    </div>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-white border border-[var(--border-color)] hover:border-[var(--accent-blue)] rounded px-4 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] outline-none transition-all cursor-pointer"
                                    >
                                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        <h3 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Precision</h3>
                                    </div>
                                    <select
                                        value={decimals}
                                        onChange={(e) => setDecimals(parseInt(e.target.value))}
                                        className="w-full bg-white border border-[var(--border-color)] hover:border-[var(--accent-blue)] rounded px-4 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] outline-none transition-all cursor-pointer"
                                    >
                                        <option value={2}>Standard (2.00)</option>
                                        <option value={3}>Institutional (2.000)</option>
                                        <option value={4}>Quantitative (2.0000)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {(session?.user as any)?.role === 'owner' && (
                        <Card className="!p-6 border-[var(--border-color)] shadow-sm bg-white">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                                <Users className="w-5 h-5 text-[var(--accent-blue)]" />
                                <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Team Management</h2>
                            </div>

                            {/* Direct Email Promotion */}
                            <div className="mb-6 flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter collaborator email..."
                                    value={promoteEmail}
                                    onChange={(e) => setPromoteEmail(e.target.value)}
                                    className="flex-1 bg-gray-50 border border-[var(--border-color)] rounded px-4 py-2 text-xs font-semibold focus:border-[var(--accent-blue)] outline-none"
                                />
                                <button
                                    onClick={() => promoteEmail && updateUserRole(null, 'owner', promoteEmail)}
                                    className="bg-[var(--accent-blue)] text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Add Owner
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {users.length > 0 ? (
                                    users.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-3 rounded bg-white border border-[var(--border-color)] transition-all hover:border-[var(--accent-blue)] shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-900 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                                                    {u.name?.[0].toUpperCase() || u.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{u.name || 'Anonymous'}</p>
                                                    <p className="text-[10px] text-[var(--text-tertiary)] font-semibold">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-b-2 ${u.role === 'owner'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                                                    : 'bg-gray-100 text-gray-500 border-gray-300'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                                {u.id.toString() !== (session?.user as any)?.id && (
                                                    <button
                                                        onClick={() => updateUserRole(u.id, u.role === 'owner' ? 'user' : 'owner')}
                                                        className={`p-2 rounded hover:bg-gray-100 transition-all active:scale-90 ${u.role === 'owner'
                                                            ? 'text-red-500'
                                                            : 'text-amber-500'
                                                            }`}
                                                        title={u.role === 'owner' ? "Demote to User" : "Promote to Owner"}
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 opacity-30 italic text-[11px] uppercase tracking-widest">Scanning Personnel...</div>
                                )}
                            </div>
                        </Card>
                    )}

                    <Card className="!p-6 border-[var(--border-color)] shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-5 h-5 text-[var(--accent-blue)]" />
                            <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Data Management</h2>
                        </div>
                        <p className="text-[13px] text-[var(--text-tertiary)] font-medium mb-6 leading-relaxed">
                            Watchlists and terminal configurations are stored locally on this machine for maximum performance.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleExportImage}
                                className="px-6 py-3 bg-[var(--accent-blue)] text-white border-b-2 border-blue-900 rounded hover:bg-blue-700 transition-all text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <ImageIcon className="w-4 h-4" /> Snap Portfolio (.PNG)
                            </button>

                            <button
                                onClick={handleExport}
                                className="px-6 py-3 bg-white border border-[var(--border-color)] rounded hover:bg-gray-50 transition-all text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 text-[var(--text-primary)]"
                            >
                                <Download className="w-4 h-4 text-[var(--accent-blue)]" /> Export Portfolio (.JSON)
                            </button>

                            {session && (
                                <button
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="px-6 py-3 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-all text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 text-red-600"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out of System
                                </button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Status Column */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="!p-6 border-[var(--border-color)] shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                            <Cpu className="w-5 h-5 text-[var(--accent-blue)]" />
                            <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">System Status</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-[var(--accent-blue)]/5 p-4 rounded border border-[var(--accent-blue)]/10">
                                <span className="text-[var(--text-primary)] font-bold text-[11px] uppercase tracking-wider">Polygon Feed</span>
                                <span className="text-[var(--accent-green)] text-[11px] font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse" /> ONLINE
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded bg-gray-50 border border-[var(--border-color)]">
                                <span className="text-[var(--text-tertiary)] font-bold text-[11px] uppercase tracking-wider">SQL Memory</span>
                                <span className="text-[var(--accent-blue)] text-[11px] font-bold">READY</span>
                            </div>
                            <div className="flex justify-between items-center p-4 rounded bg-gray-50 border border-[var(--border-color)]">
                                <span className="text-[var(--text-tertiary)] font-bold text-[11px] uppercase tracking-wider">AI Intelligence</span>
                                <span className="text-[var(--accent-green)] text-[11px] font-bold uppercase">Active</span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-[var(--border-color)] space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-[var(--text-tertiary)]">Local Cache Pool</span>
                                    <span className="text-[var(--text-primary)] tabular-nums font-mono">
                                        {mounted ? (JSON.stringify(localStorage).length / 1024).toFixed(1) : '0.0'} KB
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-[var(--accent-blue)] h-full w-[15%] rounded-full" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="!p-6 border-[var(--border-color)] shadow-sm bg-white relative group overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-5 h-5 text-[var(--text-tertiary)]" />
                            <h2 className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Core Engine</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[14px] font-bold text-[var(--text-primary)] uppercase tracking-tight">StockTrack Pro v1.2</p>
                                <p className="text-[10px] font-bold text-[var(--accent-blue)] tracking-widest uppercase">Institutional Hub</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded border border-[var(--border-color)]">
                                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed font-semibold italic opacity-80">
                                    "Aggregating distributed market signals for high-frequency technical execution."
                                </p>
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest pt-4 border-t border-[var(--border-color)]">
                                <span>REL: CORE_01</span>
                                <span>BUILD 2025.12</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
