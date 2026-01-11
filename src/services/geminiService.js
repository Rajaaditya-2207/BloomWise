/**
 * Google Gemini AI Service
 * Handles AI interactions for the irrigation assistant
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if API is configured
export const isGeminiConfigured = !!(apiKey && apiKey !== 'your_gemini_api_key');

// Initialize Gemini
let genAI = null;
let model = null;

if (isGeminiConfigured) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

// System prompt for the irrigation assistant - Agentic with citations and disclaimers
const SYSTEM_PROMPT = `You are BloomWise, an AI-powered Smart Irrigation Scheduler & Water Saver agent for Indian farmers.

## YOUR GOAL
Help farmers plan daily irrigation to SAVE WATER and PROTECT CROPS using weather, soil moisture, and crop stage data.

## AGENTIC BEHAVIOR - SHOW YOUR REASONING
When answering, ALWAYS show your planning steps:
1. **ANALYZE**: What data do I have? (weather, soil, crop stage, field size)
2. **CALCULATE**: Water requirement using ETc = Kc × ET₀ (FAO-56 method)
3. **CHECK**: Rain forecast - should I skip/reduce irrigation?
4. **RECOMMEND**: Specific action with water amount (liters/hectare or mm)

## TOOLS YOU USE
- Weather API: 7-day forecast, temperature, humidity, rain probability
- Crop Database: 60+ crops with Kc coefficients for each growth stage
- Soil Database: 8 Indian soil types with water retention properties
- Power Schedule: Agricultural power availability by region

## RESPONSE LANGUAGE
Respond in the language specified in context. If Hindi is requested, respond in Devanagari script.
If no language specified, match the farmer's input language.

## KEY GUIDELINES
- Use FAO-56 Penman-Monteith for ET₀ calculations
- Consider Indian conditions: monsoon, power cuts, water scarcity
- Mention relevant government schemes: PM-KUSUM, PMKSY
- Use relatable units: bigha, kattha, tanker loads (1 tanker ≈ 5000 liters)
- Be encouraging: farming is hard work! End with "Jai Kisan! 🙏"

## SAFETY & ETHICS
⚠️ DISCLAIMERS TO INCLUDE:
- "This is AI-generated advice based on available data"
- "Consult local KVK/extension officer for critical decisions"
- "Actual results may vary based on local conditions"

🚫 DO NOT:
- Prescribe pesticides or chemicals without expert guidance
- Make guarantees about crop yields
- Provide advice on crops you lack data for

## SOURCES TO CITE (when relevant)
- FAO-56: Crop evapotranspiration guidelines
- ICAR-IIWM: Indian Institute of Water Management
- IMD: India Meteorological Department
- State Agriculture Universities

## OUTPUT FORMAT
When giving irrigation recommendations, be specific:
📅 **Date/Time**: When to irrigate
💧 **Water Amount**: X liters/hectare OR X mm
⏱️ **Duration**: Y minutes
🌧️ **Rain Alert**: Skip if rain expected
📊 **Reasoning**: Brief explanation of calculation`;

/**
 * Chat with the AI assistant
 * @param {string} userMessage - User's message
 * @param {object} context - Farm and weather context
 * @param {array} history - Chat history
 */
export async function chat(userMessage, context = {}, history = []) {
    if (!isGeminiConfigured) {
        return getDemoResponse(userMessage, context);
    }

    try {
        // Build context message
        const contextMessage = buildContextMessage(context);

        // Build chat history
        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Start chat session
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'Namaste! Main BloomWise hoon, aapka irrigation assistant. Aap mujhse Hindi ya English mein baat kar sakte hain. Aapki kya madad kar sakta hoon? 🌾' }] },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            }
        });

        // Add context to user message
        const fullMessage = contextMessage
            ? `[Context: ${contextMessage}]\n\nFarmer's query: ${userMessage}`
            : userMessage;

        // Send message
        const result = await chat.sendMessage(fullMessage);
        const response = await result.response;

        return {
            success: true,
            message: response.text(),
            usage: {
                promptTokens: result.response.usageMetadata?.promptTokenCount,
                responseTokens: result.response.usageMetadata?.candidatesTokenCount
            }
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            success: false,
            message: getDemoResponse(userMessage, context).message,
            error: error.message
        };
    }
}

/**
 * Generate irrigation schedule using AI
 * @param {object} farmData - Farm details
 * @param {object} weatherData - Weather forecast
 * @param {object} cropData - Crop information
 */
