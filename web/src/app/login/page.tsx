'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, TrendingUp, Chrome, Facebook, Apple, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import s from './login.module.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                console.log('Attempting login...');
                const res = await signIn('credentials', {
                    email: email.toLowerCase().trim(),
                    password,
                    redirect: false,
                });

                if (res?.error) {
                    console.error('Login error:', res.error);
                    if (res.error.includes('USER_NOT_FOUND')) {
                        setError('User not found. Please create an account.');
                    } else {
                        setError('Invalid email or password');
                    }
                    setLoading(false);
                } else {
                    console.log('Login successful');
                    setLoading(false);
                    router.push('/');
                    router.refresh(); // Refresh to update session state in layout
                }
            } else {
                console.log('Attempting registration...');
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim() || email.split('@')[0],
                        email: email.toLowerCase().trim(),
                        password
                    }),
                });

                const contentType = res.headers.get("content-type");
                if (!res.ok || !contentType || !contentType.includes("application/json")) {
                    setError('Server error or account exists. Please try again.');
                    setLoading(false);
                    return;
                }
                const data = await res.json();

                if (!res.ok) {
                    setError(data.message || 'Registration failed');
                    setLoading(false);
                } else {
                    console.log('Registration successful, logging in...');
                    const loginRes = await signIn('credentials', {
                        email: email.toLowerCase().trim(),
                        password,
                        redirect: false,
                    });

                    if (loginRes?.error) {
                        setError('Account created, but login failed. Please login manually.');
                        setIsLogin(true);
                        setLoading(false);
                    } else {
                        setLoading(false);
                        router.push('/');
                        router.refresh();
                    }
                }
            }
        } catch (err: any) {
            console.error('Unexpected auth error:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={s.loginContainer}>
            <div className={s.loginWrapper}>
                {/* Left Section: Branding & Graphics */}
                <div className={s.brandSection}>
                    <div className={s.dotsGrid}>
                        {[...Array(25)].map((_, i) => <div key={i} className={s.dot} />)}
                    </div>
                    <div className={s.pillShape} />
                    <div className={s.circleLarge} />
                    <div className={s.circleSmall}>
                        <div className={s.circleSmallInner} />
                    </div>

                    <div className={s.floatingDot} style={{ top: '20%', left: '10%', background: '#ff6b6b' }} />
                    <div className={s.floatingDot} style={{ bottom: '15%', right: '15%', background: '#ff9f43' }} />

                    <div className={s.contentBox}>
                        <h1 className={s.brandTitle}>
                            MASTER THE <br /> MARKETS
                        </h1>
                        <p className={s.brandSubtitle}>
                            Professional-grade tracking and real-time intelligence for the modern trader. Join our elite community.
                        </p>
                    </div>
                </div>

                {/* Right Section: Auth Form */}
                <div className={s.formSection}>
                    {/* Back button for mobile/UI convenience */}
                    <button
                        onClick={() => router.push('/')}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div className={s.logoWrapper}>
                        <div className={s.appLogo}>
                            <TrendingUp size={32} color="#d93025" strokeWidth={3} />
                        </div>
                        <h2 className={s.welcomeText}>{isLogin ? 'Welcome Back !' : 'Join the Elite'}</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className={s.inputGroup}>
                                <label className={s.label}>Full Name</label>
                                <div className={s.inputWrapper}>
                                    <User size={18} className={s.inputIcon} />
                                    <input
                                        type="text"
                                        className={s.input}
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={s.inputGroup}>
                            <label className={s.label}>Email Address</label>
                            <div className={s.inputWrapper}>
                                <Mail size={18} className={s.inputIcon} />
                                <input
                                    type="email"
                                    className={s.input}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={s.inputGroup}>
                            <label className={s.label}>Password</label>
                            <div className={s.inputWrapper}>
                                <Lock size={18} className={s.inputIcon} />
                                <input
                                    type="password"
                                    className={s.input}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className={s.inputGroup}>
                                <label className={s.label}>Confirm Password</label>
                                <div className={s.inputWrapper}>
                                    <Lock size={18} className={s.inputIcon} />
                                    <input
                                        type="password"
                                        className={s.input}
                                        placeholder="Repeat password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{ color: '#d93025', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div className={s.formOptions}>
                            <label className={s.checkboxLabel}>
                                <input type="checkbox" style={{ accentColor: '#d93025' }} />
                                Remember me
                            </label>
                            <a href="#" className={s.forgotLink}>Reset Password!</a>
                        </div>

                        <button type="submit" className={s.primaryButton} disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
                        </button>
                    </form>

                    <div className={s.divider}>
                        <span>or login with</span>
                    </div>

                    <div className={s.socialGrid}>
                        <button className={s.socialButton} aria-label="Google"><Chrome size={20} color="#EA4335" /></button>
                        <button className={s.socialButton} aria-label="Facebook"><Facebook size={20} color="#1877F2" /></button>
                        <button className={s.socialButton} aria-label="Apple"><Apple size={20} color="#000000" /></button>
                    </div>

                    <div className={s.signupText}>
                        {isLogin ? "Don't Have an account?" : "Already Have an account?"}
                        <button
                            className={s.signupLink}
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'Create Account' : 'Login Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
