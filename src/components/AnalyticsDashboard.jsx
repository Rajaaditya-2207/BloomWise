import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    PlantIcon, WaterIcon, BrainCircuitIcon, SproutIcon,
    ThermometerIcon, CloudRainIcon, CheckCircleIcon,
    ChartIcon, InfoIcon, ArrowLeftIcon, PowerIcon, CalendarIcon
} from './Icons';
import { useApp, useLanguage } from '../App';
import { agentDecisionLog } from '../services/agentDecisionLog';

/**
 * Analytics Dashboard Component
 * Displays charts using Recharts that pull from Supabase (or cached data for demo)
 */

// Colors
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

function AnalyticsDashboard({ type = 'waterUsage' }) {
    const navigate = useNavigate();
    const { farm } = useApp();
    const { t } = useLanguage();
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const isPreview = window.location.pathname.startsWith('/preview');
    // Force true for demo purposes if needed or respect farm.isDemo
    const isDemo = farm?.isDemo || isPreview || true;

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Configuration for different dashboard types
    const DASHBOARD_CONFIG = {
        cropGrowth: {
            title: t('analytics_crop_title'),
            Icon: SproutIcon,
            description: t('analytics_crop_desc')
        },
        waterUsage: {
            title: t('analytics_water_title'),
            Icon: WaterIcon,
            description: t('analytics_water_desc')
        },
        agentDecisions: {
            title: t('analytics_agent_title'),
            Icon: BrainCircuitIcon,
            description: t('analytics_agent_desc')
        }
    };

    const config = DASHBOARD_CONFIG[type] || DASHBOARD_CONFIG.waterUsage;
    const IconComponent = config.Icon;

    // Map action types to display info
    const getActionDisplay = (action) => {
        const mapping = {
            'SKIP_RAIN': { label: t('skip_rain'), type: 'skip', icon: 'rain' },
            'SKIP_MOISTURE': { label: t('skip_wet'), type: 'skip', icon: 'water' },
            'SKIP_POWER': { label: t('skip_power'), type: 'power', icon: 'power' },
            'SKIP_NORMAL': { label: t('skip_normal'), type: 'skip', icon: 'check' },
            'IRRIGATE': { label: t('irrigation_started'), type: 'start', icon: 'water' }
        };
        return mapping[action] || { label: action, type: 'adjustment', icon: 'chart' };
    };

    // Load data
    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Mock Data Generators
            const mockWaterData = () => {
                const enDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return enDays.map((day, i) => {
                    const fixed = Math.floor(Math.random() * 3000) + 4000;
                    const hasRain = i === 2 || i === 4;
                    const smart = hasRain ? 0 : Math.floor(fixed * (0.5 + Math.random() * 0.3));
                    return {
                        day,
                        dayLabel: t('day') + ' ' + (i + 1),
                        fixed,
                        smart,
                        saved: fixed - smart,
                        hasRain
                    };
                });
            };

            const mockCropData = () => {
                const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
                const kcValues = [0.3, 0.5, 0.7, 0.9, 1.05, 1.15, 1.1, 0.9];
                return weeks.map((week, i) => ({
                    week,
                    kc: kcValues[i],
                    etCrop: Math.floor(kcValues[i] * 5 * 10) / 10,
                    health: 85 + Math.floor(Math.random() * 15)
                }));
            };

            const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));
            setLoading(true);

            try {
                // Determine if we need to fetch real data or using mock
                // We wrap the data fetching logic in a promise to run concurrently with the timer
                const fetchDataPromise = (async () => {
                    // Only fetch if data is not already passed via state (e.g. from weekly report)
                    if (!farm && !isDemo) return;

                    // DEMO MODE
                    if (isDemo || !farm?.id) { // Use consistent demo check
                        if (type === 'waterUsage') {
                            setData(mockWaterData());
                            setStats({
                                totalSaved: 23500,
                                efficiency: 57,
                                rainDays: 2
                            });
                        } else if (type === 'cropGrowth') {
                            setData(mockCropData());
                            setStats({
                                growthStage: t('stage_mid'),
                                healthIndex: 92,
                                nextHarvest: '14 ' + t('days'),
                                daysGrowing: 45
                            });
                        } else if (type === 'agentDecisions') {
                            // Even in demo, we can use the "mock" agent logs from the service
                            const logs = await agentDecisionLog.getDecisions(true);
                            setData(logs);
                            setStats(await agentDecisionLog.getStats(true));
                        }
                    }
                    // PRODUCTION MODE
                    else {
                        try {
                            console.log('Fetching real analytics data for:', type);

                            if (type === 'waterUsage') {
                                setData(mockWaterData()); // TODO: Replace with real aggregation
                                setStats({ totalSaved: 0, efficiency: 0, rainDays: 0 }); // Todo: calculate real stats
                            } else if (type === 'agentDecisions') {
                                const logs = await agentDecisionLog.getDecisions(false);
                                setData(logs);
                                setStats(await agentDecisionLog.getStats(false));
                            } else {
                                setData(mockCropData());
                                setStats({
                                    growthStage: t('stage_mid'),
                                    healthIndex: 92,
                                    nextHarvest: '14 ' + t('days'),
                                    daysGrowing: 45
                                });
                            }
                        } catch (err) {
                            console.error('Error fetching analytics:', err);
                        }
                    }
                })();

                // Wait for both the minimum time and the data fetch
                await Promise.all([minLoadTime, fetchDataPromise]);

            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [type, farm, t, isDemo]);

    // Loading State
    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="loader-spinner"></div>
                <h3>{t('loading_data').replace('...', '')}</h3>
            </div>
        );
    }

    return (
        <div className="analytics-page">
            <div className="analytics-container">
                <header className="page-header glass-card">
                    <button
                        className="back-btn"
                        onClick={() => navigate(isPreview ? '/preview/analytics' : '/analytics')}
                    >
                        <ArrowLeftIcon size={20} />
                    </button>
                    <div className="header-content">
                        <h1><IconComponent size={type === 'cropGrowth' ? 32 : 28} className="header-icon" style={type === 'cropGrowth' ? { color: 'var(--success)' } : {}} /> {config.title}</h1>
                        <p>{config.description}</p>
                    </div>
                </header>

                <div className="analytics-content">
                    {/* Hardware Status (Visible on Water Usage or Main) */}
                    {/* Looker Studio Template - Water Usage */}
                    {/* Primary Chart Section */}
                    {type === 'waterUsage' && (
                        <>
                            <div className="stats-row">
                                <div className="stat-card glass-card highlight">
                                    <div className="stat-icon"><WaterIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('total_saved')}</span>
                                        <span className="stat-value">{stats?.totalSaved?.toLocaleString() || '0'} L</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><ChartIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('efficiency')}</span>
                                        <span className="stat-value">{stats?.efficiency || 0}%</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><CloudRainIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('rain_days')}</span>
                                        <span className="stat-value">{stats?.rainDays || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <section className="chart-section glass-card">
                                <h3>{t('weekly_comparison')}</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                                            <YAxis stroke="var(--text-secondary)" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                                                labelStyle={{ color: 'var(--text-primary)' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="fixed" name={t('fixed_schedule')} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="smart" name={t('smart_ai')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            <section className="chart-section glass-card">
                                <h3>{t('savings_trend')}</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={data}>
                                            <defs>
                                                <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
                                            <YAxis stroke="var(--text-secondary)" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                                                labelStyle={{ color: 'var(--text-primary)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="saved"
                                                name={t('saved')}
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#colorSaved)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Crop Growth Section */}
                    {type === 'cropGrowth' && (
                        <>
                            <div className="stats-row">
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><SproutIcon size={32} style={{ color: 'var(--success)' }} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('growth_stage')}</span>
                                        <span className="stat-value text-sm">{stats?.growthStage}</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><CheckCircleIcon size={32} style={{ color: 'var(--success)' }} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('health_index')}</span>
                                        <span className="stat-value">{stats?.healthIndex}%</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><CalendarIcon size={32} style={{ color: 'var(--success)' }} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('duration')}</span>

                                        <span className="stat-value">{stats?.daysGrowing} {t('days')}</span>
                                    </div>
                                </div>
                            </div>

                            <section className="chart-section glass-card">
                                <h3>{t('kc_trend')}</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="week" stroke="var(--text-secondary)" />
                                            <YAxis stroke="var(--text-secondary)" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                                                labelStyle={{ color: 'var(--text-primary)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="kc"
                                                name={t('crop_coeff')}
                                                stroke="#f59e0b"
                                                strokeWidth={3}
                                                dot={{ r: 4 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="etCrop"
                                                name={t('water_need') + '(mm)'}
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                            />
                                            <Legend />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            <section className="growth-pipeline glass-card">
                                <h3>{t('growth_stage_prog')}</h3>
                                <div className="pipeline-steps">
                                    {['stage_initial', 'stage_dev', 'stage_mid', 'stage_late'].map((stageKey, i) => (
                                        <div key={i} className={`step ${i <= 2 ? 'completed' : ''} ${i === 2 ? 'current' : ''}`}>
                                            <div className="step-circle">{i + 1}</div>
                                            <span className="step-label">{t(stageKey)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {/* Agent Decisions */}
                    {type === 'agentDecisions' && (
                        <>
                            <div className="stats-row">
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><BrainCircuitIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('total_actions')}</span>
                                        <span className="stat-value">{data?.length || 0}</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><WaterIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('liters_saved')}</span>
                                        <span className="stat-value">{stats?.waterSaved ? (stats.waterSaved / 1000).toFixed(1) + 'k' : '0'} L</span>
                                    </div>
                                </div>
                                <div className="stat-card glass-card">
                                    <div className="stat-icon"><CheckCircleIcon size={24} /></div>
                                    <div className="stat-info">
                                        <span className="stat-label">{t('avg_confidence')}</span>
                                        <span className="stat-value">{stats?.avgConfidence || 0}%</span>
                                    </div>
                                </div>
                            </div>

                            <section className="decision-feed glass-card">
                                <h3>{t('recent_actions')}</h3>
                                <div className="feed-list">
                                    {data?.map((item, index) => {
                                        const actionInfo = getActionDisplay(item.action);
                                        const Icon = actionInfo.icon === 'rain' ? CloudRainIcon :
                                            actionInfo.icon === 'water' ? WaterIcon :
                                                actionInfo.icon === 'power' ? PowerIcon :
                                                    CheckCircleIcon; // Default

                                        return (
                                            <div key={index} className={`feed-item ${actionInfo.type}`}>
                                                <div className="feed-icon">
                                                    <Icon size={18} />
                                                </div>
                                                <div className="feed-content">
                                                    <div className="feed-header">
                                                        <span className="feed-time">{item.time || new Date(item.timestamp).toLocaleDateString() + ' ' + new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="feed-title">{actionInfo.label}</span>
                                                    </div>
                                                    <p className="feed-reason">{item.reason}</p>
                                                    <div className="feed-meta">
                                                        {item.waterSaved > 0 && (
                                                            <span className="meta-tag saved">
                                                                💧 {(item.waterSaved / 1000).toFixed(1)}k L {t('saved')}
                                                            </span>
                                                        )}
                                                        {item.waterUsed > 0 && (
                                                            <span className="meta-tag used">
                                                                💧 {(item.waterUsed / 1000).toFixed(1)}k L {t('liters_used')}
                                                            </span>
                                                        )}
                                                        <span className="meta-tag confidence">
                                                            {item.confidence}% {t('confidence') || 'confidence'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!data || data.length === 0) && (
                                        <div className="no-data">
                                            <p>{t('no_decisions')}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .analytics-page {
                    min-height: 100vh;
                    background: var(--bg-gradient);
                    padding: 1.5rem 1rem 4.5rem; /* Reduced padding for bottom nav */
                    color: var(--text-primary);
                }



                .analytics-container {
                    max-width: 800px; /* Limit width */
                    margin: 0 auto;
                    width: 100%;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    padding: 1.25rem;
                    width: 100%;
                    /* Glass Card styles inherited */
                }

                .back-btn {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    background: rgba(255,255,255,0.05); /* Distinct from header bg */
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 50%; /* Circle */
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .back-btn:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateX(-3px);
                }

                .header-content {
                    text-align: left;
                    flex: 1;
                }

                .header-content h1 {
                    font-size: 1.5rem;
                    margin: 0 0 0.25rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--text-primary);
                }


                .header-icon {
                    color: var(--accent-primary);
                    -webkit-text-fill-color: initial;
                }

                .header-content p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    opacity: 0.9;
                }

                /* Stats Row */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    padding: 1rem 0.75rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 0.75rem;
                }

                .stat-icon {
                    padding: 0.5rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 50%;
                    color: var(--accent-primary);
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .stat-label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-value.text-sm {
                    font-size: 0.85rem;
                }

                .status-overview {
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                }

                .status-overview h3, .chart-section h3, .growth-pipeline h3, .decision-feed h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .status-item {
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    padding: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .status-item.active .status-dot {
                    background: #10b981;
                    box-shadow: 0 0 8px #10b981;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #6b7280;
                }

                .status-label {
                    display: flex;
                    flex-direction: column;
                }
                
                .status-label .label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }

                .status-label .value {
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .battery-icon {
                    width: 24px;
                    height: 12px;
                    border: 2px solid var(--text-secondary);
                    border-radius: 2px;
                    position: relative;
                    padding: 1px;
                }

                .battery-icon .level {
                    height: 100%;
                    background: #10b981;
                    border-radius: 1px;
                }

                /* Charts */
                .chart-section {
                    padding: 1.25rem;
                    margin-bottom: 1.5rem;
                    min-height: 300px;
                }

                /* Decision Feed */
                .decision-feed {
                    padding: 1.25rem;
                }

                .feed-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .feed-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255,255,255,0.03);
                    border-radius: 12px;
                    border-left: 3px solid transparent;
                }

                .feed-item.skip { border-left-color: #f59e0b; }
                .feed-item.start { border-left-color: #3b82f6; }
                .feed-item.power { border-left-color: #ef4444; }

                .feed-icon {
                    padding-top: 0.25rem;
                    color: var(--text-secondary);
                }

                .feed-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .feed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .feed-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .feed-time {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .feed-reason {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                }

                .feed-meta {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.25rem;
                }

                .meta-tag {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    background: rgba(255,255,255,0.05);
                }

                .meta-tag.saved { color: #10b981; background: rgba(16, 185, 129, 0.1); }
                .meta-tag.used { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }

                /* Pipeline */
                .growth-pipeline {
                    padding: 1.5rem;
                }

                .pipeline-steps {
                    display: flex;
                    justify-content: space-between;
                    position: relative;
                    margin-top: 1rem;
                }

                .pipeline-steps::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 0;
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    z-index: 0;
                    border-radius: 2px;
                }

                .step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    position: relative;
                    z-index: 1;
                    width: 100%;
                }

                .step-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--bg-card);
                    border: 2px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    transition: all 0.3s;
                }

                .step.completed .step-circle {
                    background: #10b981;
                    border-color: #10b981;
                    color: white;
                }

                .step.current .step-circle {
                    background: #3b82f6;
                    border-color: #3b82f6;
                    color: white;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
                    transform: scale(1.1);
                }

                .step-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-align: center;
                }

                .step.current .step-label {
                    color: #3b82f6;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}

export default AnalyticsDashboard;
