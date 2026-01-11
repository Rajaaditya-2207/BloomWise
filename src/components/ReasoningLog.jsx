import React, { useState } from 'react';
import { BrainCircuitIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon, AlertCircleIcon, CloudyIcon, SproutIcon, DropletsIcon } from './Icons';

/**
 * Reasoning Log Component
 * Displays the step-by-step thought process of the agent
 */
const ReasoningLog = ({ steps }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!steps || steps.length === 0) return null;

    // Helper to get icon for tool
    const getToolIcon = (toolName) => {
        if (toolName.includes('weather')) return <CloudyIcon size={14} />;
        if (toolName.includes('crop')) return <SproutIcon size={14} />;
        if (toolName.includes('irrigation')) return <DropletsIcon size={14} />;
        return <BrainCircuitIcon size={14} />;
    };

    // Helper to format tool name nicely
    const formatToolName = (name) => {
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace('Get ', '')
            .replace('Calculate ', 'Calc ');
    };

    return (
        <div className="reasoning-log-container">
            <button
                className={`reasoning-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="toggle-content">
                    <BrainCircuitIcon size={14} className="brain-icon" />
                    <span>View Reasoning Process</span>
                    <span className="step-count">({steps.filter(s => s.type === 'tool_result').length} steps)</span>
                </div>
                {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>

            {isExpanded && (
                <div className="reasoning-steps">
                    {steps.map((step, index) => {
                        // We primarily show tool results, but can show calls too if needed
                        // Merging call and result logic visually
                        if (step.type === 'tool_call') return null; // Skip calls, show results (which have summaries)

                        const isSuccess = step.result === 'success';

                        return (
                            <div key={index} className="reasoning-step">
                                <div className={`step-status ${isSuccess ? 'success' : 'error'}`}>
                                    {isSuccess ? <CheckIcon size={12} /> : <AlertCircleIcon size={12} />}
                                </div>
                                <div className="step-content">
                                    <div className="step-header">
                                        <span className="tool-icon">{getToolIcon(step.tool)}</span>
                                        <span className="tool-name">{formatToolName(step.tool)}</span>
                                    </div>
                                    <p className="step-summary">{step.summary || 'Processed data'}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .reasoning-log-container {
                    margin: 0.5rem 0;
                    width: 100%;
                }

                .reasoning-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .reasoning-toggle:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: var(--text-primary);
                }

                .toggle-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .brain-icon {
                    color: var(--accent-color);
                }

                .step-count {
                    opacity: 0.6;
                    font-size: 0.7rem;
                }

                .reasoning-steps {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    animation: slideDown 0.2s ease-out;
                }

                .reasoning-step {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.5rem;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    align-items: flex-start;
                }

                .step-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .step-status.success {
                    background: rgba(16, 185, 129, 0.2);
                    color: #10b981;
                }

                .step-status.error {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .step-content {
                    flex: 1;
                }

                .step-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                }

                .tool-icon {
                    display: flex;
                    opacity: 0.7;
                }

                .tool-name {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    opacity: 0.9;
                }

                .step-summary {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.3;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Light theme adjustments */
                [data-theme="light"] .reasoning-toggle {
                    background: rgba(0, 0, 0, 0.03);
                    border-color: rgba(0, 0, 0, 0.1);
                }

                [data-theme="light"] .reasoning-toggle:hover {
                    background: rgba(0, 0, 0, 0.06);
                }

                [data-theme="light"] .reasoning-steps {
                    background: rgba(0, 0, 0, 0.03);
                    border-color: rgba(0, 0, 0, 0.05);
                }

                [data-theme="light"] .reasoning-step {
                    background: white;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

export default ReasoningLog;
