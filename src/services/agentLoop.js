/**
 * Agent Loop - ReAct-style reasoning loop for KrishiMitra
 * Implements THINK → ACT → OBSERVE pattern
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { toolDefinitions, executeTool } from './agentTools';
import { agentMemory } from './agentMemory';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const MAX_TOOL_CALLS = 6;

// System prompt for the agent
const AGENT_SYSTEM_PROMPT = `You are KrishiMitra (कृषिमित्र), an AI-powered Smart Irrigation Scheduler & Water Saver agent for Indian farmers.

## YOUR MISSION
Help farmers plan daily irrigation to SAVE WATER and PROTECT CROPS using weather forecast, soil moisture, and crop stage data.

## AGENTIC BEHAVIOR
You have access to tools. Use them autonomously to gather information before answering.

ALWAYS:
1. Use tools to get real data - don't make assumptions
2. Call get_weather first to check rain forecast
3. Call get_crop_info to get current Kc coefficient
4. Call calculate_irrigation to compute exact water needs
5. Show your reasoning at each step

## RESPONSE LANGUAGE
Respond in the language the farmer uses. If they write in Hindi, respond in Hindi (Devanagari). If English, respond in English.

## KEY CALCULATIONS (FAO-56 Method)
- ETc = Kc × ET₀ (crop water need)
- Net Irrigation = ETc - Effective Rainfall
- 1mm over 1 hectare = 10,000 liters

## INDIAN CONTEXT
- Consider monsoon patterns
- Account for power cuts (use get_power_schedule)
- Use farmer-friendly units: bigha, kattha, tanker loads
- Mention relevant schemes: PM-KUSUM, PMKSY

## SAFETY RULES
- Include disclaimer: "AI-generated advice - consult local KVK for critical decisions"
- Never prescribe pesticides or chemicals
- Don't guarantee crop yields
- Cite sources: FAO-56, ICAR-IIWM, IMD

## OUTPUT FORMAT
When giving irrigation advice:
📅 **Date/Time**: When to irrigate
💧 **Water Amount**: X liters OR X mm
⏱️ **Duration**: Y minutes  
🌧️ **Rain Alert**: Skip if rain expected
📊 **Reasoning**: Brief explanation

End responses with: "Jai Kisan! 🙏"`;

/**
 * Initialize Gemini with function calling
 */
let genAI = null;
let model = null;

function initializeModel() {
    console.log('[AgentLoop] Checking API key...', apiKey ? `Key exists (${apiKey.substring(0, 10)}...)` : 'No key');

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.warn('[AgentLoop] Gemini API key not configured');
        return false;
    }

    if (!genAI) {
        console.log('[AgentLoop] Initializing Gemini with model: gemini-2.5-flash');
        try {
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                tools: [{ functionDeclarations: toolDefinitions }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    topP: 0.95
                }
            });
            console.log('[AgentLoop] Model initialized successfully');
        } catch (error) {
            console.error('[AgentLoop] Model initialization failed:', error);
            return false;
        }
    }
    return true;
}

/**
 * Run the agent loop
 * @param {string} userMessage - User's query
 * @param {object} context - Farm context
 * @param {array} history - Conversation history
 * @returns {object} - Agent response with reasoning steps
 */
