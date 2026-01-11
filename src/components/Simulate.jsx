import React, { useState, useEffect, useRef } from 'react';
import { useApp, useLanguage } from '../App';
import { WaterIcon, PlantIcon, SunIcon, CloudRainIcon, PowerIcon, AgentIcon, SignalIcon, ChartIcon, SimulateIcon, StopIcon } from './Icons';
import { agentDecisionLog } from '../services/agentDecisionLog';

/**
 * Simulate Page - Mock Data Generation & Agent Decision Simulation
 * Shows real-time simulation of AI agent making irrigation decisions
 * and sending signals to hardware
 */
function Simulate() {
    const { farm, weather } = useApp();
    const { t, language } = useLanguage();

    // Simulation state
    const [isRunning, setIsRunning] = useState(false);
    const [signals, setSignals] = useState([]);
    const [currentData, setCurrentData] = useState(null);
    const [agentThinking, setAgentThinking] = useState(false);
    const [hardwareStatus, setHardwareStatus] = useState({ connected: false, pumpRunning: false });
    const intervalRef = useRef(null);
    const signalLogRef = useRef(null);

    // Generate random mock sensor data
    const generateMockData = () => {
        return {
            timestamp: new Date(),
            soilMoisture: Math.floor(Math.random() * 60) + 20, // 20-80%
            temperature: Math.floor(Math.random() * 20) + 25, // 25-45°C
            humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
            rainProbability: Math.floor(Math.random() * 100), // 0-100%
            powerAvailable: Math.random() > 0.3, // 70% chance power is available
            cropStage: ['Initial', 'Development', 'Mid-Season', 'Late-Season'][Math.floor(Math.random() * 4)],
            etValue: (Math.random() * 4 + 2).toFixed(2), // 2-6 mm/day
        };
    };

    // AI Agent decision logic
    const makeAgentDecision = (data) => {
        let decision = {
            shouldIrrigate: false,
            reason: '',
            action: 'SKIP',
            waterAmount: 0,
            duration: 0,
            confidence: 0
        };

        // Decision tree
        if (data.rainProbability > 60) {
            decision = {
                shouldIrrigate: false,
                reason: t('rain_high'),
                action: 'SKIP_RAIN',
                waterAmount: 0,
                duration: 0,
                confidence: 95
            };
        } else if (data.soilMoisture > 60) {
            decision = {
                shouldIrrigate: false,
                reason: t('soil_moisture_adequate'),
                action: 'SKIP_MOISTURE',
                waterAmount: 0,
                duration: 0,
                confidence: 90
            };
        } else if (!data.powerAvailable) {
            decision = {
                shouldIrrigate: false,
                reason: t('power_unavailable'),
                action: 'SKIP_POWER',
                waterAmount: 0,
                duration: 0,
                confidence: 100
            };
        } else if (data.soilMoisture < 35) {
            const waterNeeded = Math.floor((50 - data.soilMoisture) * 100);
            decision = {
                shouldIrrigate: true,
                reason: t('irrigation_needed_dry'),
                action: 'IRRIGATE',
                waterAmount: waterNeeded,
                duration: Math.floor(waterNeeded / 50),
                confidence: 85
            };
        } else {
            decision = {
                shouldIrrigate: false,
                reason: t('no_irrigation_needed'),
                action: 'SKIP_NORMAL',
                waterAmount: 0,
                duration: 0,
                confidence: 80
            };
        }

        return decision;
    };

    // Send hardware signal (simulated)
    const sendHardwareSignal = (decision) => {
        const signal = {
            id: Date.now(),
            timestamp: new Date(),
            type: decision.shouldIrrigate ? 'ACTIVATE_PUMP' : 'STANDBY',
            payload: {
                action: decision.action,
                pumpId: 'PUMP_001',
                zone: 'ZONE_A',
                waterAmount: decision.waterAmount,
                duration: decision.duration,
                status: 'SENT'
            },
            decision: decision
        };

        // Simulate hardware response
        setTimeout(() => {
            setHardwareStatus(prev => ({
                ...prev,
                connected: true,
                pumpRunning: decision.shouldIrrigate
            }));

            // Update signal status
            setSignals(prev => prev.map(s =>
                s.id === signal.id ? { ...s, payload: { ...s.payload, status: 'ACKNOWLEDGED' } } : s
            ));
        }, 500);

        return signal;
    };

    // Run simulation cycle
    const runSimulationCycle = () => {
        setAgentThinking(true);

        // Generate mock data
        const mockData = generateMockData();
        setCurrentData(mockData);

        // Wait for "thinking" animation
        setTimeout(() => {
            // Make decision
            const decision = makeAgentDecision(mockData);

            // Log decision to the decision log service (for analytics)
            const waterSaved = decision.shouldIrrigate ? 0 : Math.floor(Math.random() * 2000) + 1500;
            agentDecisionLog.logDecision({
                ...decision,
                sensorData: mockData,
                waterSaved
            }, farm?.isDemo);

            // Send hardware signal
            const signal = sendHardwareSignal(decision);

            setSignals(prev => [signal, ...prev].slice(0, 20)); // Keep last 20 signals
            setAgentThinking(false);

            // Auto-scroll signal log
            if (signalLogRef.current) {
                signalLogRef.current.scrollTop = 0;
            }
        }, 1500);
    };

    // Start/Stop simulation
    const toggleSimulation = () => {
        if (isRunning) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setHardwareStatus({ connected: false, pumpRunning: false });
        } else {
            setIsRunning(true);
            setHardwareStatus({ connected: true, pumpRunning: false });
            runSimulationCycle();
            intervalRef.current = setInterval(runSimulationCycle, 5000); // Every 5 seconds
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Load signal history on mount
    useEffect(() => {
        const loadHistory = async () => {
            const history = await agentDecisionLog.getDecisions(farm?.isDemo || true, 10);
            const formattedSignals = history.map(h => ({
                id: h.id || Date.now(),
                timestamp: new Date(h.timestamp),
                type: h.action === 'IRRIGATE' ? 'ACTIVATE_PUMP' : 'STANDBY',
                payload: {
                    action: h.action,
                    pumpId: 'PUMP_001',
                    zone: 'ZONE_A',
                    waterAmount: h.waterUsed,
                    duration: h.duration,
                    status: 'ACKNOWLEDGED'
                },
                decision: {
                    shouldIrrigate: h.action === 'IRRIGATE',
                    reason: h.reason,
                    action: h.action,
                    confidence: h.confidence
                }
            }));
            setSignals(formattedSignals);
        };
        loadHistory();
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="simulate-page">
            {/* Header */}
            <header className="simulate-header glass-card">
                <div className="header-content">
                    <h1 className="header-title"><AgentIcon size={28} className="header-icon" /> {t('agent_simulation')}</h1>
                    <p>{t('watch_agent')}</p>
                </div>
                <button
                    className={`simulate-btn ${isRunning ? 'running' : ''}`}
                    onClick={toggleSimulation}
                >
                    {isRunning ? (
                        <><StopIcon size={20} /> {t('simulate_stop')}</>
                    ) : (
                        <><SimulateIcon size={20} /> {t('simulate_start')}</>
                    )}
                </button>
            </header>

            {/* Hardware Status */}
            <section className="hardware-status glass-card">
                <h3><PowerIcon size={20} className="section-icon" /> {t('hardware_status')}</h3>
                <div className="status-grid">
                    <div className={`status-item ${hardwareStatus.connected ? 'connected' : ''}`}>
                        <span className="status-dot"></span>
                        <span>{t('connection')}</span>
                        <span className="status-value">
                            {hardwareStatus.connected ? t('connected') : t('disconnected')}
                        </span>
                    </div>
                    <div className={`status-item ${hardwareStatus.pumpRunning ? 'active' : ''}`}>
                        <span className="status-dot"></span>
                        <span>{t('pump')}</span>
                        <span className="status-value">
                            {hardwareStatus.pumpRunning ? t('running') : t('off')}
                        </span>
                    </div>
                </div>
            </section>

            {/* Current Sensor Data */}
            {currentData && (
                <section className="sensor-data glass-card">
                    <h3><ChartIcon size={20} className="section-icon" /> {t('sensor_data_mock')}</h3>
                    <div className="sensor-grid">
                        <div className="sensor-item">
                            <WaterIcon size={24} />
                            <span className="sensor-label">{t('soil_moisture')}</span>
                            <span className="sensor-value">{currentData.soilMoisture}%</span>
                        </div>
                        <div className="sensor-item">
                            <SunIcon size={24} />
                            <span className="sensor-label">{t('temperature_label')}</span>
                            <span className="sensor-value">{currentData.temperature}°C</span>
                        </div>
                        <div className="sensor-item">
                            <CloudRainIcon size={24} />
                            <span className="sensor-label">{t('rain_chance')}</span>
                            <span className="sensor-value">{currentData.rainProbability}%</span>
                        </div>
                        <div className="sensor-item">
                            <PowerIcon size={24} />
                            <span className="sensor-label">{t('power')}</span>
                            <span className="sensor-value">{currentData.powerAvailable ? '✅' : '❌'}</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Agent Thinking Animation */}
            {agentThinking && (
                <section className="agent-thinking glass-card">
                    <div className="thinking-animation">
                        <span className="thinking-dot"></span>
                        <span className="thinking-dot"></span>
                        <span className="thinking-dot"></span>
                    </div>
                    <p><AgentIcon size={20} className="thinking-icon" /> {t('agent_analyzing')}</p>
                </section>
            )}

            {/* Signal History */}
            <section className="signal-log glass-card">
                <h3><SignalIcon size={20} className="section-icon" /> {t('signal_log')}</h3>
                <div className="signal-list" ref={signalLogRef}>
                    {signals.length === 0 ? (
                        <p className="no-signals">{t('start_simulation_hint')}</p>
                    ) : (
                        signals.map(signal => (
                            <div key={signal.id} className={`signal-item ${signal.decision.shouldIrrigate ? 'irrigate' : 'skip'}`}>
                                <div className="signal-header">
                                    <span className="signal-time">{formatTime(signal.timestamp)}</span>
                                    <span className={`signal-status ${signal.payload.status.toLowerCase()}`}>
                                        {signal.payload.status}
                                    </span>
                                </div>
                                <div className="signal-content">
                                    <span className="signal-action">{signal.payload.action}</span>
                                    <span className="signal-reason">{signal.decision.reason}</span>
                                </div>
                                {signal.decision.shouldIrrigate && (
                                    <div className="signal-details">
                                        <span>💧 {signal.decision.waterAmount}L</span>
                                        <span>⏱️ {signal.decision.duration} min</span>
                                        <span>📊 {signal.decision.confidence}% confidence</span>
                                    </div>
                                )}
                                <div className="signal-json">
                                    <code>{JSON.stringify(signal.payload, null, 2)}</code>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <style>{`
                .simulate-page {
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-width: 600px;
                    margin: 0 auto;
                }

                .simulate-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .simulate-header h1 {
                    font-size: 1.5rem;
                    margin: 0;
                    color: var(--text-primary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .header-icon, .section-icon, .thinking-icon {
                    color: var(--accent-primary);
                    flex-shrink: 0;
                }

                .simulate-header p {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .hardware-status h3, .sensor-data h3, .signal-log h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .agent-thinking p {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-primary);
                }

                .simulate-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                    box-shadow: 0 4px 15px var(--accent-glow);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .simulate-btn.running {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                }

                .simulate-btn:hover {
                    transform: scale(1.05);
                }

                .hardware-status h3, .sensor-data h3, .signal-log h3 {
                    margin: 0 0 1rem;
                    color: var(--text-primary);
                    font-size: 1.1rem;
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .status-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: var(--bg-glass);
                    border-radius: var(--radius-md);
                    text-align: center;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #6b7280;
                }

                .status-item.connected .status-dot,
                .status-item.active .status-dot {
                    background: #10b981;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .status-value {
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .sensor-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .sensor-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: var(--bg-glass);
                    border-radius: var(--radius-md);
                }

                .sensor-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .sensor-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .agent-thinking {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 1.5rem;
                    gap: 1rem;
                }

                .thinking-animation {
                    display: flex;
                    gap: 0.5rem;
                }

                .thinking-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: var(--accent-primary);
                    animation: bounce 1.4s infinite ease-in-out;
                }

                .thinking-dot:nth-child(1) { animation-delay: 0s; }
                .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
                .thinking-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }

                .signal-list {
                    max-height: 400px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .no-signals {
                    text-align: center;
                    color: var(--text-muted);
                    padding: 2rem;
                }

                .signal-item {
                    padding: 1rem;
                    background: var(--bg-glass);
                    border-radius: var(--radius-md);
                    border-left: 4px solid var(--success);
                }

                .signal-item.irrigate {
                    border-left-color: var(--water);
                }

                .signal-item.skip {
                    border-left-color: var(--warning);
                }

                .signal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .signal-time {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .signal-status {
                    font-size: 0.65rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 50px;
                    font-weight: 600;
                }

                .signal-status.sent {
                    background: var(--warning);
                    color: white;
                }

                .signal-status.acknowledged {
                    background: var(--success);
                    color: white;
                }

                .signal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .signal-action {
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .signal-reason {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .signal-details {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .signal-json {
                    margin-top: 0.75rem;
                    padding: 0.5rem;
                    background: rgba(0,0,0,0.2);
                    border-radius: var(--radius-sm);
                    overflow-x: auto;
                }

                .signal-json code {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    white-space: pre;
                }
            `}</style>
        </div>
    );
}

export default Simulate;
