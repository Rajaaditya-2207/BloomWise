/**
 * Background Agent Service (Digital Twin)
 * Runs hourly to Simulate & Log farm state
 * 
 * HYBRID MODE:
 * - Live users: Calls backend scheduler API
 * - Demo users: Uses local deterministic physics simulation
 */

import { agentMemory } from './agentMemory';
import { supabase } from './supabase';
import { getWeatherRange, getWeatherForDate } from './weatherCacheService';
import { backgroundBrain } from './backgroundBrain';

const INTERVAL_MS = 60 * 60 * 1000; // 1 Hour

// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Power Schedule Definitions
const POWER_SCHEDULES = {
    morning: [6, 7, 8, 9],
    evening: [18, 19, 20, 21],
    night: [22, 23, 0, 1, 2, 3, 4, 5],
    morning_evening: [6, 7, 8, 9, 18, 19, 20, 21],
    all_day: Array.from({ length: 24 }, (_, i) => i)
};

// Singleton State
let intervalId = null;
let isRunning = false;
let listeners = [];
let useBackendScheduler = false; // Toggle for backend vs local

/**
 * Check if backend scheduler is available
 */
async function checkBackendScheduler() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/scheduler/status`, {
            signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
            const data = await response.json();
            return { available: true, ...data };
        }
        return { available: false };
    } catch {
        return { available: false };
    }
}

/**
 * Get scheduler status from backend
 */
export async function getBackendSchedulerStatus() {
    return await checkBackendScheduler();
}

/**
 * Trigger backend scheduler manually
 */
export async function triggerBackendScheduler() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/scheduler/trigger`, {
            method: 'POST'
        });
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }
}

class BackgroundAgent {
    constructor() {
        this.status = 'idle';
        this.lastCheck = null;
        this.checkCount = 0;
    }

    start() {
        if (intervalId) return;
        console.log(`[DigitalTwin] Starting hourly simulation loop...`);
        this.runCycle(); // Run immediately
        intervalId = setInterval(() => this.runCycle(), INTERVAL_MS);
        this.status = 'running';
    }

