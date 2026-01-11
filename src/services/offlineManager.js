/**
 * Offline Manager
 * Handles caching and offline functionality for the app
 */

const CACHE_KEYS = {
    WEATHER: 'krishi_weather_cache',
    SCHEDULE: 'krishi_schedule_cache',
    FARM: 'krishi_farm_cache',
    SETTINGS: 'krishi_settings'
};

const CACHE_DURATION = {
    WEATHER: 3 * 60 * 60 * 1000,     // 3 hours
    SCHEDULE: 24 * 60 * 60 * 1000,   // 24 hours
    FARM: 7 * 24 * 60 * 60 * 1000,   // 7 days
    SETTINGS: Infinity
};

/**
 * Check if the app is online
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Add online/offline event listeners
 */
export function setupNetworkListeners(onOnline, onOffline) {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
}

/**
 * Cache data with expiry
 */
export function cacheData(key, data, duration = CACHE_DURATION.WEATHER) {
    try {
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            expiresAt: duration === Infinity ? null : Date.now() + duration
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        return true;
    } catch (error) {
        console.warn('Failed to cache data:', error);
        // If storage is full, clear old caches
        if (error.name === 'QuotaExceededError') {
            clearOldCaches();
            try {
                localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }
}

/**
 * Get cached data
 * @param {string} key 
 * @param {boolean} allowExpired - Return expired data if no fresh data
 */
export function getCachedData(key, allowExpired = false) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp, expiresAt } = JSON.parse(cached);

        // Check if expired
        if (expiresAt && Date.now() > expiresAt) {
            if (!allowExpired) {
                localStorage.removeItem(key);
                return null;
            }
            // Return with expired flag
            return { data, isExpired: true, cachedAt: new Date(timestamp) };
        }

        return { data, isExpired: false, cachedAt: new Date(timestamp) };
    } catch (error) {
        console.warn('Failed to read cache:', error);
        return null;
    }
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
    Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    // Also clear any location-specific weather caches
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith(CACHE_KEYS.WEATHER)) {
            localStorage.removeItem(key);
        }
    }
}

/**
 * Clear old/expired caches to free up space
 */
function clearOldCaches() {
    const now = Date.now();

    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('krishi_')) {
            try {
                const cached = JSON.parse(localStorage.getItem(key));
                if (cached.expiresAt && now > cached.expiresAt) {
                    localStorage.removeItem(key);
                }
            } catch {
                // If can't parse, remove it
                localStorage.removeItem(key);
            }
        }
    }
}

/**
 * Cache weather data for a location
 */
export function cacheWeather(lat, lon, data) {
    const key = `${CACHE_KEYS.WEATHER}_${lat}_${lon}`;
    return cacheData(key, data, CACHE_DURATION.WEATHER);
}

/**
 * Get cached weather for a location
 */
export function getCachedWeather(lat, lon, allowExpired = true) {
    const key = `${CACHE_KEYS.WEATHER}_${lat}_${lon}`;
    return getCachedData(key, allowExpired);
}

/**
 * Cache irrigation schedule
 */
export function cacheSchedule(farmId, schedule) {
    const key = `${CACHE_KEYS.SCHEDULE}_${farmId}`;
    return cacheData(key, schedule, CACHE_DURATION.SCHEDULE);
}

/**
 * Get cached schedule
 */
export function getCachedSchedule(farmId, allowExpired = true) {
    const key = `${CACHE_KEYS.SCHEDULE}_${farmId}`;
    return getCachedData(key, allowExpired);
}

/**
 * Cache farm data
 */
export function cacheFarm(farmData) {
    return cacheData(CACHE_KEYS.FARM, farmData, CACHE_DURATION.FARM);
}

/**
 * Get cached farm data
 */
export function getCachedFarm() {
    return getCachedData(CACHE_KEYS.FARM, true);
}

/**
 * Save settings (persistent)
 */
export function saveSettings(settings) {
    return cacheData(CACHE_KEYS.SETTINGS, settings, Infinity);
}

/**
 * Get settings
 */
export function getSettings() {
    const cached = getCachedData(CACHE_KEYS.SETTINGS, true);
    return cached?.data || getDefaultSettings();
}

/**
 * Default settings
 */
function getDefaultSettings() {
    return {
        language: 'hi_translit',
        useTransliteration: true,
        notifications: true,
        darkMode: false,
        units: {
            area: 'hectare', // or 'bigha'
            water: 'liters'  // or 'tanker'
        }
    };
}

/**
 * Get storage usage stats
 */
export function getStorageStats() {
    let totalSize = 0;
    const details = {};

    for (const key of Object.keys(localStorage)) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;

        if (key.startsWith('krishi_')) {
            details[key] = {
                size,
                sizeKB: (size / 1024).toFixed(2)
            };
        }
    }

    return {
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        details
    };
}

/**
 * Sync cached data when online
 * This would sync any offline changes to the server
 */
export async function syncCachedData() {
    if (!isOnline()) {
        return { success: false, reason: 'offline' };
    }

    // In a real app, this would:
    // 1. Get any pending offline changes
    // 2. Send them to the server
    // 3. Update local cache with server data

    console.log('Syncing cached data...');
    return { success: true, synced: true };
}

export default {
    isOnline,
    setupNetworkListeners,
    cacheData,
    getCachedData,
    clearAllCaches,
    cacheWeather,
    getCachedWeather,
    cacheSchedule,
    getCachedSchedule,
    cacheFarm,
    getCachedFarm,
    saveSettings,
    getSettings,
    getStorageStats,
    syncCachedData,
    CACHE_KEYS
};
