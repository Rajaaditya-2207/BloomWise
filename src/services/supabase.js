/**
 * Supabase Client Configuration
 * Handles database connection with offline fallback
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey &&
    supabaseUrl !== 'your_supabase_project_url' &&
    supabaseAnonKey !== 'your_supabase_anon_key');

// Create Supabase client if configured
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Demo mode check
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !isSupabaseConfigured;

/**
 * Get authenticated user
 */
export async function getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Sign in with email
 */
export async function signInWithEmail(email, password) {
    if (!supabase) {
        console.warn('Supabase not configured. Using demo mode.');
        return { user: { id: 'demo-user', email: 'demo@krishijal.ai' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign up with email
 */
export async function signUpWithEmail(email, password, metadata = {}) {
    if (!supabase) {
        console.warn('Supabase not configured. Using demo mode.');
        return { user: { id: 'demo-user', email: 'demo@krishijal.ai' } };
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out
 */
export async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}


/**
 * Sign in with Email OTP
 */
export async function signInWithEmailOtp(email) {
    if (!supabase) {
        console.warn('Supabase not configured. Using demo mode.');
        return { error: null }; // Simulate success
    }

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: false
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Verify Email OTP
 */
export async function verifyEmailOtp(email, token) {
    if (!supabase) {
        console.warn('Supabase not configured. Using demo mode.');
        // Verify mock OTP '123456'
        if (token === '123456') {
            return {
                data: {
                    user: { email, id: 'demo-otp-user' },
                    session: { access_token: 'mock-token' }
                },
                error: null
            };
        }
        return { data: null, error: { message: 'Invalid OTP' } };
    }

    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
    });

    if (error) throw error;
    return data;
}

/**
 * Database helper functions
 */

// Farms
export async function getFarms(userId) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('farms')
        .select(`
      *,
      region:regions(*),
      soil_type:soil_types(*),
      water_source:water_sources(*),
      irrigation_method:irrigation_methods(*)
    `)
        .eq('user_id', userId);

    if (error) throw error;
    return data || [];
}

export async function createFarm(farmData) {
    if (!supabase) {
        console.warn('Supabase not configured. Farm not saved.');
        return { id: 'demo-farm', ...farmData };
    }

    const { data, error } = await supabase
        .from('farms')
        .insert(farmData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateFarm(farmId, updates) {
    if (!supabase) return { id: farmId, ...updates };

    const { data, error } = await supabase
        .from('farms')
        .update(updates)
        .eq('id', farmId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Schedules
export async function getSchedules(farmId) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('schedules')
        .select(`
      *,
      crop:crops(*)
    `)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createSchedule(scheduleData) {
    if (!supabase) {
        console.warn('Supabase not configured. Schedule not saved.');
        return { id: 'demo-schedule', ...scheduleData };
    }

    const { data, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Water savings leaderboard
export async function getLeaderboard(regionId, limit = 10) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('water_savings_leaderboard')
        .select(`
      *,
      farm:farms(name, village)
    `)
        .eq('region_id', regionId)
        .order('water_saved_liters', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// Krishi guidelines
export async function getKrishiGuidelines(cropId, regionId) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('krishi_guidelines')
        .select('*')
        .eq('crop_id', cropId)
        .or(`region_id.eq.${regionId},region_id.is.null`);

    if (error) throw error;
    return data || [];
}

export default supabase;
