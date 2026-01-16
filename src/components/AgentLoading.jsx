import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backgroundAgent } from '../services/backgroundAgent';
import { AgentIcon, CheckIcon, RefreshIcon } from './Icons';

/**
 * Loading screen shown after login/registration
 * Waits for background agent to complete first data sync
 */
function AgentLoading() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('initializing');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('Initializing agent...');

    useEffect(() => {
        let mounted = true;
        let checkInterval;

        async function runAgentAndWait() {
            try {
                // Phase 1: Starting
                setStatus('starting');
                setMessage('Starting Digital Twin agent...');
                setProgress(10);

                // Start the agent
                backgroundAgent.start();

                // Phase 2: Running
                setStatus('running');
                setMessage('Agent is analyzing your farm data...');
                setProgress(30);

                // Wait for agent to complete its cycle
                await new Promise((resolve) => {
                    const startTime = Date.now();
                    const maxWait = 30000; // 30 seconds max wait

                    checkInterval = setInterval(() => {
                        const agentStatus = backgroundAgent.getStatus();
                        const elapsed = Date.now() - startTime;

                        // Update progress based on time and status
                        if (agentStatus.status === 'simulating') {
                            setMessage('Simulating farm conditions...');
                            setProgress(Math.min(70, 30 + (elapsed / maxWait) * 40));
                        } else if (agentStatus.status === 'idle' && agentStatus.checkCount > 0) {
                            // Agent completed at least one cycle
                            clearInterval(checkInterval);
                            resolve();
                        } else if (elapsed > maxWait) {
                            // Timeout - proceed anyway
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 500);
                });

                if (!mounted) return;

                // Phase 3: Complete
                setStatus('complete');
                setMessage('Database updated successfully!');
                setProgress(100);

                // Short delay to show success, then navigate
                await new Promise(r => setTimeout(r, 1500));
                if (mounted) {
                    navigate('/home');
                }

            } catch (error) {
                console.error('Agent loading error:', error);
                if (mounted) {
                    setStatus('error');
                    setMessage('Error loading data. Proceeding anyway...');
                    setTimeout(() => navigate('/home'), 2000);
                }
            }
        }

        runAgentAndWait();

        return () => {
            mounted = false;
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [navigate]);

    return (
        <div className="agent-loading-page">
            <div className="loading-card glass-card">
                <div className={`agent-icon-container ${status}`}>
                    {status === 'complete' ? (
                        <CheckIcon size={48} />
                    ) : (
                        <AgentIcon size={48} />
                    )}
                </div>

                <h2>
                    {status === 'complete' ? 'Ready!' : 'Setting Up Your Farm'}
                </h2>

                <p className="status-message">{message}</p>

                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="progress-text">{Math.round(progress)}%</span>
                </div>

                {status === 'running' && (
                    <div className="loading-details">
                        <RefreshIcon size={16} className="spin" />
                        <span>Generating historical data...</span>
                    </div>
                )}
            </div>

            <style>{`
                .agent-loading-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: var(--bg-primary);
                }

                .loading-card {
                    max-width: 400px;
                    width: 100%;
                    padding: 3rem 2rem;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }

                .agent-icon-container {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
                    color: white;
                    transition: all 0.3s ease;
                }

                .agent-icon-container.starting,
                .agent-icon-container.running {
                    animation: pulse 1.5s ease-in-out infinite;
                }

                .agent-icon-container.complete {
                    background: linear-gradient(135deg, #10b981, #059669);
                    animation: none;
                }

                .agent-icon-container.error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }

                .loading-card h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: var(--text-primary);
                }

                .status-message {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 1rem;
                }

                .progress-container {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    min-width: 45px;
                }

                .loading-details {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.875rem;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default AgentLoading;
