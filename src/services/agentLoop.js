import { executeTool } from './agentTools';
import { agentMemory } from './agentMemory';
import { generateCompletion } from './aiService';
import geminiService from './geminiService';

const llamaApiKey = import.meta.env.VITE_OPENROUTER_CHAT_KEY;
const MODEL_NAME = 'meta-llama/llama-3.3-70b-instruct';
const MAX_TOOL_CALLS = 6;

// System Prompts
const SYSTEM_PROMPT_CORE = `You are BloomWise, an AI-powered Smart Irrigation Assistant.
## MISSION
Help farmers save water and protect crops using real-time data.

## RULES
1. ALWAYS use tools (get_weather, get_crop_info) before answering.
2. Be concise and practical.
3. If speaking Hindi, use Devanagari script.
4. Output Format:
   📅 Date: [Recommendation]
   💧 Water: [Amount]
   📊 Reason: [Analysis]`;

const SYSTEM_PROMPT_TOOLS = `
## TOOLS AVAILABLE
- get_weather(lat, lon): Get forecast
- get_crop_info(crop_name): Get Kc and stages
- get_soil_info(soil_type): Get moisture properties

To use a tool, output JSON: {"tool": "tool_name", "args": {...}}
`;

/**
 * Primary Agent Entry Point
 */
export async function runAgentLoop(userMessage, context = {}, history = []) {
    // 1. Check for Demo/Preview Mode -> Route to Gemini
    const isDemoMode = context.isDemo || context.farm?.isDemo;

    if (isDemoMode) {
        console.log('AgentLoop: Routing to Gemini Service (Demo Mode)');
        return await geminiService.chat(userMessage, context, history);
    }

    // 2. Live Mode -> Route to Llama 3.3
    // Check if API key is present
    if (!llamaApiKey) {
        return getDemoAgentResponse(userMessage, context, "API Key missing for Live Mode");
    }

    const fullContext = { ...agentMemory.getContext(), ...context };
    const contextString = buildContextString(fullContext);

    // Initial messages
    let messages = [
        { role: 'system', content: SYSTEM_PROMPT_CORE + '\n\n' + SYSTEM_PROMPT_TOOLS },
        ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        { role: 'user', content: `[Context: ${contextString}]\n${userMessage}` }
    ];

    let toolCallCount = 0;
    const reasoningSteps = [];

    // Main Loop
    while (toolCallCount < MAX_TOOL_CALLS) {
        // Call AI
        const aiResponse = await generateCompletion(messages, MODEL_NAME, llamaApiKey, 0.2);

        if (!aiResponse) {
            return { success: false, message: "AI unavailable." };
        }

        // Check for Tool Call (Simplified JSON parsing for now)
        // Ideally we use a robust parser, here we look for {"tool": ...} pattern
        let toolCall = null;
        try {
            const match = aiResponse.match(/\{"tool":\s*"[^"]+",\s*"args":\s*\{[^}]+\}\}/);
            if (match) {
                toolCall = JSON.parse(match[0]);
            }
        } catch (e) {
            // No valid JSON tool call found
        }

        if (toolCall) {
            // Execute Tool
            const { tool, args } = toolCall;
            reasoningSteps.push({ type: 'tool_call', tool, args });

            messages.push({ role: 'assistant', content: JSON.stringify(toolCall) });

            const toolResult = await executeTool(tool, { ...args, farmContext: fullContext });
            const resultStr = JSON.stringify(toolResult);

            reasoningSteps.push({ type: 'tool_result', tool, result: toolResult.success ? 'success' : 'error' });
            messages.push({ role: 'user', content: `Tool Result: ${resultStr}` });

            toolCallCount++;
        } else {
            // Final Answer
            return {
                success: true,
                message: aiResponse,
                reasoning: reasoningSteps
            };
        }
    }

    return { success: false, message: "Tool call limit reached." };
}

function buildContextString(context) {
    const parts = [];
    if (context.language) parts.push(`Language: ${context.language}`);
    if (context.farm) parts.push(`Farm: ${context.farm.district}, Soil: ${context.farm.soilType}`);
    if (context.weather?.current) parts.push(`Weather: ${context.weather.current.temperature}C`);
    return parts.join('. ');
}

function getDemoAgentResponse(userMessage, context, error = null) {
    return {
        success: true,
        message: "⚠️ Demo Mode (Fallback): Checking tools...",
        reasoning: [],
        isDemo: true
    };
}

export default { runAgentLoop };
