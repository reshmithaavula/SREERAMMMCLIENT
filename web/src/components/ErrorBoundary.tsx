'use client';

import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        padding: '40px',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️ Oops!</h1>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'normal' }}>
                            Something went wrong
                        </h2>
                        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '30px' }}>
                            The application encountered an unexpected error. Don't worry, your data is safe!
                        </p>
                        <button
                            onClick={() => {
                                // Clear potentially corrupted localStorage
                                try {
                                    localStorage.removeItem('userHoldings');
                                    localStorage.removeItem('lastMarketQuotes');
                                } catch (e) {
                                    console.error('Could not clear localStorage:', e);
                                }
                                // Reload the page
                                window.location.reload();
                            }}
                            style={{
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                padding: '15px 30px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            🔄 Refresh & Try Again
                        </button>
                        {this.state.error && (
                            <details style={{ marginTop: '30px', textAlign: 'left' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '14px', opacity: 0.8 }}>
                                    Technical Details
                                </summary>
                                <pre style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    marginTop: '10px'
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
