/**
 * Signal Service - Mock Hardware Integration
 * Handles sending signals to irrigation hardware and logging history
 */

import { supabase } from './supabase';

/**
 * Signal types
 */
export const SIGNAL_TYPES = {
    IRRIGATE: 'IRRIGATE',
    SKIP: 'SKIP',
    REDUCE: 'REDUCE',
    EMERGENCY_STOP: 'EMERGENCY_STOP'
};

/**
 * Signal status
 */
export const SIGNAL_STATUS = {
    PENDING: 'PENDING',
    SENT: 'SENT',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    FAILED: 'FAILED'
};

/**
 * Send a signal to the irrigation hardware (mock)
 */
export async function sendSignal(farmerId, signalData) {
    const signal = {
        id: crypto.randomUUID(),
        farmer_id: farmerId,
        timestamp: new Date().toISOString(),
        action: signalData.action,
        water_amount_liters: signalData.waterAmountLiters || null,
        duration_mins: signalData.durationMins || null,
        conditions: signalData.conditions || {},
        reasoning: signalData.reasoning || '',
        signal_status: SIGNAL_STATUS.SENT
    };

    // Simulate hardware communication delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Log to database
    try {
        if (true) return; // Disabled for demo/offline
        const { error } = await supabase.from('signal_history').insert([signal]);
        if (error) {
            console.log('Signal persistence skipped (Demo/Offline mode):', error.message || error);
            signal.signal_status = SIGNAL_STATUS.FAILED;
        }
    } catch (e) {
        console.warn('Supabase unavailable, signal logged locally only');
    }

    // Mock: Simulate hardware acknowledgment after 2 seconds
    setTimeout(async () => {
        try {
            await supabase
                .from('signal_history')
                .update({ signal_status: SIGNAL_STATUS.ACKNOWLEDGED })
                .eq('id', signal.id);
        } catch (e) {
            // Ignore
        }
    }, 2000);

    return {
        success: true,
        signal,
        message: `Signal ${signal.action} sent to irrigation system`,
        isMock: true
    };
}

/**
 * Get signal history for a farmer
 */
export async function getSignalHistory(farmerId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('signal_history')
            .select('*')
            .eq('farmer_id', farmerId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, signals: data || [] };
    } catch (e) {
        // Return mock data
        return {
            success: true,
            signals: generateMockHistory(),
            isMock: true
        };
    }
}

/**
 * Get signal statistics for a farmer
 */
export async function getSignalStats(farmerId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('signal_history')
            .select('action, water_amount_liters, conditions')
            .eq('farmer_id', farmerId)
            .gte('timestamp', startDate.toISOString());

        if (error) throw error;

        const stats = {
            totalSignals: data.length,
            irrigateCount: data.filter(s => s.action === 'IRRIGATE').length,
            skipCount: data.filter(s => s.action === 'SKIP').length,
            totalWaterUsed: data
                .filter(s => s.action === 'IRRIGATE')
                .reduce((sum, s) => sum + (s.water_amount_liters || 0), 0),
            totalWaterSaved: data
                .filter(s => s.action === 'SKIP' || s.action === 'REDUCE')
                .reduce((sum, s) => sum + (s.water_amount_liters || 0), 0)
        };

        return { success: true, stats };
    } catch (e) {
        return {
            success: true,
            stats: {
                totalSignals: 45,
                irrigateCount: 28,
                skipCount: 17,
                totalWaterUsed: 3200000,
                totalWaterSaved: 1400000
            },
            isMock: true
        };
    }
}

/**
 * Generate mock signal history for demo - Hourly data for 7 days
 */
function generateMockHistory() {
    const signals = [];
    const now = new Date();

    // Generate hourly data for the past 7 days
    for (let day = 0; day < 7; day++) {
        // Typical irrigation check times: 6 AM, 12 PM, 6 PM (3 times per day)
        const checkHours = [6, 12, 18];

        for (const hour of checkHours) {
            const timestamp = new Date(now);
            timestamp.setDate(now.getDate() - day);
            timestamp.setHours(hour, 0, 0, 0);

            // Morning and evening more likely to irrigate
            const morningOrEvening = hour === 6 || hour === 18;
            const baseIrrigateChance = morningOrEvening ? 0.7 : 0.4;

            // Less irrigation on rainy days (randomly assign some days as rainy)
            const isRainyDay = (day + hour) % 5 === 0;
            const irrigateChance = isRainyDay ? 0.2 : baseIrrigateChance;

            const isIrrigate = Math.random() < irrigateChance;
            const waterAmount = Math.round(15000 + Math.random() * 35000); // 15-50k liters per session

            // Create realistic conditions
            const temperature = 22 + (hour > 12 ? 12 : hour) - (day * 0.5) + Math.random() * 5;
            const humidity = isRainyDay ? 70 + Math.random() * 25 : 40 + Math.random() * 30;
            const rainProbability = isRainyDay ? 60 + Math.random() * 35 : Math.random() * 30;

            const growthStages = ['initial', 'development', 'mid', 'late'];
            const dayProgress = Math.min(day / 7, 0.9); // Progress through growth
            const stageIndex = Math.floor(dayProgress * growthStages.length);

            signals.push({
                id: crypto.randomUUID(),
                timestamp: timestamp.toISOString(),
                action: isIrrigate ? 'IRRIGATE' : (isRainyDay ? 'SKIP' : (Math.random() > 0.7 ? 'REDUCE' : 'SKIP')),
                water_amount_liters: isIrrigate ? waterAmount : Math.round(waterAmount * 0.6),
                duration_mins: isIrrigate ? Math.round(20 + Math.random() * 40) : null,
                signal_status: 'ACKNOWLEDGED',
                reasoning: isIrrigate
                    ? `ET₀=${(2 + Math.random() * 3).toFixed(2)}mm, Kc=${(0.8 + Math.random() * 0.4).toFixed(1)}. Crop needs ${(waterAmount / 1000).toFixed(1)}L (${waterAmount} liters).`
                    : isRainyDay
                        ? `Rain expected with ${rainProbability.toFixed(0)}% probability. Skipping irrigation to conserve water.`
                        : `Soil moisture adequate at ${(40 + Math.random() * 20).toFixed(0)}%. Irrigation not required.`,
                conditions: {
                    temperature: Math.round(temperature * 10) / 10,
                    humidity: Math.round(humidity),
                    soilMoisture: isIrrigate ? 0.25 + Math.random() * 0.15 : 0.45 + Math.random() * 0.3,
                    growthStage: growthStages[stageIndex],
                    rainProbability: Math.round(rainProbability),
                    hour: hour
                }
            });
        }
    }

    // Sort by timestamp descending (most recent first)
    signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return signals;
}

export default {
    sendSignal,
    getSignalHistory,
    getSignalStats,
    SIGNAL_TYPES,
    SIGNAL_STATUS
};
