'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import styles from '@/app/page.module.css';
import { Play, Square, Save, RefreshCw, Twitter, Shield, Activity } from 'lucide-react';

export default function AutomationPage() {
    const [status, setStatus] = useState<any>({ status: 'Loading...', lastLog: '', lastUpdate: '' });
    const [config, setConfig] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/automation/bot');
            const data = await res.json();
            if (data.status) setStatus(data.status);
            if (data.config) setConfig(data.config);
        } catch (e) {
            console.error('Failed to fetch bot data');
        } finally {
            setLoading(false);
        }
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch('/api/automation/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateConfig', ...config })
            });
            alert('Configuration saved! (Bot will use these on next login or restart)');
        } catch (e) {
            alert('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleStopBot = async () => {
        if (!confirm('Are you sure you want to stop the bot?')) return;
        try {
            await fetch('/api/automation/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            fetchData();
        } catch (e) {
            alert('Failed to stop bot');
        }
    };

    const getStatusColor = () => {
        switch (status.status) {
            case 'Running': return '#10b981';
            case 'Sleeping': return '#3b82f6';
            case 'Cycle Finished': return '#10b981';
            case 'Stopped': return '#ef4444';
            default: return '#f59e0b';
        }
    };

    return (
        <div className={styles.dashboard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 className={styles.title}>Automation Hub</h1>
                    <p className={styles.subtitle}>Manage your X (Twitter) posting bot & automation tasks</p>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(),
                        boxShadow: `0 0 10px ${getStatusColor()}`
                    }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{status.status}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Live Bot Status">
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Activity</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Last Update: {status.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString() : 'N/A'}
                                </span>
                            </div>
                            <div style={{
                                backgroundColor: 'var(--background)',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                minHeight: '100px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <div style={{ marginRight: '20px', color: getStatusColor() }}>
                                    <Activity size={32} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '4px' }}>
                                        {status.lastLog || 'Initializing engine...'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {status.status === 'Sleeping' ? 'The bot is waiting for the next market move.' : 'Process is active and monitoring markets.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                flex: 1,
                                padding: '20px',
                                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                borderRadius: '12px',
                                border: '1px solid rgba(16, 185, 129, 0.1)'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#10b981' }}>Posts Today</h4>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{status.tweetCount || 0}</div>
                            </div>
                            <div style={{
                                flex: 1,
                                padding: '20px',
                                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                borderRadius: '12px',
                                border: '1px solid rgba(59, 130, 246, 0.1)'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#3b82f6' }}>Engine Health</h4>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Optimal</div>
                            </div>
                            <div style={{
                                flex: 2,
                                padding: '12px 20px',
                                backgroundColor: 'var(--background)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Process ID</div>
                                    <div style={{ fontWeight: '600' }}>{status.pid || '---'}</div>
                                </div>
                                <button
                                    onClick={handleStopBot}
                                    disabled={status.status === 'Stopped'}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: status.status === 'Stopped' ? 0.5 : 1
                                    }}
                                >
                                    <Square size={16} /> Stop Bot
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card title="Account Integration">
                        <form onSubmit={handleSaveConfig}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Twitter Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <Twitter size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="text"
                                            value={config.username}
                                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                            placeholder="@username"
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 40px',
                                                backgroundColor: 'var(--background)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                color: 'white'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Twitter Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input
                                            type="password"
                                            value={config.password}
                                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 40px',
                                                backgroundColor: 'var(--background)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                color: 'white'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: 'var(--accent-green)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                {saving ? <RefreshCw className={styles.spinning} size={20} /> : <Save size={20} />}
                                {saving ? 'Saving...' : 'Update Credentials'}
                            </button>
                        </form>
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card title="Quick Actions">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={() => window.open('https://twitter.com/home', '_blank')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#1DA1F2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Twitter size={18} /> Open Twitter
                            </button>
                            <div style={{ padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', fontSize: '0.85rem', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                ⚠️ <strong>Note:</strong> To start the bot, use the <code>run-bot (1).bat</code> file on your desktop. This UI allows you to monitor and configure it while running.
                            </div>
                        </div>
                    </Card>

                    <Card title="Automated Tasks">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Market Movers Updates</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Every 5 minutes</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: '#10b981', borderRadius: '4px', fontWeight: 'bold' }}>ACTIVE</div>
                            </div>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sector Performance</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily at Market Close</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 'bold' }}>QUEUED</div>
                            </div>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Penny Stock Alerts</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>On 5% Spikes</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', fontWeight: 'bold' }}>OFF</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
