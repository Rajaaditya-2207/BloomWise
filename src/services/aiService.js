/**
 * AI Service - Frontend Connector to Python Backend
 * Routes requests to localhost:8000 based on model type
 */

const BACKEND_URL = 'http://localhost:8000';

export async function generateCompletion(messages, model, apiKey, temperature = 0.7) {
    let endpoint = '';
    let payload = {};

    // Determine Backend Endpoint based on Model
    if (model.includes('llama')) {
        endpoint = '/api/chat/live';
        // Extract user message and context from messages
        // Basic extraction for now, backend handles robustly
        const userMsg = messages.find(m => m.role === 'user')?.content || '';
        payload = {
            message: userMsg,
            context: {}, // Context should ideally be passed separately
            history: messages
        };
    }
    else if (model.includes('gemini')) {
        endpoint = '/api/chat/preview';
        const userMsg = messages.find(m => m.role === 'user')?.content || '';
        payload = {
            message: userMsg,
            context: {},
            history: messages
        };
    }
    else if (model.includes('gpt-oss')) {
        endpoint = '/api/background/plan';
        // Background brain passes a specific prompt structure
        const prompt = messages[0].content;
        payload = {
            context: {},
            date: new Date().toISOString().split('T')[0],
            weather: {},
            // Special handling for background prompt content if needed
            // Ideally we separate this method
        };
        // For quick migration, we might just pass the prompt raw if backend supports it
        // But our backend expects 'context', 'date', 'weather' for plan
        // This suggests we need a specific 'generatePlan' method in aiService
        return null; // Fallback or handle differently
    }

    try {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`Backend Error (${endpoint}):`, err);
            return null;
        }

        const data = await response.json();
        return data.message || JSON.stringify(data);

    } catch (error) {
        console.error('AI Service Connection Error:', error);
        return null; // Return null to trigger fallbacks if any
    }
}

/**
 * Dedicated method for Background Plan to match Backend signature
 */
export async function generateDailyPlan(context, date, weather) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/background/plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context, date, weather })
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("Background Plan Error:", e);
        return null;
    }
}
