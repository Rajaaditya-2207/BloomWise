/**
 * Weather Service
 * Uses Open-Meteo API for weather data and ET₀ calculations
 * Includes caching for offline support
 */

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const CACHE_KEY = 'krishi_weather_cache';
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Get current weather and forecast for a location
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} forecastDays - Number of days to forecast (1-16)
 */
export async function getWeatherForecast(latitude, longitude, forecastDays = 7) {
    const cacheKey = `${CACHE_KEY}_${latitude}_${longitude}`;

    // Check cache first
    const cached = getCachedWeather(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: [
                'temperature_2m',
                'relative_humidity_2m',
                'precipitation',
                'weather_code',
                'wind_speed_10m',
                'soil_temperature_0cm',
                'soil_moisture_0_to_1cm'
            ].join(','),
            hourly: [
                'temperature_2m',
                'relative_humidity_2m',
                'precipitation_probability',
                'precipitation',
                'et0_fao_evapotranspiration', // Critical for irrigation!
                'soil_temperature_6cm',
                'soil_moisture_0_to_1cm',
                'soil_moisture_1_to_3cm',
                'soil_moisture_3_to_9cm'
            ].join(','),
            daily: [
                'weather_code',
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'precipitation_probability_max',
                'et0_fao_evapotranspiration', // Daily ET₀
                'sunrise',
                'sunset'
            ].join(','),
            timezone: 'Asia/Kolkata',
            forecast_days: forecastDays.toString()
        });

        const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        const data = await response.json();

        // Process and structure the data
        const processed = processWeatherData(data);

        // Cache the result
        cacheWeather(cacheKey, processed);

        return processed;
    } catch (error) {
        console.error('Failed to fetch weather:', error);

        // Try to return cached data even if expired
        const expiredCache = getCachedWeather(cacheKey, true);
        if (expiredCache) {
            expiredCache._isOffline = true;
            return expiredCache;
        }

        throw error;
    }
}

/**
 * Get historical weather data for simulation
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export async function getHistoricalWeather(latitude, longitude, startDate, endDate) {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            start_date: startDate,
            end_date: endDate,
            daily: [
                'weather_code',
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'et0_fao_evapotranspiration'
            ].join(','),
            timezone: 'Asia/Kolkata'
        });

        const response = await fetch(`${OPEN_METEO_BASE}/archive?${params}`);

        if (!response.ok) {
            throw new Error(`Historical weather API error: ${response.status}`);
        }

        const data = await response.json();
        return processHistoricalData(data);
    } catch (error) {
        console.error('Failed to fetch historical weather:', error);
        throw error;
    }
}

/**
 * Process raw weather data into structured format
 */
function processWeatherData(data) {
    const { current, hourly, daily } = data;

    return {
        current: {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
            weatherCode: current.weather_code,
            weatherDescription: getWeatherDescription(current.weather_code),
            windSpeed: current.wind_speed_10m,
            soilTemperature: current.soil_temperature_0cm,
            soilMoisture: current.soil_moisture_0_to_1cm,
            time: new Date()
        },

        hourly: {
            time: hourly.time.map(t => new Date(t)),
            temperature: hourly.temperature_2m,
            humidity: hourly.relative_humidity_2m,
            precipitationProbability: hourly.precipitation_probability,
            precipitation: hourly.precipitation,
            et0: hourly.et0_fao_evapotranspiration, // Hourly ET₀
            soilMoisture: {
                surface: hourly.soil_moisture_0_to_1cm,
                shallow: hourly.soil_moisture_1_to_3cm,
                deep: hourly.soil_moisture_3_to_9cm
            }
        },

        daily: daily.time.map((date, i) => ({
            date: new Date(date),
            weatherCode: daily.weather_code[i],
            weatherDescription: getWeatherDescription(daily.weather_code[i]),
            tempMax: daily.temperature_2m_max[i],
            tempMin: daily.temperature_2m_min[i],
            precipitationSum: daily.precipitation_sum[i],
            precipitationProbability: daily.precipitation_probability_max[i],
            et0: daily.et0_fao_evapotranspiration[i], // Daily ET₀ in mm
            sunrise: daily.sunrise[i],
            sunset: daily.sunset[i]
        })),

        // Aggregated metrics for quick access
        summary: {
            todayEt0: daily.et0_fao_evapotranspiration[0],
            next3DaysRain: daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + (b || 0), 0),
            rainChanceToday: daily.precipitation_probability_max[0],
            avgSoilMoisture: current.soil_moisture_0_to_1cm,
            isHeatwave: daily.temperature_2m_max[0] > 40
        },

        _fetchedAt: new Date().toISOString(),
        _isOffline: false
    };
}

