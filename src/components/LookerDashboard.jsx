import React, { useState, useEffect } from 'react';

/**
 * Looker Studio Dashboard Embed Component
 * Displays embedded Looker Studio dashboards for crop growth and water usage analytics
 */

const DASHBOARD_CONFIG = {
    cropGrowth: {
        title: 'Crop Growth Statistics',
        titleHi: 'फसल वृद्धि आंकड़े',
        icon: '🌾',
        description: 'Track crop growth stages, Kc coefficients, and health indicators',
        // Replace with actual Looker Studio report ID when available
        reportId: 'PLACEHOLDER_CROP_GROWTH_REPORT_ID'
    },
    waterUsage: {
        title: 'Water Usage Analytics',
        titleHi: 'पानी उपयोग विश्लेषण',
        icon: '💧',
        description: 'Monitor water consumption, savings, and irrigation efficiency',
        // Replace with actual Looker Studio report ID when available
        reportId: 'PLACEHOLDER_WATER_USAGE_REPORT_ID'
    }
};

function LookerDashboard({ type = 'waterUsage' }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [useMockData, setUseMockData] = useState(true);

    const config = DASHBOARD_CONFIG[type] || DASHBOARD_CONFIG.waterUsage;

    // In production, this would be the actual Looker Studio embed URL
    const embedUrl = `https://lookerstudio.google.com/embed/reporting/${config.reportId}`;

    useEffect(() => {
        // Check if we have a valid report ID
        if (config.reportId.startsWith('PLACEHOLDER')) {
            setUseMockData(true);
            setIsLoading(false);
        }
    }, [config.reportId]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setHasError(true);
        setIsLoading(false);
        setUseMockData(true);
    };

    // Mock dashboard data for demo
    const renderMockDashboard = () => {
        if (type === 'cropGrowth') {
            return (
                <div className="mock-dashboard crop-growth">
                    <div className="dashboard-section">
                        <h4>🌱 Growth Stage Progress</h4>
                        <div className="progress-chart">
                            <div className="stage-bar">
                                <div className="stage completed" style={{ width: '25%' }}>
                                    <span>Initial</span>
                                    <small>15 days</small>
                                </div>
                                <div className="stage completed" style={{ width: '35%' }}>
                                    <span>Development</span>
                                    <small>30 days</small>
                                </div>
                                <div className="stage active" style={{ width: '25%' }}>
                                    <span>Mid (Current)</span>
                                    <small>Day 12/35</small>
                                </div>
                                <div className="stage pending" style={{ width: '15%' }}>
                                    <span>Late</span>
                                    <small>30 days</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <h4>📊 Kc Coefficient Trend</h4>
                        <div className="kc-chart">
                            <div className="chart-bars">
                                {[0.3, 0.5, 0.8, 1.0, 1.15, 1.15, 1.1, 0.9].map((kc, i) => (
                                    <div
                                        key={i}
                                        className="chart-bar"
                                        style={{ height: `${kc * 80}%` }}
                                    >
                                        <span className="bar-value">{kc}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-labels">
                                {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((w, i) => (
                                    <span key={i}>{w}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <h4>🌡️ Health Status</h4>
                        <div className="health-indicator">
                            <div className="health-circle healthy">
                                <span className="health-icon">✓</span>
                            </div>
                            <div className="health-details">
                                <span className="health-status">Healthy</span>
                                <span className="health-note">All parameters within optimal range</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Water Usage Dashboard
        return (
            <div className="mock-dashboard water-usage">
                <div className="dashboard-section">
                    <h4>💧 Weekly Water Usage</h4>
                    <div className="water-chart">
                        <div className="chart-bars">
                            {[85, 92, 0, 78, 0, 88, 95].map((usage, i) => (
                                <div key={i} className="bar-group">
                                    <div
                                        className={`chart-bar ${usage === 0 ? 'skipped' : ''}`}
                                        style={{ height: `${usage || 100}%` }}
                                    >
                                        {usage === 0 && <span className="skip-icon">🌧️</span>}
                                    </div>
                                    <span className="bar-label">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h4>📈 Savings vs Baseline</h4>
                    <div className="comparison-chart">
                        <div className="comparison-bar">
                            <div className="actual" style={{ width: '70%' }}>
                                <span>Actual: 280K L</span>
                            </div>
                        </div>
                        <div className="comparison-bar baseline">
                            <div className="baseline-fill" style={{ width: '100%' }}>
                                <span>Baseline: 400K L</span>
                            </div>
                        </div>
                        <div className="savings-highlight">
                            <span className="savings-amount">🎉 120K Liters Saved (30%)</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h4>🌧️ Rain Events Avoided</h4>
                    <div className="events-grid">
                        <div className="event-card">
                            <span className="event-date">Wed, Jan 8</span>
                            <span className="event-detail">Skipped irrigation</span>
                            <span className="event-saved">Saved 56K L</span>
                        </div>
                        <div className="event-card">
                            <span className="event-date">Fri, Jan 10</span>
                            <span className="event-detail">Skipped irrigation</span>
                            <span className="event-saved">Saved 64K L</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="looker-dashboard-container">
            <div className="dashboard-header glass-card">
                <div className="header-info">
                    <h2>{config.icon} {config.title}</h2>
                    <p>{config.description}</p>
                </div>
                {useMockData && (
                    <div className="mock-badge">
                        📊 Demo Mode
                    </div>
                )}
            </div>

            <div className="dashboard-content glass-card">
                {isLoading && !useMockData && (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                )}

                {useMockData ? (
                    renderMockDashboard()
                ) : (
                    <iframe
                        src={embedUrl}
                        className="dashboard-iframe"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                )}
            </div>

            {useMockData && (
                <div className="setup-notice glass-card">
                    <h4>🔧 Connect Looker Studio</h4>
                    <p>To display live analytics:</p>
                    <ol>
                        <li>Create a Looker Studio report using Supabase as data source</li>
                        <li>Get the report ID from the Looker Studio URL</li>
                        <li>Update the <code>reportId</code> in <code>LookerDashboard.jsx</code></li>
                    </ol>
                    <a
                        href="https://lookerstudio.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                    >
                        Open Looker Studio →
                    </a>
                </div>
            )}
        </div>
    );
}

export default LookerDashboard;
