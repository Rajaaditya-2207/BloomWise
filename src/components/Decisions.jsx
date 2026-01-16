import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { AgentIcon, WaterIcon, PauseIcon } from './Icons';
import { supabase } from '../services/supabase';
import { agentDecisionLog } from '../services/agentDecisionLog';

function Decisions() {
  const { farm } = useApp();
  const { t, language } = useLanguage();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchDecisions() {
      const isPreview = location.pathname.startsWith('/preview');
      const isDemo = farm?.isDemo || isPreview;

      if (!farm?.id && !isDemo) return;

      try {
        setLoading(true);

        if (isDemo) {
          // Use mock data for demo
          const mockData = await agentDecisionLog.getDecisions(true, 50);
          setDecisions(mockData || []);
        } else {
          // Fetch real data
          const { data, error } = await supabase
            .from('agent_decisions')
            .select('*')
            .eq('farmer_id', farm.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) throw error;
          setDecisions(data || []);
        }
      } catch (err) {
        console.error('Error fetching decisions:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDecisions();
  }, [farm?.id, location.pathname]);

  // Group decisions by date
  const groupedByDate = decisions.reduce((acc, d) => {
    const date = d.created_at?.split('T')[0] || 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(d);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  return (
    <div className="decisions-page">
      <header className="page-header glass-card">
        <h1><AgentIcon size={28} /> {t('nav_decisions') || 'Agent Decisions'}</h1>
        <p>Hourly irrigation analysis by the Digital Twin</p>
      </header>

      {loading ? (
        <div className="loading-state glass-card">Loading decisions...</div>
      ) : dates.length === 0 ? (
        <div className="empty-state glass-card">
          No decisions recorded yet. The agent will start logging soon.
        </div>
      ) : (
        <div className="date-list">
          {dates.map(date => {
            const dayDecisions = groupedByDate[date];
            const irrigateCount = dayDecisions.filter(d => d.action === 'IRRIGATE').length;
            const totalWater = dayDecisions.reduce((sum, d) => sum + (d.water_used || 0), 0);

            return (
              <div key={date} className="date-card glass-card">
                <div className="date-header">
                  <span className="date-label">{formatDate(date)}</span>
                  <span className="date-summary">
                    {irrigateCount} irrigations · {(totalWater / 1000).toFixed(1)}K L
                  </span>
                </div>
                <div className="decisions-list">
                  {dayDecisions.slice(0, 10).map((d, idx) => (
                    <div key={d.id || idx} className={`decision-item ${d.action?.toLowerCase()}`}>
                      <span className="time">{formatTime(d.created_at || d.timestamp)}</span>
                      <span className={`action-badge ${d.action === 'IRRIGATE' ? 'irrigate' : 'skip'}`}>
                        {d.action === 'IRRIGATE' ? <WaterIcon size={12} /> : <PauseIcon size={12} />}
                        {d.action}
                      </span>
                      <span className="reason">{d.reason}</span>
                    </div>
                  ))}
                  {dayDecisions.length > 10 && (
                    <div className="more-indicator">+{dayDecisions.length - 10} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
                .decisions-page {
                    padding: 1rem;
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .page-header {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .page-header h1 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.5rem;
                    color: var(--text-primary);
                }
                .page-header p {
                    margin: 0;
                    color: var(--text-secondary);
                }
                .loading-state, .empty-state {
                    padding: 3rem;
                    text-align: center;
                    color: var(--text-muted);
                }
                .date-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .date-card {
                    padding: 0;
                    overflow: hidden;
                }
                .date-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid var(--border-glass);
                    background: rgba(255,255,255,0.03);
                }
                .date-label {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .date-summary {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                }
                .decisions-list {
                    padding: 0.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .decision-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                }
                .decision-item.irrigate {
                    background: rgba(59, 130, 246, 0.05);
                }
                .decision-item.skip {
                    background: rgba(107, 114, 128, 0.05);
                }
                .time {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    min-width: 60px;
                }
                .action-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.15rem 0.5rem;
                    border-radius: 50px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    min-width: 70px;
                    justify-content: center;
                }
                .action-badge.irrigate { background: rgba(59,130,246,0.2); color: #60a5fa; }
                .action-badge.skip { background: rgba(107,114,128,0.2); color: #9ca3af; }
                .reason {
                    color: var(--text-secondary);
                    flex: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .more-indicator {
                    text-align: center;
                    padding: 0.5rem;
                    color: var(--text-muted);
                    font-size: 0.75rem;
                }
            `}</style>
    </div>
  );
}

export default Decisions;
