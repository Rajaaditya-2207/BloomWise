/**
 * Weather Cache Service
 * Caches historical weather data in Supabase to avoid API rate limits
 * Uses Open-Meteo Archive API for batch fetching
 */

import { supabase } from './supabase';

const ARCHIVE_API_BASE = 'https://archive-api.open-meteo.com/v1/archive';

/**
 * Get weather for a date range, using cache first, then API
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Object[]>} Array of daily weather objects
 */
export async function getWeatherRange(latitude, longitude, startDate, endDate) {
    // Round coordinates for better cache hits (to ~1km precision)
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;

    console.log(`[WeatherCache] Fetching weather for ${lat}, ${lon} from ${startDate} to ${endDate}`);

    // 1. Check cache for existing data
    const { data: cached, error: cacheError } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('latitude', lat)
        .eq('longitude', lon)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (cacheError) {
        console.warn('[WeatherCache] Cache lookup error:', cacheError.message);
    }

    // Build set of cached dates
    const cachedDates = new Set((cached || []).map(w => w.date));

    // Find missing dates
    const missingDates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (!cachedDates.has(dateStr)) {
            missingDates.push(dateStr);
        }
        current.setDate(current.getDate() + 1);
    }

    console.log(`[WeatherCache] Found ${cached?.length || 0} cached, ${missingDates.length} missing`);

    // 2. Fetch missing data from API (batch request)
    if (missingDates.length > 0) {
        const fetchStart = missingDates[0];
        const fetchEnd = missingDates[missingDates.length - 1];

        try {
            const apiData = await fetchFromArchiveAPI(lat, lon, fetchStart, fetchEnd);

            if (apiData && apiData.length > 0) {
                // Store in cache
                const cacheInserts = apiData.map(day => ({
                    latitude: lat,
                    longitude: lon,
                    date: day.date,
                    temperature_max: day.temperatureMax,
                    temperature_min: day.temperatureMin,
                    temperature_mean: day.temperatureMean,
                    precipitation_sum: day.precipitationSum,
                    precipitation_probability: day.precipitationProbability || 0,
                    humidity_mean: day.humidityMean,
                    wind_speed_max: day.windSpeedMax,
                    et0: day.et0,
                    weather_code: day.weatherCode
                }));

                // Upsert to handle duplicates
                const { error: insertError } = await supabase
                    .from('weather_cache')
                    .upsert(cacheInserts, {
                        onConflict: 'latitude,longitude,date',
                        ignoreDuplicates: true
                    });

                if (insertError) {
                    console.warn('[WeatherCache] Cache insert error:', insertError.message);
                } else {
                    console.log(`[WeatherCache] Cached ${apiData.length} new weather records`);
                }

                // Merge with cached data
                return mergeCachedAndNew(cached || [], apiData);
            }
        } catch (apiError) {
            console.error('[WeatherCache] API fetch error:', apiError.message);
        }
    }

    // Return cached data transformed to standard format
    return (cached || []).map(transformCacheToWeather);
}

/**
 * Fetch weather from Open-Meteo Archive API
 */
async function fetchFromArchiveAPI(lat, lon, startDate, endDate) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: endDate,
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'temperature_2m_mean',
            'precipitation_sum',
            'precipitation_probability_max',
            'relative_humidity_2m_mean',
            'wind_speed_10m_max',
            'et0_fao_evapotranspiration',
            'weather_code'
        ].join(','),
        timezone: 'Asia/Kolkata'
    });

    const url = `${ARCHIVE_API_BASE}?${params}`;
    console.log(`[WeatherCache] Fetching from archive API: ${startDate} to ${endDate}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Archive API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time) {
        return [];
    }

    // Transform API response to our format
    return data.daily.time.map((date, i) => ({
        date,
        temperatureMax: data.daily.temperature_2m_max?.[i],
        temperatureMin: data.daily.temperature_2m_min?.[i],
        temperatureMean: data.daily.temperature_2m_mean?.[i],
        precipitationSum: data.daily.precipitation_sum?.[i] || 0,
        precipitationProbability: data.daily.precipitation_probability_max?.[i] || 0,
        humidityMean: data.daily.relative_humidity_2m_mean?.[i],
        windSpeedMax: data.daily.wind_speed_10m_max?.[i],
        et0: data.daily.et0_fao_evapotranspiration?.[i],
        weatherCode: data.daily.weather_code?.[i]
    }));
}

/**
 * Get weather for a single date (uses cache)
 */
export async function getWeatherForDate(latitude, longitude, date) {
    const result = await getWeatherRange(latitude, longitude, date, date);
    return result[0] || null;
}

/**
 * Transform cache record to standard weather format
 */
function transformCacheToWeather(cache) {
    return {
        date: cache.date,
        temperatureMax: cache.temperature_max,
        temperatureMin: cache.temperature_min,
        temperatureMean: cache.temperature_mean,
        precipitationSum: cache.precipitation_sum,
        precipitationProbability: cache.precipitation_probability,
        humidityMean: cache.humidity_mean,
        windSpeedMax: cache.wind_speed_max,
        et0: cache.et0,
        weatherCode: cache.weather_code
    };
}

/**
 * Merge cached and newly fetched data
 */
function mergeCachedAndNew(cached, newData) {
    const byDate = new Map();

    // Add cached (transformed)
    (cached || []).forEach(c => {
        byDate.set(c.date, transformCacheToWeather(c));
    });

    // Add/override with new
    (newData || []).forEach(n => {
        byDate.set(n.date, n);
    });

    // Return sorted
    return Array.from(byDate.values()).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );
}

/**
 * Helper: Get rain probability from weather code
 * WMO Weather interpretation codes
 */
export function getRainProbabilityFromCode(weatherCode) {
    if (!weatherCode) return 0;
    // Rain codes: 51-67, 80-82, 95-99
    if (weatherCode >= 51 && weatherCode <= 67) return 70; // Drizzle/Rain
    if (weatherCode >= 80 && weatherCode <= 82) return 85; // Showers
    if (weatherCode >= 95 && weatherCode <= 99) return 90; // Thunderstorm
    if (weatherCode === 45 || weatherCode === 48) return 20; // Fog
    return 0;
}

export default {
    getWeatherRange,
    getWeatherForDate,
    getRainProbabilityFromCode
};