/**
 * Process historical weather data
 */
function processHistoricalData(data) {
    const { daily } = data;

    return daily.time.map((date, i) => ({
        date: new Date(date),
        weatherCode: daily.weather_code[i],
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        precipitationSum: daily.precipitation_sum[i],
        et0: daily.et0_fao_evapotranspiration[i]
    }));
}

/**
 * Cache weather data to localStorage
 */
function cacheWeather(key, data) {
    try {
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Failed to cache weather data:', error);
    }
}

/**
 * Get cached weather data
 * @param {string} key 
 * @param {boolean} ignoreExpiry - Return even if expired
 */
function getCachedWeather(key, ignoreExpiry = false) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        if (!ignoreExpiry && isExpired) {
            return null;
        }

        return data;
    } catch (error) {
        return null;
    }
}

/**
 * Get weather description from WMO code
 */
export function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };

    return descriptions[code] || 'Unknown';
}

/**
 * Get weather icon based on WMO code
 */
export function getWeatherIcon(code) {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 57) return '🌧️';
    if (code >= 61 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '🌡️';
}

/**
 * Calculate irrigation requirement based on ET₀ and crop Kc
 * @param {number} et0 - Reference evapotranspiration in mm
 * @param {number} kc - Crop coefficient
 * @param {number} rainfall - Effective rainfall in mm
 * @param {number} soilMoisture - Current soil moisture (0-1)
 * @param {number} areaHectares - Farm area in hectares
 * @param {number} irrigationEfficiency - Irrigation system efficiency (0-1)
 * @returns {object} Irrigation requirement
 */
export function calculateIrrigationNeed(
    et0,
    kc,
    rainfall = 0,
    soilMoisture = 0.5,
    areaHectares = 1,
    irrigationEfficiency = 0.7
) {
    // Crop evapotranspiration (ETc)
    const etc = et0 * kc;

    // Effective rainfall (assume 75% is usable)
    const effectiveRainfall = rainfall * 0.75;

    // Net irrigation requirement
    const netIrrigationMm = Math.max(0, etc - effectiveRainfall);

    // Gross irrigation (accounting for efficiency)
    const grossIrrigationMm = netIrrigationMm / irrigationEfficiency;

    // Convert to liters for the farm
    // 1mm over 1 hectare = 10,000 liters
    const litersRequired = grossIrrigationMm * 10000 * areaHectares;

    // Determine urgency based on soil moisture
    let urgency = 'normal';
    if (soilMoisture < 0.2) urgency = 'critical';
    else if (soilMoisture < 0.35) urgency = 'high';
    else if (soilMoisture > 0.6) urgency = 'low';

    return {
        etc: Math.round(etc * 100) / 100,
        netIrrigationMm: Math.round(netIrrigationMm * 100) / 100,
        grossIrrigationMm: Math.round(grossIrrigationMm * 100) / 100,
        litersRequired: Math.round(litersRequired),
        urgency,
        shouldIrrigate: netIrrigationMm > 0.5 && soilMoisture < 0.5,
        reasoning: generateIrrigationReasoning(etc, rainfall, soilMoisture, urgency)
    };
}

function generateIrrigationReasoning(etc, rainfall, soilMoisture, urgency) {
    const reasons = [];

    if (etc > 5) {
        reasons.push(`High evapotranspiration (${etc.toFixed(1)} mm/day)`);
    }

    if (rainfall > 0) {
        reasons.push(`${rainfall.toFixed(1)} mm rainfall expected`);
    }

    if (soilMoisture < 0.3) {
        reasons.push(`Low soil moisture (${(soilMoisture * 100).toFixed(0)}%)`);
    } else if (soilMoisture > 0.6) {
        reasons.push(`Good soil moisture (${(soilMoisture * 100).toFixed(0)}%)`);
    }

    return reasons.join('. ');
}

export default {
    getWeatherForecast,
    getHistoricalWeather,
    getWeatherDescription,
    getWeatherIcon,
    calculateIrrigationNeed
};
