/**
 * Background Agent Service
 * Runs autonomously to monitor conditions and send irrigation signals
 */

import { runAgentLoop } from './agentLoop';
import { toolHandlers } from './agentTools';
import { agentMemory } from './agentMemory';
import { supabase } from './supabase';

const INTERVAL_MS = parseInt(import.meta.env.VITE_AGENT_INTERVAL_MS) || 1800000; // 30 minutes default
const AGENT_ENABLED = import.meta.env.VITE_AGENT_ENABLED !== 'false';

let intervalId = null;
let isRunning = false;
let lastCheck = null;
let listeners = [];

/**
 * Background Agent Controller
 */
class BackgroundAgent {
    constructor() {
        this.status = 'idle';
        this.lastCheck = null;
        this.lastDecision = null;
        this.checkCount = 0;
    }

    /**
     * Start the background agent
     */
    start() {
        if (!AGENT_ENABLED) {
            console.log('Background agent disabled via config');
            return;
        }

        if (intervalId) {
            console.log('Background agent already running');
            return;
        }

        console.log(`Starting background agent (interval: ${INTERVAL_MS / 1000}s)`);
        this.status = 'running';

        // Run immediately on start
        this.runCheck();

        // Then run on interval
        intervalId = setInterval(() => this.runCheck(), INTERVAL_MS);

        this.notifyListeners('started');
    }

    /**
     * Stop the background agent
     */
    stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        this.status = 'stopped';
        this.notifyListeners('stopped');
        console.log('Background agent stopped');
    }

    /**
     * Run a single check cycle
     */
    async runCheck() {
        if (isRunning) {
            console.log('Check already in progress, skipping');
            return;
        }

        const context = agentMemory.getContext();
        if (!context.farmerId) {
            console.log('No farmer registered, skipping background check');
            return;
        }

        isRunning = true;
        this.status = 'checking';
        this.checkCount++;
        this.lastCheck = new Date().toISOString();

        console.log(`Background agent check #${this.checkCount} at ${this.lastCheck}`);
        this.notifyListeners('checking');

        try {
            // Step 1: Get current weather
            const weather = await toolHandlers.get_weather({
                latitude: context.farm?.latitude || 18.52,
                longitude: context.farm?.longitude || 73.85,
                days: 2
            });

            // Step 2: Get crop info
            const cropInfo = await toolHandlers.get_crop_info({
                cropId: context.crop?.primary_crop || 'wheat',
                daysAfterPlanting: context.crop?.daysAfterPlanting || 45
            });

            // Step 3: Calculate irrigation need
            const et0 = weather.summary?.todayEt0 || 5.0;
            const kc = cropInfo.kc || 1.0;
            const rainfall = weather.daily?.[0]?.precipitationSum || 0;
            const areaHa = context.farm?.land_size_ha || 2;

            const irrigation = await toolHandlers.calculate_irrigation({
                et0,
                kc,
                rainfall,
                areaHectares: areaHa,
                soilId: context.farm?.soil_type || 'alluvial'
            });

            // Step 4: Decide action
            const conditions = {
                temperature: weather.current?.temperature || 30,
                humidity: weather.current?.humidity || 60,
                soilMoisture: weather.current?.soilMoisture || 0.5,
                growthStage: cropInfo.growthStage || 'development',
                rainProbability: weather.rainAlerts?.[0]?.probability || 0,
                et0,
                kc
            };

            let action = 'IRRIGATE';
            let reasoning = '';

            // Decision logic
            if (weather.rainAlerts?.length > 0 && weather.rainAlerts[0].probability > 60) {
                action = 'SKIP';
                reasoning = `Rain expected with ${weather.rainAlerts[0].probability}% probability. Skipping irrigation to save water.`;
            } else if (conditions.soilMoisture > 0.7) {
                action = 'SKIP';
                reasoning = `Soil moisture at ${(conditions.soilMoisture * 100).toFixed(0)}%. No irrigation needed.`;
            } else if (!irrigation.shouldIrrigate) {
                action = 'SKIP';
                reasoning = `Water requirement (${irrigation.recommendation?.waterMm}mm) below threshold.`;
            } else {
                action = 'IRRIGATE';
                reasoning = `ET₀=${et0}mm, Kc=${kc}. Crop needs ${irrigation.recommendation?.waterMm}mm (${irrigation.recommendation?.totalLiters} liters).`;
            }

            // Step 5: Send signal
            const signal = await toolHandlers.send_irrigation_signal({
                action,
                waterAmountLiters: irrigation.recommendation?.totalLiters || 0,
                durationMins: irrigation.recommendation?.estimatedDurationMins || 0,
                reasoning,
                conditions,
                farmerId: context.farmerId
            });

            // Step 6: Log to database
            try {
                await supabase.from('irrigation_logs').insert([{
                    farmer_id: context.farmerId,
                    date: new Date().toISOString().split('T')[0],
                    water_used_liters: action === 'IRRIGATE' ? irrigation.recommendation?.totalLiters : 0,
                    water_saved_liters: action === 'SKIP' ? irrigation.recommendation?.totalLiters : 0,
                    rain_avoided: action === 'SKIP' && weather.rainAlerts?.length > 0,
                    et0_mm: et0,
                    kc_value: kc,
                    crop_stage: cropInfo.growthStage
                }]);
            } catch (e) {
                console.warn('Failed to log irrigation:', e);
            }

            this.lastDecision = {
                action,
                reasoning,
                conditions,
                signal: signal.signal,
                timestamp: this.lastCheck
            };

            this.status = 'idle';
            this.notifyListeners('completed', this.lastDecision);

        } catch (error) {
            console.error('Background agent error:', error);
            this.status = 'error';
            this.notifyListeners('error', error.message);
        } finally {
            isRunning = false;
        }
    }

    /**
     * Force an immediate check
     */
    forceCheck() {
        return this.runCheck();
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            status: this.status,
            lastCheck: this.lastCheck,
            lastDecision: this.lastDecision,
            checkCount: this.checkCount,
            intervalMs: INTERVAL_MS,
            enabled: AGENT_ENABLED
        };
    }

    /**
     * Add a listener for status changes
     */
    addListener(callback) {
        listeners.push(callback);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, data = null) {
        listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    }
}

// Singleton instance
export const backgroundAgent = new BackgroundAgent();
export default backgroundAgent;
