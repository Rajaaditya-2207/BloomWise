import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSignalHistory, getSignalStats } from '../services/signalService';
import { agentMemory } from '../services/agentMemory';
import { backgroundAgent } from '../services/backgroundAgent';
import { useLanguage } from '../App';
import {
    WaterIcon, PauseIcon, TrendingDownIcon, StopIcon, ChartIcon, MoneyIcon,
    ThermometerIcon, PlantIcon, CloudRainIcon, RefreshIcon, ArrowLeftIcon,
    InfoIcon, CheckCircleIcon, AlertTriangleIcon, SignalIcon, ListFilterIcon, AgentIcon
} from './Icons';

function SignalHistory() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [signals, setSignals] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [agentStatus, setAgentStatus] = useState(backgroundAgent.getStatus());

    const context = agentMemory.getContext();

    useEffect(() => {
        loadData();

        // Listen to background agent updates
        const unsubscribe = backgroundAgent.addListener((event, data) => {
            setAgentStatus(backgroundAgent.getStatus());
            if (event === 'completed') {
                loadData();
            }
        });

        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyResult, statsResult] = await Promise.all([
                getSignalHistory(context.farmerId),
                getSignalStats(context.farmerId)
            ]);

            setSignals(historyResult.signals || []);
            setStats(statsResult.stats || null);
        } catch (error) {
            console.error('Failed to load signal data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        const icons = {
            'IRRIGATE': WaterIcon,
            'SKIP': PauseIcon,
            'REDUCE': TrendingDownIcon,
            'EMERGENCY_STOP': StopIcon
        };
        const Icon = icons[action] || InfoIcon;
        return <Icon size={16} />;
    };

    const getActionColor = (action) => {
        const colors = {
            'IRRIGATE': 'var(--accent-blue)',
            'SKIP': 'var(--accent-yellow)',
            'REDUCE': 'var(--accent-orange)',
            'EMERGENCY_STOP': 'var(--accent-red)'
        };
        return colors[action] || 'var(--text-secondary)';
    };

    const getStatusBadge = (status) => {
        const badges = {
            'SENT': { text: 'Sent', class: 'badge-info' },
            'ACKNOWLEDGED': { text: 'Acknowledged', class: 'badge-success' },
            'PENDING': { text: 'Pending', class: 'badge-warning' },
            'FAILED': { text: 'Failed', class: 'badge-error' }
        };
        return badges[status] || { text: status, class: '' };
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatWaterAmount = (liters) => {
        if (!liters) return '-';
        if (liters >= 1000000) return `${(liters / 1000000).toFixed(1)}M L`;
        if (liters >= 1000) return `${(liters / 1000).toFixed(0)}K L`;
        return `${liters} L`;
    };

    const filteredSignals = filter === 'all'
        ? signals
        : signals.filter(s => s.action === filter);

    const handleForceCheck = () => {
        backgroundAgent.forceCheck();
    };

    return (
        <div className="signal-history-container">
            {/* Header */}
            <div className="page-header glass-card">
                <div className="header-content">
                    <h1><SignalIcon className="header-icon" /> {t('signal_log')}</h1>
                    <p>{t('hardware_log_desc')}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/')}
                    style={{ borderRadius: '50px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                >
                    <ArrowLeftIcon size={18} /> {t('back_dashboard')}
                </button>
            </div>

            {/* Agent Status Card */}
            <div className="agent-status-card glass-card">
                <div className="status-header">
                    <h3><AgentIcon /> {t('background_agent')}</h3>
                    <div className={`status-indicator ${agentStatus.status}`}>
                        {agentStatus.status === 'running' || agentStatus.status === 'idle' ? <CheckCircleIcon size={16} /> :
                            agentStatus.status === 'checking' ? <RefreshIcon size={16} className="spin" /> : <AlertTriangleIcon size={16} />}
                        {agentStatus.status.toUpperCase()}
                    </div>
                </div>
                <div className="status-details">
                    <div className="status-item">
                        <span className="label">{t('last_check')}:</span>
                        <span className="value">
                            {agentStatus.lastCheck
                                ? formatTimestamp(agentStatus.lastCheck)
                                : 'Never'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="label">{t('total_checks')}:</span>
                        <span className="value">{agentStatus.checkCount}</span>
                    </div>
                    <div className="status-item">
                        <span className="label">{t('interval')}:</span>
                        <span className="value">{agentStatus.intervalMs / 60000} {t('minutes')}</span>
                    </div>
                </div>
                {agentStatus.lastDecision && (
                    <div className="last-decision">
                        <h4>{t('last_decision')}:</h4>
                        <p>
                            <span className="icon-text">{getActionIcon(agentStatus.lastDecision.action)} {agentStatus.lastDecision.action}:</span>
                            {agentStatus.lastDecision.reasoning}
                        </p>
                    </div>
                )}
                <button
                    className="btn-secondary"
                    onClick={handleForceCheck}
                    disabled={agentStatus.status === 'checking'}
                    style={{ borderRadius: '50px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                >
                    <RefreshIcon size={18} className={agentStatus.status === 'checking' ? 'spin' : ''} />
                    {agentStatus.status === 'checking' ? t('checking') : t('force_check')}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><ChartIcon /></div>
                        <div className="stat-value">{stats.totalSignals}</div>
                        <div className="stat-label">{t('total_signals')}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><WaterIcon /></div>
                        <div className="stat-value">{stats.irrigateCount}</div>
                        <div className="stat-label">{t('irrigations')}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><PauseIcon /></div>
                        <div className="stat-value">{stats.skipCount}</div>
                        <div className="stat-label">{t('skipped')}</div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon"><MoneyIcon /></div>
                        <div className="stat-value">{formatWaterAmount(stats.totalWaterSaved)}</div>
                        <div className="stat-label">{t('water_saved')}</div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-tabs glass-card">
                {['all', 'IRRIGATE', 'SKIP', 'REDUCE', 'EMERGENCY_STOP'].map(f => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? <span className="icon-text"><ListFilterIcon size={16} /> All</span> : <span className="icon-text">{getActionIcon(f)} {f}</span>}
                    </button>
                ))}
            </div>

            {/* Signal Timeline */}
            <div className="signal-timeline glass-card">
                <h3><SignalIcon size={20} /> Signal Log</h3>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>{t('loading')}...</p>
                    </div>
                ) : filteredSignals.length === 0 ? (
                    <div className="empty-state">
                        <p>{t('no_signals')}</p>
                    </div>
                ) : (
                    <div className="timeline">
                        {filteredSignals.map((signal, index) => (
                            <div key={signal.id || index} className="timeline-item">
                                <div
                                    className="timeline-marker"
                                    style={{ backgroundColor: getActionColor(signal.action) }}
                                >
                                    {getActionIcon(signal.action)}
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-header">
                                        <span
                                            className="action-label"
                                            style={{ color: getActionColor(signal.action) }}
                                        >
                                            {signal.action}
                                        </span>
                                        <span className={`status-badge ${getStatusBadge(signal.signal_status).class}`}>
                                            {getStatusBadge(signal.signal_status).text}
                                        </span>
                                        <span className="timestamp">
                                            {formatTimestamp(signal.timestamp)}
                                        </span>
                                    </div>

                                    {signal.reasoning && (
                                        <p className="reasoning">{signal.reasoning}</p>
                                    )}

                                    <div className="signal-details">
                                        {signal.water_amount_liters && (
                                            <span className="detail-tag">
                                                <WaterIcon size={14} /> {formatWaterAmount(signal.water_amount_liters)}
                                            </span>
                                        )}
                                        {signal.duration_mins && (
                                            <span className="detail-tag">
                                                <InfoIcon size={14} /> {signal.duration_mins} min
                                            </span>
                                        )}
                                    </div>

                                    {signal.conditions && Object.keys(signal.conditions).length > 0 && (
                                        <div className="conditions-grid">
                                            {signal.conditions.temperature && (
                                                <span className="condition">
                                                    <ThermometerIcon size={14} /> {signal.conditions.temperature.toFixed(1)}°C
                                                </span>
                                            )}
                                            {signal.conditions.humidity && (
                                                <span className="condition">
                                                    <CloudRainIcon size={14} /> {signal.conditions.humidity.toFixed(0)}%
                                                </span>
                                            )}
                                            {signal.conditions.soilMoisture && (
                                                <span className="condition">
                                                    <PlantIcon size={14} /> Soil: {(signal.conditions.soilMoisture * 100).toFixed(0)}%
                                                </span>
                                            )}
                                            {signal.conditions.growthStage && (
                                                <span className="condition">
                                                    <PlantIcon size={14} /> {signal.conditions.growthStage}
                                                </span>
                                            )}
                                            {signal.conditions.rainProbability > 0 && (
                                                <span className="condition">
                                                    <CloudRainIcon size={14} /> Rain: {signal.conditions.rainProbability.toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mock Hardware Notice - Only show in Demo Mode */}
            {context?.isDemo && (
                <div className="mock-notice glass-card">
                    <p>
                        <AlertTriangleIcon size={16} /> <strong>{t('mock_mode')}:</strong> {t('mock_desc')}
                    </p>
                </div>
            )}

            <style>{`
                .header-icon { display: inline-block; margin-right: 0.5rem; vertical-align: bottom; }
                .icon-text { display: inline-flex; align-items: center; gap: 0.25rem; }
                .btn-secondary { display: flex; align-items: center; gap: 0.5rem; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .conditions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }
                
                .condition {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    background: rgba(255,255,255,0.03);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }

                .source-badge {
                    font-size: 0.65rem;
                    padding: 0.1rem 0.4rem;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                    background: rgba(139, 92, 246, 0.2); /* Purple for AI */
                    color: #a78bfa;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                }
            `}</style>
        </div>
    );
}

export default SignalHistory;
