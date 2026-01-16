import { generateCompletion } from './aiService';

// Check if Configured (Now checks for backend config effectively, or just assumes true for demo)
export const isGeminiConfigured = true;

/**
 * Chat with Gemini (Demo Mode via Backend)
 */
export async function chat(userMessage, context = {}, history = []) {
    try {
        // Backend handles the specific prompt for preview
        // We pass 'gemini-2.5-flash' to trigger the routing in aiService
        const response = await generateCompletion(
            [...history, { role: 'user', content: userMessage }],
            'gemini-2.5-flash',
            'backend-key'
        );

        // Check if response is valid JSON from backend wrapper
        try {
            const parsed = JSON.parse(response);
            if (parsed.message) return { success: true, message: parsed.message, isDemo: true };
            return { success: true, message: response, isDemo: true };
        } catch (e) {
            return { success: true, message: response, isDemo: true };
        }

    } catch (e) {
        console.error("Gemini Preview Error:", e);
        return {
            success: false,
            message: "⚠️ Preview Error: Backend connection failed.",
            error: e.message
        };
    }
}

export default { chat, isGeminiConfigured };
