import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';
import { EyeIcon, ColoredProjectLogo } from './Icons';
import LanguageSelector from './LanguageSelector';

function LandingPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="landing-page">
            <div className="landing-lang-toggle">
                <LanguageSelector />
            </div>
            <div className="landing-content glass-card">
                <div className="logo-title-row">
                    <ColoredProjectLogo size={48} />
                    <h1 className="app-title">BloomWise</h1>
                </div>
                <p className="app-tagline">{t('schedule_desc')}</p>

                <div className="action-buttons">
                    <button
                        className="btn-primary start-btn"
                        onClick={() => navigate('/register')}
                    >
                        {t('register')}
                    </button>

                    <button
                        className="btn-primary start-btn"
                        onClick={() => navigate('/login')}
                    >
                        {t('sign_in')}
                    </button>

                    <button
                        className="btn-primary preview-btn"
                        onClick={() => navigate('/preview')}
                    >
                        <EyeIcon />
                        <span>{t('preview_app')}</span>
                    </button>
                </div>
            </div>

            <style>{`
                .landing-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-gradient);
                    padding: 1rem;
                    position: relative;
                }

                .landing-lang-toggle {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                }

                .landing-content {
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2rem;
                    padding: 3rem 2rem;
                    border: 1px solid var(--border-glass-strong);
                    box-shadow: 0 20px 50px var(--shadow-color);
                }

                .logo-title-row {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                }

                .app-icon {
                    font-size: 3rem;
                }

                .app-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }

                .app-tagline {
                    color: var(--text-secondary);
                    font-size: 1.1rem;
                    margin-top: -1.5rem;
                }

                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                }

                .start-btn, .preview-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    font-size: 1.1rem;
                    border-radius: 50px;
                }

                .preview-btn {
                    opacity: 0.9;
                }

                .preview-btn svg {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }
            `}</style>
        </div>
    );
}

export default LandingPage;
