/**
 * Chat Agent Service
 * Connects to BloomWise Backend API for AI chat.
 * Supports both live mode (Llama 3.3 70B) and preview mode (Gemini 2.5 Flash).
 */

// Backend API URL - default to localhost, override with env var
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Check if backend is configured
export const isBackendConfigured = !!BACKEND_URL;

/**
 * Chat with the AI assistant via backend API.
 * Automatically routes to live or preview endpoint based on demo mode.
 * 
 * @param {string} userMessage - The user's message
 * @param {object} context - Additional context (farm, weather, etc.)
 * @param {array} history - Chat history
 * @param {object} options - Options including isDemo, farmerId, simulationHour
 * @returns {object} Response with message, reasoning, and tools used
 */
export async function chat(userMessage, context = {}, history = [], options = {}) {
    const isDemo = options.isDemo ?? context.isDemo ?? false;
    const endpoint = isDemo ? '/api/chat/preview' : '/api/chat/live';

    try {
        const body = isDemo ? {
            message: userMessage,
            context: context,
            simulation_hour: options.simulationHour ?? context.simulationHour ?? new Date().getHours(),
            simulation_date: options.simulationDate ?? context.simulationDate ?? null
        } : {
            message: userMessage,
            context: context,
            history: history.map(msg => ({
                role: msg.role,
                content: msg.content || msg.text
            })),
            farmer_id: options.farmerId ?? context.farmerId ?? null
        };

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();

        return {
            success: data.success ?? true,
            message: data.message,
            reasoning: data.reasoning || null,
            toolsUsed: data.tools_used || [],
            simulationData: data.simulation_data || null,
            isDemo: data.isDemo ?? isDemo,
            isLive: data.isLive ?? !isDemo
        };
    } catch (error) {
        console.error('Chat API error:', error);

        // Fallback to demo response if backend is down
        return getDemoResponse(userMessage, context);
    }
}

/**
 * Get farm context from backend.
 * 
 * @param {string} farmerId - The farmer's UUID
 * @returns {object} Full farm context
 */
export async function getFarmContext(farmerId) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/context/${farmerId}`);

        if (!response.ok) {
            throw new Error(`Failed to get context: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Context API error:', error);
        return { error: error.message };
    }
}

/**
 * Generate irrigation schedule via backend.
 * 
 * @param {string} farmerId - The farmer's UUID
 * @param {object} weather - Weather data (optional)
 * @returns {object} 24-hour schedule
 */
export async function generateIrrigationSchedule(farmerId, weather = {}) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/background/plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                farmer_id: farmerId,
                date: new Date().toISOString().split('T')[0],
                weather: weather
            })
        });

        if (!response.ok) {
            throw new Error(`Schedule API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Schedule API error:', error);
        return { error: error.message };
    }
}

/**
 * Get scheduler status.
 * 
 * @returns {object} Scheduler status
 */
export async function getSchedulerStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/scheduler/status`);
        return await response.json();
    } catch (error) {
        console.error('Scheduler status error:', error);
        return { is_running: false, error: error.message };
    }
}

/**
 * Trigger manual scheduler cycle.
 * 
 * @returns {object} Trigger result
 */
export async function triggerScheduler() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/scheduler/trigger`, {
            method: 'POST'
        });
        return await response.json();
    } catch (error) {
        console.error('Scheduler trigger error:', error);
        return { error: error.message };
    }
}

/**
 * Check if backend is healthy.
 * 
 * @returns {boolean} True if backend is responding
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

// ============ DEMO FALLBACK ============

/**
 * Build context message for display.
 */
export function buildContextMessage(context) {
    const parts = [];

    if (context.language) {
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi (Devanagari script)',
            'hi_translit': 'Hindi (Roman script)',
            'bn': 'Bengali', 'te': 'Telugu', 'mr': 'Marathi', 'ta': 'Tamil',
            'gu': 'Gujarati', 'kn': 'Kannada', 'ml': 'Malayalam', 'or': 'Odia',
            'pa': 'Punjabi', 'as': 'Assamese'
        };
        parts.push(`Language: ${languageNames[context.language] || 'English'}`);
    }

    if (context.weather) {
        parts.push(`Weather: ${context.weather.current?.temperature}°C`);
    }

    if (context.farm) {
        parts.push(`Farm: ${context.farm.areaHectares} ha`);
    }

    if (context.crop) {
        parts.push(`Crop: ${context.crop.name}`);
    }

    return parts.join(' | ');
}

/**
 * Demo response when backend is unavailable.
 */
function getDemoResponse(userMessage, context) {
    const lang = context?.language || 'en';
    const isHindi = lang === 'hi';

    const messageLower = userMessage.toLowerCase();

    let message;
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('namaste')) {
        message = isHindi
            ? "👋 नमस्ते! मैं BloomWise हूं। सिंचाई में मदद चाहिए? (डेमो मोड)"
            : "👋 Hello! I'm BloomWise. Need irrigation help? (Demo mode)";
    } else if (messageLower.includes('water') || messageLower.includes('irrigate') || messageLower.includes('pani')) {
        message = isHindi
            ? "💧 **डेमो गणना**\n\nET₀ = 4.5 mm, Kc = 1.0\nETc = 4.5 mm/day\n\n📊 आवश्यक पानी: ~45,000 लीटर/हेक्टेयर\n\n*बैकएंड से कनेक्ट करें!*"
            : "💧 **Demo Calculation**\n\nET₀ = 4.5 mm, Kc = 1.0\nETc = 4.5 mm/day\n\n📊 Water needed: ~45,000 liters/hectare\n\n*Connect backend for real data!*";
    } else if (messageLower.includes('weather') || messageLower.includes('mausam')) {
        message = isHindi
            ? "🌤️ **डेमो मौसम**\n\n32°C, बारिश 20% संभावना\nET₀: 4.5 mm/day\n\n*बैकएंड से कनेक्ट करें!*"
            : "🌤️ **Demo Weather**\n\n32°C, 20% rain chance\nET₀: 4.5 mm/day\n\n*Connect backend for real data!*";
    } else {
        message = isHindi
            ? "🌱 **BloomWise डेमो**\n\nबैकएंड कनेक्ट नहीं है। कृपया सर्वर शुरू करें।"
            : "🌱 **BloomWise Demo**\n\nBackend not connected. Please start the server.";
    }

    return {
        success: true,
        message: message,
        isDemo: true,
        reasoning: null,
        toolsUsed: []
    };
}

// ============ LEGACY COMPATIBILITY ============

// Keep isLlamaConfigured for backward compatibility
export const isLlamaConfigured = true; // Now handled by backend

export default {
    chat,
    getFarmContext,
    generateIrrigationSchedule,
    getSchedulerStatus,
    triggerScheduler,
    checkBackendHealth,
    buildContextMessage,
    isLlamaConfigured,
    isBackendConfigured
};
