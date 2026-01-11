import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WaterIcon, SproutIcon, BrainCircuitIcon, ArrowLeftIcon, ChartIcon } from './Icons';
import { useLanguage } from '../App';

/**
 * Analytics Navigation Page
 * Provides a hub to navigate between Water, Crop, and Agent analytics dashboards.
 */

// Scroll to top on mount
function useScrollToTop() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
}

const ANALYTICS_TABS = [
    {
        id: 'water',
        path: 'water',
        titleKey: 'tab_water_title',
        descKey: 'tab_water_desc',
        Icon: WaterIcon,
        color: '#3b82f6'
    },
    {
        id: 'crop',
        path: 'crop',
        titleKey: 'tab_crop_title',
        descKey: 'tab_crop_desc',
        Icon: SproutIcon,
        color: '#10b981'
    },
    {
        id: 'agent',
        path: 'agent',
        titleKey: 'tab_agent_title',
        descKey: 'tab_agent_desc',
        Icon: BrainCircuitIcon,
        color: '#8b5cf6'
    }
];

function AnalyticsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    // Scroll to top when page loads
    useScrollToTop();

    const isPreview = location.pathname.startsWith('/preview');
    const basePath = isPreview ? '/preview/analytics' : '/analytics';

    const handleTabClick = (tabPath) => {
        navigate(`${basePath}/${tabPath}`);
    };

    const handleBack = () => {
        if (isPreview) {
            navigate('/preview/report');
        } else {
            navigate('/report');
        }
    };

    return (
        <div className="analytics-page">
            <header className="analytics-header glass-card">
                <button onClick={handleBack} className="back-btn" aria-label="Back">
                    <ArrowLeftIcon size={24} />
                </button>
                <div className="header-content">
                    <h1><ChartIcon size={28} /> {t('detailed_analytics')}</h1>
                    <p>{t('looker_reports')}</p>
                </div>
            </header>

            <section className="analytics-grid">
                {ANALYTICS_TABS.map((tab) => {
                    const IconComponent = tab.Icon;
                    return (
                        <button
                            key={tab.id}
                            className="analytics-card glass-card"
                            onClick={() => handleTabClick(tab.path)}
                            style={{ '--card-accent': tab.color }}
                        >
                            <div className="card-icon" style={{ background: `${tab.color}20`, color: tab.color }}>
                                <IconComponent size={32} />
                            </div>
                            <div className="card-content">
                                <h3>{t(tab.titleKey)}</h3>
                                <p>{t(tab.descKey)}</p>
                            </div>
                            <ArrowLeftIcon size={20} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
                        </button>
                    );
                })}
            </section>

            <style>{`
                .analytics-page {
                    min-height: 100vh;
                    padding: 1.5rem 1rem 6rem;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .analytics-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .analytics-header .back-btn {
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--bg-glass);
                    border: 1px solid var(--glass-border);
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .analytics-header .back-btn:hover {
                    background: var(--glass-hover);
                    transform: translateX(-2px);
                }

                .header-content h1 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .header-content p {
                    margin: 0.25rem 0 0;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .analytics-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .analytics-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border-left: 3px solid var(--card-accent);
                }

                .analytics-card:hover {
                    transform: translateX(4px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                }

                .card-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .card-content {
                    flex: 1;
                }

                .card-content h3 {
                    margin: 0 0 0.25rem;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .card-content p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                @media (max-width: 480px) {
                    .analytics-card {
                        flex-wrap: wrap;
                    }
                    .card-icon {
                        width: 48px;
                        height: 48px;
                    }
                }
            `}</style>
        </div>
    );
}

export default AnalyticsPage;
