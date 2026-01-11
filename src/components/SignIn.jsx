import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';
import { agentMemory } from '../services/agentMemory';
import { t } from '../utils/translations';
import { supabase, signInWithEmailOtp, verifyEmailOtp } from '../services/supabase';
import { ArrowLeftIcon } from './Icons';

function SignIn() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // State
    const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Used for OTP as well
    const [otpSent, setOtpSent] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handlers
    const handleSendPhoneOtp = () => {
        if (mobile.length < 10) {
            setError(t('invalid_credentials'));
            return;
        }
        // Mock sending OTP
        setOtpSent(true);
        setError('');
    };

    const handleSendEmailOtp = async () => {
        if (!email.includes('@')) {
            setError(t('invalid_credentials')); // 'Invalid Email' localized
            return;
        }
        setLoading(true);
        setError('');
        try {
            // SIMULATED: Check if email exists in DB (Like Phone)
            const { data, error } = await supabase
                .from('farmers')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) {
                // If not found in DB, they are not registered
                throw new Error(t('account_not_found') || 'Account not found. Please register.');
            }

            // If found, send "Mock" OTP
            setOtpSent(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let farmer = null;

            // Verify OTP (Mock for both)
            if (password !== '123456' && password !== '1234') { // Allow simple mock OTPs
                // In a real app, this would verify against a generated OTP
                // For now, we accept any OTP or specific mock ones for testing
                // Let's enforce a simple mock check if needed, or just allow it for demo
            }

            if (loginMethod === 'phone') {
                // Phone Login: Check if exists in DB
                const { data, error } = await supabase
                    .from('farmers')
                    .select('*')
                    .eq('phone', mobile)
                    .single();

                if (error || !data) {
                    throw new Error(t('invalid_credentials'));
                }
                farmer = data;

            } else {
                // Email Login: Check if exists in DB (Simulated)
                const { data: farmerData, error: farmerError } = await supabase
                    .from('farmers')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (farmerError || !farmerData) {
                    throw new Error('No farmer account found with this email.');
                }
                farmer = farmerData;
            }

            // Success: Set Memory & Update App State
            agentMemory.setFarmer(farmer);
            window.location.href = '/'; // Reload to refresh App state (isRegistered)

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || t('invalid_credentials'));
            setLoading(false);
        }
    };

    return (
        <div className="signin-page">
            <div className="signin-content glass-card">
                <button className="back-btn" onClick={() => navigate('/welcome')}>
                    <ArrowLeftIcon />
                </button>

                <h1 className="signin-title">BloomWise {t('sign_in')}</h1>

                <div className="login-tabs">
                    <button
                        className={`tab-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('phone'); setOtpSent(false); setError(''); setPassword(''); }}
                    >
                        Phone
                    </button>
                    <button
                        className={`tab-btn ${loginMethod === 'email' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('email'); setOtpSent(false); setError(''); setPassword(''); }}
                    >
                        Email OTP
                    </button>
                </div>

                <form onSubmit={handleVerify} className="signin-form">
                    {loginMethod === 'phone' ? (
                        /* Phone Inputs */
                        <>
                            <div className="form-group">
                                <label>{t('phone') || 'Mobile Number'}</label>
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    required
                                    className="glass-input"
                                    disabled={otpSent}
                                />
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label>OTP</label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter Mock OTP (Any)"
                                        className="glass-input"
                                        required
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Email Inputs */
                        <>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="glass-input"
                                    disabled={otpSent}
                                />
                            </div>
                            {otpSent && (
                                <div className="form-group">
                                    <label>OTP (Sent to email)</label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="6-digit OTP"
                                        className="glass-input"
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {error && <div className="error-message">⚠️ {error}</div>}

                    {!otpSent ? (
                        <button
                            type="button"
                            className="btn-primary signin-btn"
                            disabled={loading}
                            onClick={loginMethod === 'phone' ? handleSendPhoneOtp : handleSendEmailOtp}
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn-primary signin-btn"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                    )}
                </form>
            </div>

            <style>{`
                .signin-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-gradient);
                    padding: 1rem;
                }

                .signin-content {
                    width: 100%;
                    max-width: 400px;
                    padding: 2.5rem 2rem;
                    position: relative;
                }

                .back-btn {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .back-btn:hover {
                    background: var(--bg-glass-hover);
                }

                .signin-title {
                    text-align: center;
                    font-size: 1.8rem;
                    margin-bottom: 2rem;
                    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-tabs {
                    display: flex;
                    gap: 0;
                    margin-bottom: 2rem;
                    background: var(--bg-glass);
                    border-radius: 12px;
                    padding: 4px;
                }

                .tab-btn {
                    flex: 1;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    padding: 0.75rem;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.3s;
                    font-weight: 500;
                }

                .tab-btn.active {
                    background: var(--accent-primary);
                    color: white;
                    box-shadow: 0 4px 12px var(--shadow-color);
                }

                .signin-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: left;
                }

                .form-group label {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-left: 0.25rem;
                }

                .glass-input {
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1rem;
                    color: var(--text-primary);
                    font-size: 1rem;
                    transition: all 0.3s;
                }

                .glass-input:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 2px var(--accent-glow);
                }

                .signin-btn {
                    margin-top: 1rem;
                    padding: 1rem;
                    font-size: 1.1rem;
                    border-radius: 50px;
                    justify-content: center;
                }
                
                .error-message {
                    color: #ef4444;
                    font-size: 0.9rem;
                    text-align: center;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 0.5rem;
                    border-radius: 8px;
                }
            `}</style>
        </div>
    );
}

export default SignIn;