export async function generateIrrigationSchedule(farmData, weatherData, cropData) {
    if (!isGeminiConfigured) {
        return getDemoSchedule(farmData, weatherData, cropData);
    }

    const prompt = `Generate a 7-day irrigation schedule for:

FARM DETAILS:
- Location: ${farmData.district}, ${farmData.state}
- Crop: ${cropData.name} (${cropData.nameTranslit})
- Growth Stage: ${cropData.currentStage}
- Days after planting: ${cropData.daysAfterPlanting}
- Crop Kc: ${cropData.currentKc}
- Soil Type: ${farmData.soilType}
- Farm Area: ${farmData.areaHectares} hectares
- Irrigation Method: ${farmData.irrigationMethod}
- Water Source: ${farmData.waterSource}
- Power Schedule: ${farmData.powerSchedule}

WEATHER FORECAST:
${weatherData.daily.map((d, i) =>
        `Day ${i + 1}: Temp ${d.tempMax}°C, Rain ${d.precipitationSum}mm (${d.precipitationProbability}% chance), ET₀: ${d.et0}mm`
    ).join('\n')}

Current Soil Moisture: ${weatherData.current.soilMoisture * 100}%

Provide schedule as JSON array with each day having:
{
  "date": "YYYY-MM-DD",
  "action": "IRRIGATE" | "NO_IRRIGATION" | "MONITOR",
  "time": "HH:MM" (within power schedule),
  "duration_mins": number,
  "volume_liters": number,
  "reasoning": "Brief explanation",
  "rainAvoided": boolean
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Try to extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return {
                success: true,
                schedule: JSON.parse(jsonMatch[0])
            };
        }

        return {
            success: true,
            schedule: getDemoSchedule(farmData, weatherData, cropData).schedule,
            rawResponse: text
        };
    } catch (error) {
        console.error('Failed to generate schedule:', error);
        return getDemoSchedule(farmData, weatherData, cropData);
    }
}

/**
 * Get ICAR/KVK guidelines for a crop
 */
export async function getKrishiGuidelines(cropName, regionName, topic = 'irrigation') {
    if (!isGeminiConfigured) {
        return getDemoGuidelines(cropName, topic);
    }

    const prompt = `As an expert on Indian agricultural guidelines from ICAR (Indian Council of Agricultural Research) and Krishi Vigyan Kendras (KVKs), provide practical ${topic} guidelines for:

Crop: ${cropName}
Region: ${regionName}

Provide response in this format:
{
  "source": "ICAR/KVK guideline source",
  "guidelines": [
    "Guideline 1",
    "Guideline 2"
  ],
  "localTip": "Region-specific tip",
  "waterSavingTip": "Water conservation advice"
}

Keep guidelines practical and suitable for small/marginal farmers.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return {
                success: true,
                guidelines: JSON.parse(jsonMatch[0])
            };
        }

        return getDemoGuidelines(cropName, topic);
    } catch (error) {
        console.error('Failed to get guidelines:', error);
        return getDemoGuidelines(cropName, topic);
    }
}

/**
 * Build context message for AI
 */
function buildContextMessage(context) {
    const parts = [];

    // Language preference - this is critical for response language
    if (context.language) {
        const languageNames = {
            'en': 'English',
            'hi': 'Hindi (Devanagari script)',
            'hi_translit': 'Hindi (Roman/transliterated script)',
            'bn': 'Bengali',
            'te': 'Telugu',
            'mr': 'Marathi',
            'ta': 'Tamil',
            'gu': 'Gujarati',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'or': 'Odia',
            'pa': 'Punjabi',
            'as': 'Assamese'
        };
        const langName = languageNames[context.language] || 'English';
        parts.push(`IMPORTANT: Respond in ${langName}. The user's preferred language is ${context.language}`);
    }

    if (context.weather) {
        parts.push(`Weather: ${context.weather.current?.temperature}°C, ${context.weather.current?.weatherDescription}`);
        if (context.weather.summary?.rainChanceToday > 50) {
            parts.push(`Rain likely today (${context.weather.summary.rainChanceToday}%)`);
        }
    }

    if (context.farm) {
        parts.push(`Farm: ${context.farm.areaHectares} ha in ${context.farm.district}`);
    }

    if (context.crop) {
        parts.push(`Crop: ${context.crop.name}, ${context.crop.daysAfterPlanting} days old`);
    }

    if (context.powerStatus) {
        parts.push(`Power: ${context.powerStatus.available ? 'Available now' : `Next slot at ${context.powerStatus.nextSlot?.start}`}`);
    }

    return parts.join('. ');
}

/**
 * Demo responses when API is not configured - Language aware
 */