export async function runAgentLoop(userMessage, context = {}, history = []) {
    console.log('[AgentLoop] Starting agent loop for message:', userMessage.substring(0, 50));
    const reasoningSteps = [];

    // Check if API is available
    if (!initializeModel()) {
        console.log('[AgentLoop] Model init failed, returning demo response');
        return getDemoAgentResponse(userMessage, context);
    }

    console.log('[AgentLoop] Model initialized, calling Gemini API...');

    try {
        // Build context from memory
        const memoryContext = agentMemory.getContext();
        const fullContext = { ...memoryContext, ...context };

        // Create context message
        const contextString = buildContextString(fullContext);

        // Start chat with system prompt
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: AGENT_SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Namaste! Main KrishiMitra hoon. Main aapki sinchai mein madad karunga. 🌾' }] },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ]
        });

        // Send message with context
        const fullMessage = contextString
            ? `[Context: ${contextString}]\n\nFarmer's question: ${userMessage}`
            : userMessage;

        let response = await chat.sendMessage(fullMessage);
        let toolCallCount = 0;

        // Agent loop - process tool calls
        while (toolCallCount < MAX_TOOL_CALLS) {
            const candidate = response.response.candidates?.[0];
            const parts = candidate?.content?.parts || [];

            // Check for function calls
            const functionCalls = parts.filter(p => p.functionCall);

            if (functionCalls.length === 0) {
                // No more tool calls, we have the final answer
                break;
            }

            // Process each function call
            const toolResults = [];
            for (const part of functionCalls) {
                const { name, args } = part.functionCall;

                // Record reasoning step
                reasoningSteps.push({
                    type: 'tool_call',
                    tool: name,
                    args: args,
                    timestamp: new Date().toISOString()
                });

                // Execute the tool
                const result = await executeTool(name, { ...args, farmerId: fullContext.farmerId });

                // Record result
                reasoningSteps.push({
                    type: 'tool_result',
                    tool: name,
                    result: result.success ? 'success' : 'error',
                    summary: summarizeToolResult(name, result),
                    timestamp: new Date().toISOString()
                });

                toolResults.push({
                    functionResponse: {
                        name: name,
                        response: result
                    }
                });

                toolCallCount++;
            }

            // Send tool results back to the model
            response = await chat.sendMessage(toolResults);
        }

        // Extract final text response
        const finalText = response.response.candidates?.[0]?.content?.parts
            ?.filter(p => p.text)
            ?.map(p => p.text)
            ?.join('\n') || 'I apologize, I could not generate a response.';

        // Update memory with conversation
        agentMemory.addMessage('user', userMessage);
        agentMemory.addMessage('assistant', finalText, reasoningSteps);

        return {
            success: true,
            message: finalText,
            reasoning: reasoningSteps,
            toolCallCount,
            context: fullContext
        };

    } catch (error) {
        console.error('[AgentLoop] ❌ API Error:', error.name, error.message);
        console.error('[AgentLoop] Full error:', error);

        // Check if it's a specific API error
        if (error.message?.includes('API_KEY')) {
            console.error('[AgentLoop] API Key issue detected');
        } else if (error.message?.includes('quota') || error.message?.includes('rate')) {
            console.error('[AgentLoop] Quota/Rate limit issue');
        } else if (error.message?.includes('model')) {
            console.error('[AgentLoop] Model issue - trying to use: gemini-2.5-flash-preview-05-20');
        }

        return getDemoAgentResponse(userMessage, context, error.message);
    }
}

/**
 * Build context string for the agent
 */
function buildContextString(context) {
    const parts = [];

    if (context.language) {
        const langNames = { 'en': 'English', 'hi': 'Hindi (Devanagari)' };
        parts.push(`Language: ${langNames[context.language] || context.language}`);
    }

    if (context.farm) {
        parts.push(`Farm: ${context.farm.areaHectares || context.farm.land_size_ha} hectares in ${context.farm.district || 'N/A'}`);
        parts.push(`Soil: ${context.farm.soilType || context.farm.soil_type}`);
    }

    if (context.crop) {
        parts.push(`Crop: ${context.crop.name || context.crop.primary_crop}`);
        if (context.crop.daysAfterPlanting) {
            parts.push(`Days after planting: ${context.crop.daysAfterPlanting}`);
        }
    }

    if (context.weather?.current) {
        parts.push(`Current weather: ${context.weather.current.temperature}°C`);
    }

    if (context.farmerId) {
        parts.push(`Farmer ID: ${context.farmerId}`);
    }

    return parts.join('. ');
}

/**
 * Summarize tool result for reasoning display
 */
function summarizeToolResult(toolName, result) {
    if (!result.success) return `Error: ${result.error}`;

    switch (toolName) {
        case 'get_weather':
            const rain = result.rainAlerts?.length > 0;
            return rain
                ? `Rain expected (${result.rainAlerts[0].probability}% chance)`
                : `Clear weather, ET₀: ${result.summary?.todayEt0 || 'N/A'}mm`;
        case 'get_crop_info':
            return `${result.crop?.name} at ${result.growthStage} stage, Kc=${result.kc}`;
        case 'get_soil_info':
            return `${result.soil?.name}, ${result.waterHoldingCapacity} water holding`;
        case 'calculate_irrigation':
            return `Need ${result.recommendation?.waterMm}mm (${result.recommendation?.totalLiters} liters)`;
        case 'send_irrigation_signal':
            return `Signal ${result.signal?.action} sent successfully`;
        case 'generate_weekly_report':
            return `Saved ${result.report?.savingsPercent}% water this week`;
        default:
            return 'Completed';
    }
}

