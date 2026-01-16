import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';
import { agentMemory } from '../services/agentMemory';
import {
    supabase,
    signInWithEmailOtp,
    verifyEmailOtp,
    signInWithPhoneOtp,
    verifyPhoneOtp,
    isSupabaseConfigured
} from '../services/supabase';
import { ArrowLeftIcon, ColoredProjectLogo, CheckCircleIcon, AlertCircleIcon } from './Icons';
import LanguageSelector from './LanguageSelector';

function Login() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    // State
    const [inputValue, setInputValue] = useState('');
    const [loginMethod, setLoginMethod] = useState(''); // 'phone' | 'email' - detected automatically
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Check if farmer exists in DB
    const checkFarmerExists = async (field, value) => {
        if (!supabase) {
            // Demo mode: Accept any credentials
            return { exists: true, farmer: { id: 'demo', full_name: 'Demo User', [field]: value, isDemo: true } };
        }

        try {
            const { data, error } = await supabase
                .from('farmers')
                .select('*')
                .eq(field, value)
                .single();

            if (error || !data) {
                return { exists: false, farmer: null };
            }
            return { exists: true, farmer: data };
        } catch (err) {
            console.error('Error checking farmer:', err);
            return { exists: false, farmer: null };
        }
    };

    // Unified Send OTP Handler (Email Only)
    const handleSendOtp = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // Strict Email Validation
            if (!inputValue.includes('@') || !inputValue.includes('.')) {
                throw new Error(t('invalid_email') || 'Please enter a valid email address');
            }

            setLoginMethod('email');
            setEmail(inputValue);

            // Strict check: User MUST exist in DB
            const { exists } = await checkFarmerExists('email', inputValue);
            if (!exists) {
                // If checking fails (e.g. RLS) or returns no data, we assume user not found
                // preventing OTP from being sent
                throw new Error(t('account_not_found') || 'Account not found. Please register first.');
            }

            if (isSupabaseConfigured) {
                // Sign in with OTP (shouldCreateUser: false ensures we rely on existing Auth user, 
                // but since we check DB first, we can be more confident)
                // Note: We keep shouldCreateUser: true just in case Auth user is missing but DB record exists (edge case)
                // OR we set it to false to be super strict. 
                // Given the prompt "only when... in database", checking `farmers` table is the correct "business logic" check.
                const { error } = await signInWithEmailOtp(inputValue);
                if (error) throw error;
                setSuccessMessage(t('otp_sent_email_success') || 'OTP sent to your email!');
            } else {
                setSuccessMessage('Demo mode: Enter 123456 as OTP');
            }

            setOtpSent(true);

        } catch (err) {
            console.error('OTP error:', err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP and Login
    const handleVerifyOtp = React.useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!otp || otp.length < 4) {
            setError(t('invalid_otp') || 'Please enter a valid OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let farmerData = null;

            // Verify Email OTP
            if (isSupabaseConfigured) {
                const { data, error: verifyError } = await verifyEmailOtp(email, otp);
                if (verifyError) throw new Error(verifyError.message);
            } else {
                if (otp !== '123456') throw new Error('Invalid OTP. Use 123456 for demo.');
            }

            const { exists, farmer } = await checkFarmerExists('email', email);
            if (!exists) {
                navigate('/register');
                return;
            }
            farmerData = farmer;

            // Success! Save farmer data and start agent
            agentMemory.setFarmer(farmerData);

            // Navigate to loading screen (agent will start there)
            window.location.href = '/loading';

        } catch (err) {
            console.error('OTP verification error:', err);
            setError(err.message || t('invalid_otp') || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [otp, otpSent, email, t, isSupabaseConfigured, navigate]);

    // Handle Form Submit
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (otpSent) {
            handleVerifyOtp(e);
        } else {
            handleSendOtp(e);
        }
    };

    // Restore handleReset
    const handleReset = () => {
        setOtpSent(false);
        setOtp('');
        setError('');
        setSuccessMessage('');
    };

    // Auto-verify OTP when 6 digits are entered
    React.useEffect(() => {
        if (otpSent && otp.length === 6) {
            handleVerifyOtp({ preventDefault: () => { } });
        }
    }, [otp, otpSent, handleVerifyOtp]);


    return (
        <div className="signin-page">
            {/* Language selector - top right */}
            <div className="signin-lang-top-right">
                <LanguageSelector />
            </div>

            <div className="signin-content glass-card">

                <div className="signin-header">
                    <div className="signin-logo-row">
                        <ColoredProjectLogo size={40} />
                        <h1 className="signin-logo">BloomWise</h1>
                    </div>
                    <h2 className="signin-subtitle">{t('sign_in') || 'Sign In'}</h2>
                </div>

                <form onSubmit={handleFormSubmit} className="signin-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter your email"
                            className="glass-input"
                            disabled={otpSent || loading}
                            required
                        />
                    </div>

                    {otpSent && (
                        <div className="form-group">
                            <label>{t('enter_otp') || 'Enter OTP'}</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="glass-input otp-input"
                                required
                                maxLength={6}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                        <div className="success-message"><CheckCircleIcon size={18} style={{ color: '#22c55e' }} /> {successMessage}</div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="error-message"><AlertCircleIcon size={18} style={{ color: '#ef4444' }} /> {error}</div>
                    )}

                    {/* Action Buttons */}
                    {!otpSent ? (
                        <button
                            type="submit"
                            className="btn-primary signin-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>{t('sending') || 'Sending...'}</>
                            ) : (
                                <>{t('send_otp') || 'Send OTP'}</>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                type="submit"
                                className="btn-primary signin-btn"
                                disabled={loading || otp.length < 4}
                            >
                                {loading ? (
                                    <>{t('verifying') || 'Verifying...'}</>
                                ) : (
                                    <>{t('verify_login') || 'Verify & Login'}</>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn-secondary resend-btn"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                {t('change_number') || 'Change Number/Email'}
                            </button>
                        </>
                    )}
                </form>

                {/* Register Link */}
                <div className="signin-footer">
                    <p>{t('no_account') || "Don't have an account?"}</p>
                    <button
                        className="register-link"
                        onClick={() => navigate('/register')}
                    >
                        {t('register_now') || 'Register Now'}
                    </button>
                </div>
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
                    max-width: 420px;
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
                    transition: background 0.3s;
                }
                .back-btn:hover {
                    background: var(--bg-glass-hover);
                }

                .signin-lang-top-right {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    z-index: 10;
                }

                .signin-header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .signin-logo-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .signin-logo {
                    font-size: 2rem;
                    margin-bottom: 0.25rem;
                    background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }

                .signin-subtitle {
                    font-size: 1.2rem;
                    color: var(--text-secondary);
                    font-weight: 400;
                    margin: 0;
                }


                    border-radius: 8px;
                    transition: all 0.3s;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .tab-btn.active {
                    background: var(--accent-primary);
                    color: white;
                    box-shadow: 0 4px 12px var(--shadow-color);
                }

                .signin-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
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

                .phone-input-wrapper {
                    display: flex;
                    align-items: stretch;
                    gap: 0;
                }

                .country-code {
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    border-right: none;
                    border-radius: 12px 0 0 12px;
                    padding: 0 1rem;
                    color: var(--text-primary);
                    font-size: 1rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 50px;
                }

                .phone-input {
                    border-radius: 0 12px 12px 0 !important;
                    flex: 1;
                }

                .glass-input {
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    border-radius: 12px;
                    padding: 1rem;
                    color: var(--text-primary);
                    font-size: 1rem;
                    transition: all 0.3s;
                    width: 100%;
                }

                .glass-input:focus {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 2px var(--accent-glow);
                }

                .glass-input:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .otp-input {
                    text-align: center;
                    font-size: 1.5rem;
                    letter-spacing: 0.5rem;
                    font-weight: 600;
                }

                .signin-btn {
                    margin-top: 0.5rem;
                    padding: 1rem;
                    font-size: 1.1rem;
                    border-radius: 50px;
                    justify-content: center;
                }

                .resend-btn {
                    padding: 0.75rem;
                    font-size: 0.9rem;
                    border-radius: 50px;
                    background: transparent;
                    border: 1px solid var(--border-glass);
                    color: var(--text-secondary);
                }
                
                .resend-btn:hover {
                    background: var(--bg-glass-hover);
                }

                .success-message {
                    color: #10b981;
                    font-size: 0.9rem;
                    text-align: center;
                    background: rgba(16, 185, 129, 0.1);
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .error-message {
                    color: #ef4444;
                    font-size: 0.9rem;
                    text-align: center;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .signin-footer {
                    margin-top: 2rem;
                    text-align: center;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .register-link {
                    background: none;
                    border: none;
                    color: var(--accent-primary);
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 0.95rem;
                    margin-top: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s;
                }

                .register-link:hover {
                    background: var(--bg-glass-hover);
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}

export default Login;
