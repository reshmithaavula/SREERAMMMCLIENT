'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
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
                <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️ Error</h1>
                <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'normal' }}>
                    Something went wrong!
                </h2>
                <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '30px' }}>
                    Don't worry, we're working on it. Try refreshing the page.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            // Clear potentially corrupted data
                            try {
                                if (typeof window !== 'undefined') {
                                    localStorage.removeItem('userHoldings');
                                    localStorage.removeItem('lastMarketQuotes');
                                }
                            } catch (e) {
                                console.error('Could not clear localStorage:', e);
                            }
                            reset();
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
                        🔄 Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: '2px solid white',
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
                        🏠 Go Home
                    </button>
                </div>
                {error && (
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
                            marginTop: '10px',
                            textAlign: 'left'
                        }}>
                            {error.message || error.toString()}
                            {error.digest && `\nError ID: ${error.digest}`}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
