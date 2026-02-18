'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StockChartIcon, TrendingUpIcon, ShieldCheckIcon } from '@/components/Icons'; // Assuming these don't exist, I'll use placeholders or simple SVGs

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
            <div className="w-full max-max-w-md animate-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-blue)] text-white mb-4 shadow-lg shadow-blue-500/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">StockTrack</h1>
                    <p className="text-[var(--text-tertiary)] mt-2">Sign in to manage your portfolio</p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-8 rounded-2xl shadow-xl border border-[var(--border-color)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium animate-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent outline-none transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Password</label>
                                <a href="#" className="text-xs font-bold text-[var(--accent-blue)] hover:underline">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[var(--accent-blue)] hover:brightness-110 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">
                            Don't have an account?{' '}
                            <a href="#" className="font-bold text-[var(--accent-blue)] hover:underline">Sign up for free</a>
                        </p>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 text-[var(--text-tertiary)] mb-1">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Live Data</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 text-[var(--text-tertiary)] mb-1">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Secure</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 text-[var(--text-tertiary)] mb-1">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Fast</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
