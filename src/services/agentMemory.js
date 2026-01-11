/**
 * Agent Memory - Manages conversation context and farm data persistence
 */

const MEMORY_KEY = 'krishi_agent_memory';
const MAX_MESSAGES = 20;

/**
 * Agent Memory Manager
 */
class AgentMemory {
    constructor() {
        this.context = {
            farmerId: null,
            farm: null,
            crop: null,
            weather: null,
            preferences: { language: 'en', units: 'metric' },
            conversationHistory: [],
            lastUpdated: null
        };
        this.load();
    }

    /**
     * Load memory from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(MEMORY_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.context = { ...this.context, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load agent memory:', e);
        }
    }

    /**
     * Save memory to localStorage
     */
    save() {
        try {
            this.context.lastUpdated = new Date().toISOString();
            localStorage.setItem(MEMORY_KEY, JSON.stringify(this.context));
        } catch (e) {
            console.warn('Failed to save agent memory:', e);
        }
    }

    /**
     * Get current context
     */
    getContext() {
        return { ...this.context };
    }

    /**
     * Set farmer context after registration/login
     */
    setFarmer(farmer) {
        this.context.farmerId = farmer.id;
        this.context.farm = {
            id: farmer.id,
            name: farmer.full_name,
            state: farmer.state,
            district: farmer.district,
            village: farmer.village,
            land_size_ha: farmer.land_size_ha,
            soil_type: farmer.soil_type,
            water_source: farmer.water_source,
            irrigation_method: farmer.irrigation_method,
            latitude: farmer.latitude,
            longitude: farmer.longitude
        };
        this.context.crop = {
            primary_crop: farmer.primary_crop,
            planting_date: farmer.planting_date,
            daysAfterPlanting: this.calculateDaysAfterPlanting(farmer.planting_date)
        };
        this.context.preferences.language = farmer.language || 'en';
        this.save();
    }

    /**
     * Calculate days after planting
     */
    calculateDaysAfterPlanting(plantingDate) {
        if (!plantingDate) return 0;
        const planted = new Date(plantingDate);
        const now = new Date();
        return Math.floor((now - planted) / (1000 * 60 * 60 * 24));
    }

    /**
     * Update farm details
     */
    updateFarm(updates) {
        this.context.farm = { ...this.context.farm, ...updates };
        this.save();
    }

    /**
     * Update crop details
     */
    updateCrop(updates) {
        this.context.crop = { ...this.context.crop, ...updates };
        if (updates.planting_date) {
            this.context.crop.daysAfterPlanting = this.calculateDaysAfterPlanting(updates.planting_date);
        }
        this.save();
    }

    /**
     * Update weather cache
     */
    updateWeather(weather) {
        this.context.weather = weather;
        this.save();
    }

    /**
     * Update preferences
     */
    updatePreferences(prefs) {
        this.context.preferences = { ...this.context.preferences, ...prefs };
        this.save();
    }

    /**
     * Add a message to conversation history
     */
    addMessage(role, content) {
        this.context.conversationHistory.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });

        // Keep only last MAX_MESSAGES
        if (this.context.conversationHistory.length > MAX_MESSAGES) {
            this.context.conversationHistory = this.context.conversationHistory.slice(-MAX_MESSAGES);
        }

        this.save();
    }

    /**
     * Get conversation history for agent
     */
    getConversationHistory() {
        return this.context.conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * Clear conversation history (keep farm context)
     */
    clearConversation() {
        this.context.conversationHistory = [];
        this.save();
    }

    /**
     * Clear all memory
     */
    clearAll() {
        this.context = {
            farmerId: null,
            farm: null,
            crop: null,
            weather: null,
            preferences: { language: 'en', units: 'metric' },
            conversationHistory: [],
            lastUpdated: null
        };
        localStorage.removeItem(MEMORY_KEY);
    }

    /**
     * Check if farmer is set up
     */
    hasFarmer() {
        return !!this.context.farmerId;
    }

    /**
     * Get summary for display
     */
    getSummary() {
        if (!this.context.farm) return null;

        return {
            farmer: this.context.farm.name,
            location: `${this.context.farm.district}, ${this.context.farm.state}`,
            farm: `${this.context.farm.land_size_ha} ha, ${this.context.farm.soil_type} soil`,
            crop: this.context.crop?.primary_crop,
            daysAfterPlanting: this.context.crop?.daysAfterPlanting,
            language: this.context.preferences.language
        };
    }
}

// Singleton instance
export const agentMemory = new AgentMemory();
export default agentMemory;
