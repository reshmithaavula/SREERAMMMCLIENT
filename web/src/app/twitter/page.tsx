'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import styles from '@/app/page.module.css';
import { Copy, CheckCircle } from 'lucide-react';

export default function TwitterPage() {
    const [tweetContent, setTweetContent] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    const generateTweet = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/twitter');
            const data = await response.json();
            setTweetContent(data.tweet);
        } catch (error) {
            console.error('Error generating tweet:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        generateTweet();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tweetContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.title}>Twitter Content Generator</h1>
            <p className={styles.subtitle}>Auto-generated market updates for X (Twitter)</p>

            <section className={styles.section}>
                <Card title="Generated Tweet">
                    <div style={{
                        backgroundColor: 'var(--background)',
                        padding: '20px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '20px',
                        minHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                    }}>
                        {tweetContent || 'Loading...'}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={generateTweet}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: 'var(--accent-green)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: loading ? 0.5 : 1
                            }}
                        >
                            {loading ? 'Generating...' : '🔄 Regenerate'}
                        </button>

                        <button
                            onClick={copyToClipboard}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: copied ? 'var(--accent-green)' : 'var(--card-bg)',
                                color: 'white',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle size={20} /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={20} /> Copy to Clipboard
                                </>
                            )}
                        </button>
                    </div>

                    <div style={{
                        marginTop: '20px',
                        padding: '12px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                    }}>
                        💡 <strong>Tip:</strong> This tweet is auto-generated based on real-time market data.
                        Copy and paste directly to your X (Twitter) account!
                    </div>
                </Card>
            </section>
        </div>
    );
}