    stop() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        this.status = 'stopped';
    }

    isPowerAvailable(powerScheduleId, hour) {
        const hours = POWER_SCHEDULES[powerScheduleId] || POWER_SCHEDULES.morning_evening;
        return hours.includes(hour);
    }

    async runCycle() {
        if (isRunning) return;

        const context = agentMemory.getContext();
        // Only run for Real Users (Not Demo)
        if (!context.farmerId || context.farm?.isDemo) return;

        // Validate farmer exists in database before proceeding
        const { data: farmerExists, error: checkError } = await supabase
            .from('farmers')
            .select('id')
            .eq('id', context.farmerId)
            .single();

        if (checkError || !farmerExists) {
            console.warn('[DigitalTwin] Farmer not found in database. Skipping cycle.');
            console.warn('[DigitalTwin] Please register or log in again to sync data.');
            return;
        }

        isRunning = true;
        this.status = 'simulating';
        this.checkCount++;
        console.log(`[DigitalTwin] Starting cycle #${this.checkCount} for Farmer: ${context.farmerId}`);

        try {
            // 1. Check for Missing Data (Backfill up to 7 days)
            await this.handleBackfill(context);

            // 2. Run Current Hour Simulation
            await this.simulateLiveHour(context);

        } catch (error) {
            console.error('[DigitalTwin] Cycle Error:', error);
        } finally {
            isRunning = false;
            this.status = 'idle';
            this.lastCheck = new Date();
            this.notifyListeners('updated');
        }
    }

    /**
     * Backfill Loop: Fills missing days with deterministic data
     */
    async handleBackfill(context) {
        // Get last log date from agent_decisions
        const { data: lastLog, error } = await supabase
            .from('agent_decisions')
            .select('created_at')
            .eq('farmer_id', context.farmerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.warn('[DigitalTwin] Error fetching last log:', error.message);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDate = lastLog?.created_at
            ? new Date(lastLog.created_at)
            : new Date(Date.now() - 7 * 86400000);
        lastDate.setHours(0, 0, 0, 0);

        // Loop from Last Date + 1 to Yesterday
        let curr = new Date(lastDate);
        curr.setDate(curr.getDate() + 1);

        const startDateStr = curr.toISOString().split('T')[0];
        const endDateObj = new Date(today);
        endDateObj.setDate(endDateObj.getDate() - 1);
        const endDateStr = endDateObj.toISOString().split('T')[0];

        if (curr < today) {
            console.log(`[DigitalTwin] Backfilling from ${startDateStr} to ${endDateStr}`);

            // Batch fetch weather for the entire range
            const lat = context.farm?.location?.latitude || 20.5937;
            const lon = context.farm?.location?.longitude || 78.9629;

            const weatherData = await getWeatherRange(lat, lon, startDateStr, endDateStr);
            const weatherMap = new Map((weatherData || []).map(w => [w.date, w]));

            while (curr < today) {
                const dateStr = curr.toISOString().split('T')[0];
                const daysWeather = weatherMap.get(dateStr);

                await this.generateDayLogs(context, dateStr, daysWeather);
                curr.setDate(curr.getDate() + 1);
            }
        }
    }

    /**
     * Generates logs for a specific date using deterministic physics
     */
    async generateDayLogs(context, date, weather) {
        const powerScheduleId = context.farm?.power_schedule || 'morning_evening';
        const decisions = [];

        // 1. Try to get intelligent plan from LLM Brain
        const intelligentPlan = await backgroundBrain.getDailyPlan(context, date, weather);

        // Generate 24 hourly decisions
        for (let hour = 0; hour < 24; hour++) {
            const isDaytime = hour >= 6 && hour < 18;

            // DEFAULT / FALLBACK VALUES (Deterministic Physics)
            // Used if LLM fails or for fallback calculations
            const temp = weather
                ? (isDaytime ? weather.temperatureMax : weather.temperatureMin)
                : (isDaytime ? 28 + Math.sin((hour - 6) * Math.PI / 12) * 8 : 22);

            // Soil moisture logic linked to real rain (fallback)
            const baseMoisture = 45;
            const rainBoost = (weather?.precipitationSum || 0) * 2;
            const moistureLoss = isDaytime ? (hour - 6) * 2 : 0;
            let moisture = Math.min(100, Math.max(25, baseMoisture + rainBoost - moistureLoss + Math.random() * 5));
            let action = 'SKIP';
            let reason = `Moisture OK (${Math.round(moisture)}%)`;
            let powerAvail = this.isPowerAvailable(powerScheduleId, hour);
            let confidence = 85;

            // 2. USE INTELLIGENT PLAN IF AVAILABLE
            if (intelligentPlan && intelligentPlan[hour]) {
                const plan = intelligentPlan[hour];
                action = plan.action; // 'IRRIGATE' or 'SKIP'
                reason = plan.reason;
                moisture = plan.moisture || moisture;
                confidence = plan.confidence || 90;

                // Double check power availability (safety override)
                if (action === 'IRRIGATE' && !powerAvail) {
                    action = 'SKIP';
                    reason = `Power unavailable at ${hour}:00 (Override)`;
                }
            } else {
                // Fallback Logic
                const needsWater = moisture < 35;
                action = (needsWater && powerAvail) ? 'IRRIGATE' : 'SKIP';

                if (!powerAvail) {
                    reason = `Power unavailable at ${hour}:00`;
                } else if (action === 'IRRIGATE') {
                    reason = `Low moisture (${moisture.toFixed(0)}%) - irrigation needed`;
                }
            }

            decisions.push({
                farmer_id: context.farmerId,
                simulation_date: date,
                simulation_hour: hour,
                power_available: powerAvail,
                action,
                reason,
                confidence,
                water_used: action === 'IRRIGATE' ? 5000 : 0,
                water_saved: action === 'SKIP' && moisture < 35 ? 0 : 200,
                duration_minutes: action === 'IRRIGATE' ? 45 : 0,
                sensor_data: {
                    moisture: Math.round(moisture),
                    temp: Math.round(temp),
                    humidity: Math.round(weather?.humidityMean || 60),
                    hour
                }
            });
        }

        // Insert all 24 decisions
        const { error: decError } = await supabase.from('agent_decisions').insert(decisions);
        if (decError) {
            console.error('Error inserting backfill decisions:', decError.message);
            return;
        }

        // Insert daily summary into irrigation_logs
        const dailyWater = decisions.reduce((sum, d) => sum + d.water_used, 0);
        const dailySaved = decisions.reduce((sum, d) => sum + d.water_saved, 0);

        const { error: logError } = await supabase.from('irrigation_logs').insert([{
            farmer_id: context.farmerId,
            date: date,
            water_used_liters: dailyWater,
            water_saved_liters: dailySaved,
            rain_avoided: (weather?.precipitationSum || 0) > 5, // Mark rain avoided if rain > 5mm
            et0_mm: weather?.et0 || 5.5
        }]);

        if (logError && !logError.message.includes('duplicate')) {
            console.error('Error inserting daily log:', logError.message);
        }

        // Insert daily crop growth tracking
        if (context.farm?.primary_crop) {
            const plantingDate = context.farm?.planting_date || context.farm?.plantingDate;
            const daysAfterPlanting = plantingDate
                ? Math.floor((new Date(date) - new Date(plantingDate)) / 86400000)
                : 30;

            // Calculate growth stage based on days
            let stage = 'initial';
            if (daysAfterPlanting > 90) stage = 'mature';
            else if (daysAfterPlanting > 60) stage = 'mid_season';
            else if (daysAfterPlanting > 30) stage = 'development';

            // Calculate KC coefficient based on stage
            const kcValues = { initial: 0.3, development: 0.7, mid_season: 1.1, mature: 0.8 };

            const { error: cropError } = await supabase.from('crop_growth').insert([{
                farmer_id: context.farmerId,
                crop_id: context.farm.primary_crop,
                planting_date: plantingDate || date,
                current_stage: stage,
                days_in_stage: daysAfterPlanting,
                kc_coefficient: kcValues[stage] || 0.5,
                health_status: 'healthy',
                recorded_at: `${date}T12:00:00Z`
            }]);

            if (cropError && !cropError.message.includes('duplicate')) {
                console.error('Error inserting crop growth:', cropError.message);
            }
        }
    }

    /**
     * Simulates the current hour
     */
    async simulateLiveHour(context) {
        const now = new Date();
        const hour = now.getHours();
        const powerScheduleId = context.farm?.power_schedule || 'morning_evening';
        const powerAvail = this.isPowerAvailable(powerScheduleId, hour);

        // Check if this hour was already logged today
        const todayStr = now.toISOString().split('T')[0];

        // Check if any plan exists for TODAY
        const { data: existingPlan } = await supabase
            .from('agent_decisions')
            .select('id')
            .eq('farmer_id', context.farmerId)
            .eq('simulation_date', todayStr)
            .limit(1);

        // If NO PLAN for today, generate the full 24-hour plan now (using LLM)
        if (!existingPlan || existingPlan.length === 0) {
            console.log(`[DigitalTwin] No plan for today (${todayStr}), generating full day plan...`);

            // Fetch weather for today
            let weather = null;
            try {
                const lat = context.farm?.location?.latitude || 20.5937;
                const lon = context.farm?.location?.longitude || 78.9629;
                weather = await getWeatherForDate(lat, lon, todayStr);
            } catch (e) {
                console.warn('[DigitalTwin] Error fetching live weather:', e);
            }

            // Generate and insert all 24 logs
            await this.generateDayLogs(context, todayStr, weather);
            return;
        }

        console.log(`[DigitalTwin] Plan exists, skipping hourly generation.`);
    }

    async updateDailyLog(context, liters) {
        const today = new Date().toISOString().split('T')[0];

        // Simple upsert - insert or update
        const { data: existing } = await supabase
            .from('irrigation_logs')
            .select('id, water_used_liters')
            .eq('farmer_id', context.farmerId)
            .eq('date', today)
            .single();

        if (existing) {
            await supabase
                .from('irrigation_logs')
                .update({ water_used_liters: existing.water_used_liters + liters })
                .eq('id', existing.id);
        } else {
            await supabase.from('irrigation_logs').insert([{
                farmer_id: context.farmerId,
                date: today,
                water_used_liters: liters,
                water_saved_liters: 0
            }]);
        }
    }

    getStatus() {
        return {
            status: this.status,
            lastCheck: this.lastCheck,
            checkCount: this.checkCount,
            intervalMs: INTERVAL_MS,
            lastDecision: this.lastDecision
        };
    }

    forceCheck() {
        this.runCycle();
    }

    addListener(cb) {
        listeners.push(cb);
        return () => listeners = listeners.filter(l => l !== cb);
    }

    notifyListeners(ev, data) {
        listeners.forEach(l => l(ev, data));
    }
}

export const backgroundAgent = new BackgroundAgent();
export default backgroundAgent;
