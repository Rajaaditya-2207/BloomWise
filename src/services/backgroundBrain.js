import { generateDailyPlan } from './aiService';

export const backgroundBrain = {

    /**
     * Generates a 24-hour irrigation plan based on farm context and weather
     */
    async getDailyPlan(context, date, weather) {
        // Now delegating entirely to Python Backend
        try {
            const plan = await generateDailyPlan(context, date, weather);

            if (plan && Array.isArray(plan) && plan.length === 24) {
                return plan;
            } else {
                console.warn('BackgroundBrain: Backend returned invalid plan', plan);
                return null;
            }

        } catch (error) {
            console.error('BackgroundBrain: Failed to generate plan via backend', error);
            return null;
        }
    }
};