function getDemoResponse(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    const lang = context?.language || 'en';
    const isHindi = lang === 'hi' || lang === 'hi_translit';
    const isHindiDevanagari = lang === 'hi';

    // Detect irrigation-related queries
    if (lowerMessage.includes('sinchai') || lowerMessage.includes('paani') ||
        lowerMessage.includes('irrigat') || lowerMessage.includes('water') ||
        lowerMessage.includes('सिंचाई') || lowerMessage.includes('पानी')) {

        const soilMoisture = context?.weather?.current?.soilMoisture
            ? (context.weather.current.soilMoisture * 100).toFixed(0)
            : '45';
        const et0 = context?.weather?.summary?.todayEt0 || '5.2';
        const rainChance = context?.weather?.summary?.rainChanceToday > 50;
        const powerStart = context?.powerStatus?.slots?.[0]?.start || '18:00';
        const powerEnd = context?.powerStatus?.slots?.[0]?.end || '22:00';

        if (isHindiDevanagari) {
            return {
                success: true,
                message: `🌾 **सिंचाई सलाह**

आपके खेत के लिए आज की सलाह:

📊 **वर्तमान स्थिति:**
- मिट्टी की नमी: ${soilMoisture}%
- आज का ET₀: ${et0} mm

💧 **सिफारिश:**
${rainChance
                        ? '⏳ **रुकें** - आज बारिश की संभावना है। कल देखें।'
                        : '✅ **सिंचाई करें** - आज शाम को 6 बजे'}

⚡ **बिजली समय:**
बिजली का समय: ${powerStart} - ${powerEnd}

जय किसान! 🙏`,
                isDemo: true
            };
        }

        return {
            success: true,
            message: `🌾 **Irrigation Advice**

Advice for your farm today:

📊 **Current Status:**
- Soil moisture: ${soilMoisture}%
- Today's ET₀: ${et0} mm

💧 **Recommendation:**
${rainChance
                    ? '⏳ **Wait** - Rain expected today. Check tomorrow.'
                    : '✅ **Irrigate** - This evening at 6 PM'}

⚡ **Power Window:**
Power available: ${powerStart} - ${powerEnd}

Jai Kisan! 🙏`,
            isDemo: true
        };
    }

    // Default helpful response
    if (isHindiDevanagari) {
        return {
            success: true,
            message: `नमस्ते! 🙏 मैं BloomWise हूं।

आप मुझसे ये पूछ सकते हैं:
• "क्या आज सिंचाई करनी चाहिए?"
• "मेरी गेहूं की फसल को कितना पानी चाहिए?"
• "बारिश कब होगी?"
• "पानी कैसे बचाएं?"

आपका क्या सवाल है? 🌾`,
            isDemo: true
        };
    }

    return {
        success: true,
        message: `Hello! 🙏 I am BloomWise.

You can ask me:
• "Should I irrigate today?"
• "How much water does my wheat crop need?"
• "When will it rain?"
• "How can I save water?"

What would you like to know? 🌾`,
        isDemo: true
    };
}

function getDemoSchedule(farmData, weatherData, cropData) {
    const today = new Date();
    const schedule = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const dayWeather = weatherData?.daily?.[i] || {};
        const willRain = dayWeather.precipitationProbability > 60;
        const et0 = dayWeather.et0 || 5;
        const kc = cropData?.currentKc || 1.0;
        const etc = et0 * kc;

        schedule.push({
            date: date.toISOString().split('T')[0],
            action: willRain ? 'NO_IRRIGATION' : (i % 2 === 0 ? 'IRRIGATE' : 'MONITOR'),
            time: '18:00',
            duration_mins: Math.round(etc * 10),
            volume_liters: Math.round(etc * 10000 * (farmData?.areaHectares || 1)),
            reasoning: willRain
                ? `Rain expected (${dayWeather.precipitationProbability}%). Skip irrigation.`
                : `ETc = ${etc.toFixed(1)}mm. Irrigate during power window.`,
            rainAvoided: willRain
        });
    }

    return {
        success: true,
        schedule,
        isDemo: true
    };
}

function getDemoGuidelines(cropName, topic) {
    return {
        success: true,
        guidelines: {
            source: 'ICAR-IIWM (Indian Institute of Water Management)',
            guidelines: [
                `Critical irrigation stages for ${cropName}: Flowering and grain filling`,
                'Morning irrigation (6-8 AM) reduces evaporation losses by 20%',
                'Mulching with crop residue can save 30% water',
                'Check soil moisture before irrigating - avoid over-watering'
            ],
            localTip: 'Use tensiometer or feel-test to check soil moisture',
            waterSavingTip: 'Alternate wetting and drying (AWD) can save 25% water in paddy'
        },
        isDemo: true
    };
}

export default {
    chat,
    generateIrrigationSchedule,
    getKrishiGuidelines,
    isGeminiConfigured
};