/**
 * Demo response when API is not available
 */
function getDemoAgentResponse(userMessage, context, error = null) {
    const isHindi = context?.language === 'hi';
    const reasoningSteps = [
        { type: 'tool_call', tool: 'get_weather', args: { latitude: 18.52, longitude: 73.85 }, timestamp: new Date().toISOString() },
        { type: 'tool_result', tool: 'get_weather', result: 'success', summary: 'Clear weather, ET₀: 5.2mm', timestamp: new Date().toISOString() },
        { type: 'tool_call', tool: 'get_crop_info', args: { cropId: 'wheat', daysAfterPlanting: 45 }, timestamp: new Date().toISOString() },
        { type: 'tool_result', tool: 'get_crop_info', result: 'success', summary: 'Wheat at development stage, Kc=1.1', timestamp: new Date().toISOString() },
        { type: 'tool_call', tool: 'calculate_irrigation', args: { et0: 5.2, kc: 1.1, areaHectares: 2 }, timestamp: new Date().toISOString() },
        { type: 'tool_result', tool: 'calculate_irrigation', result: 'success', summary: 'Need 5.7mm (114,000 liters)', timestamp: new Date().toISOString() }
    ];

    // Use actual context if available, otherwise defaults
    const temp = context?.weather?.current?.temperature || 30;
    const et0 = context?.weather?.current?.et0 || 5.2;
    const cropName = context?.crop?.name || (isHindi ? 'गेहूं' : 'Wheat');
    const cropStage = context?.crop?.daysAfterPlanting > 30 ? (isHindi ? 'विकास चरण' : 'development stage') : (isHindi ? 'शुरुआती चरण' : 'initial stage');
    const kc = 1.1; // Demo fixed
    const waterMm = (et0 * kc).toFixed(1);
    const waterLiters = Math.round(waterMm * 10000 * (context?.farm?.areaHectares || 2)).toLocaleString();

    // Check for specific API errors to show relevant messages
    if (error && (error.includes('429') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('rate limit'))) {
        return {
            success: false,
            message: `⏳ **System Busy (Rate Limit)**\n\nThe AI service is currently receiving too many requests. Please **wait a moment** and try again.\n\n*(Error: ${error})*`,
            reasoning: [],
            toolCallCount: 0,
            isDemo: false, // It's a real error, not a demo fallback
            error: error
        };
    }

    let message = '';

    if (isHindi) {
        message = `🌾 **सिंचाई सलाह**

मैंने मौसम, फसल और मिट्टी का विश्लेषण किया:

📊 **विश्लेषण:**
- आज का तापमान: ${temp}°C
- आज का ET₀: ${et0}mm
- ${cropName} Kc (${cropStage}): ${kc}
- पानी की जरूरत: ${waterMm}mm

💧 **सिफारिश:**
✅ **सिंचाई करें** - आज शाम 6 बजे
- पानी: ${waterLiters} लीटर (${context?.farm?.areaHectares || 2} हेक्टेयर के लिए)
- अवधि: ~45 मिनट

⚠️ यह डेमो मोड है (API Key missing)।
`;
    } else {
        message = `🌾 **Irrigation Advice**

I analyzed the weather, crop, and soil conditions:

📊 **Analysis:**
- Current Temp: ${temp}°C
- Today's ET₀: ${et0}mm
- ${cropName} Kc (${cropStage}): ${kc}
- Water requirement: ${waterMm}mm

💧 **Recommendation:**
✅ **Irrigate** - This evening at 6 PM
- Water: ${waterLiters} liters (for ${context?.farm?.areaHectares || 2} hectares)
- Duration: ~45 minutes

⚠️ This is Demo Mode (API Key missing or Invalid).
`;
    }

    return {
        success: true,
        message,
        reasoning: reasoningSteps,
        toolCallCount: 3,
        isDemo: true,
        error: error ? `API Error: ${error} ` : null
    };
}

export default { runAgentLoop };
