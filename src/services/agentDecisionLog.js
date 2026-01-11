/**
 * Agent Decision Log Service
 * Stores and retrieves agent decisions for analytics
 * - Demo mode: Uses localStorage cache with pre-populated data
 * - User mode: Logs to and fetches from Supabase
 */

import { supabase } from './supabase';

const DECISION_LOG_KEY = 'krishi_agent_decisions';
const MAX_DECISIONS = 50;

// Pre-populated demo data to showcase agent functionality
const DEMO_DECISIONS = [
    {
        id: 'demo-1',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        action: 'SKIP_RAIN',
        reason: 'Heavy rain forecast detected (85% probability)',
        confidence: 95,
        sensorData: { soilMoisture: 45, temperature: 28, rainProbability: 85, powerAvailable: true },
        waterSaved: 2500
    },
    {
        id: 'demo-2',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        action: 'IRRIGATE',
        reason: 'Soil moisture critically low (28%)',
        confidence: 92,
        sensorData: { soilMoisture: 28, temperature: 32, rainProbability: 10, powerAvailable: true },
        waterUsed: 1800,
        duration: 36
    },
    {
        id: 'demo-3',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        action: 'SKIP_MOISTURE',
        reason: 'Soil moisture adequate (62%)',
        confidence: 88,
        sensorData: { soilMoisture: 62, temperature: 26, rainProbability: 20, powerAvailable: true },
        waterSaved: 2200
    },
    {
        id: 'demo-4',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        action: 'SKIP_POWER',
        reason: 'Power outage detected - rescheduled to evening',
        confidence: 100,
        sensorData: { soilMoisture: 38, temperature: 35, rainProbability: 5, powerAvailable: false },
        waterSaved: 0
    },
    {
        id: 'demo-5',
        timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 1.25 days ago
        action: 'IRRIGATE',
        reason: 'Scheduled evening irrigation cycle',
        confidence: 85,
        sensorData: { soilMoisture: 35, temperature: 30, rainProbability: 15, powerAvailable: true },
        waterUsed: 2100,
        duration: 42
    },
    {
        id: 'demo-6',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        action: 'SKIP_RAIN',
        reason: 'Rain expected tomorrow - postponing irrigation',
        confidence: 90,
        sensorData: { soilMoisture: 42, temperature: 29, rainProbability: 75, powerAvailable: true },
        waterSaved: 2300
    }
];

/**
 * Agent Decision Log Manager
 */
class AgentDecisionLog {
    constructor() {
        this.decisions = [];
        this.load();
    }

    /**
     * Load decisions from localStorage (for demo/offline)
     */
    load() {
        try {
            const saved = localStorage.getItem(DECISION_LOG_KEY);
            if (saved) {
                this.decisions = JSON.parse(saved);
            } else {
                // Pre-populate with demo data on first load
                this.decisions = [...DEMO_DECISIONS];
                this.save();
            }
        } catch (e) {
            console.warn('Failed to load agent decisions:', e);
            this.decisions = [...DEMO_DECISIONS];
        }
    }

    /**
     * Save decisions to localStorage
     */
    save() {
        try {
            localStorage.setItem(DECISION_LOG_KEY, JSON.stringify(this.decisions));
        } catch (e) {
            console.warn('Failed to save agent decisions:', e);
        }
    }

    /**
     * Log a new decision (from simulation or background agent)
     */
    logDecision(decision, isDemo = false) {
        const entry = {
            id: `decision-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: decision.action,
            reason: decision.reason,
            confidence: decision.confidence,
            sensorData: decision.sensorData || {},
            waterUsed: decision.waterAmount || 0,
            waterSaved: decision.waterSaved || 0,
            duration: decision.duration || 0
        };

        // Add to local cache
        this.decisions.unshift(entry);
        if (this.decisions.length > MAX_DECISIONS) {
            this.decisions = this.decisions.slice(0, MAX_DECISIONS);
        }
        this.save();

        // For non-demo users, also log to Supabase
        if (!isDemo) {
            this.logToSupabase(entry);
        }

        return entry;
    }

    /**
     * Log decision to Supabase for persistence
     */
    async logToSupabase(entry) {
        try {
            const { error } = await supabase
                .from('agent_decisions')
                .insert({
                    action: entry.action,
                    reason: entry.reason,
                    confidence: entry.confidence,
                    sensor_data: entry.sensorData,
                    water_used: entry.waterUsed,
                    water_saved: entry.waterSaved,
                    duration_minutes: entry.duration
                });

            if (error) {
                console.warn('Failed to log decision to Supabase:', error);
            }
        } catch (e) {
            // Suppress 404/network errors in dev/demo mode
            console.log('Supabase logging skipped (Demo/Offline mode):', e.message);
        }
    }

    /**
     * Get decisions for analytics (demo uses cache, users fetch from Supabase)
     */
    async getDecisions(isDemo = false, limit = 20) {
        if (isDemo) {
            // Return cached decisions for demo
            return this.decisions.slice(0, limit);
        }

        // For real users, fetch from Supabase
        try {
            const { data, error } = await supabase
                .from('agent_decisions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.warn('Failed to fetch from Supabase, using cache:', error);
                return this.decisions.slice(0, limit);
            }

            // Transform Supabase data to match our format
            return data.map(row => ({
                id: row.id,
                timestamp: row.created_at,
                action: row.action,
                reason: row.reason,
                confidence: row.confidence,
                sensorData: row.sensor_data,
                waterUsed: row.water_used,
                waterSaved: row.water_saved,
                duration: row.duration_minutes
            }));
        } catch (e) {
            console.warn('Supabase fetch error, using cache:', e);
            return this.decisions.slice(0, limit);
        }
    }

    /**
     * Get summary statistics for analytics
     */
    async getStats(isDemo = false) {
        const decisions = await this.getDecisions(isDemo, 50);

        const totalWaterSaved = decisions.reduce((sum, d) => sum + (d.waterSaved || 0), 0);
        const totalWaterUsed = decisions.reduce((sum, d) => sum + (d.waterUsed || 0), 0);
        const avgConfidence = decisions.length > 0
            ? Math.round(decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length)
            : 0;

        const actionCounts = decisions.reduce((acc, d) => {
            acc[d.action] = (acc[d.action] || 0) + 1;
            return acc;
        }, {});

        return {
            totalDecisions: decisions.length,
            totalWaterSaved,
            totalWaterUsed,
            avgConfidence,
            actionCounts,
            skippedCount: (actionCounts.SKIP_RAIN || 0) + (actionCounts.SKIP_MOISTURE || 0) + (actionCounts.SKIP_POWER || 0),
            irrigatedCount: actionCounts.IRRIGATE || 0
        };
    }

    /**
     * Clear all decisions and reset to preset demo data
     */
    clear() {
        this.decisions = [...DEMO_DECISIONS];
        this.save();
    }

    /**
     * Reset to demo data
     */
    resetToDemo() {
        this.decisions = [...DEMO_DECISIONS];
        this.save();
    }
}

// Singleton instance
export const agentDecisionLog = new AgentDecisionLog();
export default agentDecisionLog;
