'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        padding: '50px',
                        borderRadius: '20px',
                        maxWidth: '700px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                        <h1 style={{ fontSize: '64px', marginBottom: '20px' }}>💥</h1>
                        <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: 'bold' }}>
                            Critical Error
                        </h2>
                        <p style={{ fontSize: '18px', opacity: 0.95, marginBottom: '30px', lineHeight: 1.6 }}>
                            The application encountered a critical error and needs to restart.
                            This is usually caused by corrupted data or a temporary issue.
                        </p>
                        <button
                            onClick={() => {
                                // Clear all potentially corrupted data
                                try {
                                    if (typeof window !== 'undefined') {
                                        localStorage.clear();
                                        sessionStorage.clear();
                                    }
                                } catch (e) {
                                    console.error('Could not clear storage:', e);
                                }
                                // Force full page reload
                                window.location.href = '/';
                            }}
                            style={{
                                background: 'white',
                                color: '#f5576c',
                                border: 'none',
                                padding: '18px 40px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                            }}
                        >
                            🔄 Restart Application
                        </button>
                        {error && (
                            <details style={{ marginTop: '40px', textAlign: 'left' }}>
                                <summary style={{
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    opacity: 0.8,
                                    padding: '10px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px'
                                }}>
                                    🔍 View Technical Details
                                </summary>
                                <pre style={{
                                    background: 'rgba(0, 0, 0, 0.4)',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    overflow: 'auto',
                                    marginTop: '15px',
                                    maxHeight: '200px'
                                }}>
                                    {error.message || error.toString()}
                                    {error.digest && `\n\nError ID: ${error.digest}`}
                                    {error.stack && `\n\nStack Trace:\n${error.stack}`}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
