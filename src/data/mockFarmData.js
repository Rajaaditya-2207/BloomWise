/**
 * Realistic Mock Farm Data
 * Used for "Preview Mode" to demonstrate full app capabilities including:
 * - Analytics (History, Financials)
 * - Simulation (Soil, Water parameters)
 * - detailed Farm Profile
 */

export const REALISTIC_MOCK_FARM = {
    id: 'preview-farmer-001',
    name: 'Rajesh Kumar (Preview)',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    village: 'Rampur',

    // Physical Parameters (for Simulation)
    areaHectares: 4.2, // ~10.4 Acres
    latitude: 26.8467,
    longitude: 80.9462,

    // Environmental Profile
    soilType: 'clay_loam', // Good water retention
    soilHealth: {
        ph: 7.2,
        nitrogen: 'Medium',
        phosphorus: 'High',
        potassium: 'Medium',
        organicCarbon: 0.75, // %
        moistureRetentionIndex: 0.65 // 0-1 scale
    },

    // Water Resources
    waterSource: 'borewell_and_canal',
    waterAvailability: {
        sourceType: 'Borewell',
        pumpPowerHP: 7.5,
        flowRateLPH: 12000,
        avgDailyAvailabilityHrs: 6, // Power dependent
        depthFeet: 180
    },
    irrigationMethod: 'drip_irrigation',

    // Infrastructure
    powerSchedule: 'morning_slot', // 6 AM - 2 PM typical

    // Current Active Crops (The "Now")
    crops: [
        {
            id: 'c_01',
            name: 'Wheat',
            variety: 'HD-3086 (Pusa Gautami)',
            sowingDate: '2025-11-15', // Approx 2 months ago
            stage: 'Flowering',
            healthScore: 88,
            expectedHarvest: '2026-04-10',
            areaAllocated: 2.5, // Hectares
            waterNeeds: 'Moderate'
        },
        {
            id: 'c_02',
            name: 'Mustard',
            variety: 'Pusa Bold',
            sowingDate: '2025-10-20',
            stage: 'Pod Formation',
            healthScore: 92,
            expectedHarvest: '2026-03-05',
            areaAllocated: 1.2, // Hectares
            waterNeeds: 'Low'
        }
    ],

    // Historical Data (For Analytics Dashboard)
    history: {
        // Last 4 Seasons Yield
        yields: [
            { season: 'Rabi 2024-25', crop: 'Wheat', yieldQuintals: 145, revenue: 326250 }, // Projected/Current
            { season: 'Kharif 2024', crop: 'Paddy', yieldQuintals: 180, revenue: 396000 },
            { season: 'Rabi 2023-24', crop: 'Wheat', yieldQuintals: 138, revenue: 303600 },
            { season: 'Kharif 2023', crop: 'Paddy', yieldQuintals: 175, revenue: 385000 }
        ],

        // Monthly Resource Usage (Last 12 Months)
        resourceUsage: [
            { month: 'Jan', waterLiters: 450000, powerUnits: 280 },
            { month: 'Feb', waterLiters: 420000, powerUnits: 260 },
            { month: 'Mar', waterLiters: 380000, powerUnits: 240 },
            { month: 'Apr', waterLiters: 200000, powerUnits: 150 }, // Harvest
            { month: 'May', waterLiters: 150000, powerUnits: 120 }, // Fallow/Prep
            { month: 'Jun', waterLiters: 600000, powerUnits: 350 }, // Paddy Sowing (Nursery)
            { month: 'Jul', waterLiters: 850000, powerUnits: 480 }, // Paddy Transplanting (High)
            { month: 'Aug', waterLiters: 700000, powerUnits: 420 },
            { month: 'Sep', waterLiters: 550000, powerUnits: 340 },
            { month: 'Oct', waterLiters: 300000, powerUnits: 200 }, // Harvest/Prep
            { month: 'Nov', waterLiters: 480000, powerUnits: 310 }, // Wheat Sowing
            { month: 'Dec', waterLiters: 460000, powerUnits: 290 }
        ],

        // Financials (Last 12 Months Aggregated)
        financials: {
            totalRevenue: 722250, // Yearly
            totalExpenses: 288900, // ~40% of revenue
            netProfit: 433350,
            expenseBreakdown: {
                seeds: 45000,
                fertilizers: 68000,
                labor: 120000,
                powerWater: 35000,
                machinery: 20900
            }
        }
    },

    isDemo: true
};
