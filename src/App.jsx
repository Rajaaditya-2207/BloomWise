import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Components
import Dashboard from './components/Dashboard';
import FarmSetup from './components/FarmSetup';
import IrrigationSchedule from './components/IrrigationSchedule';
import WhatsAppChat from './components/WhatsAppChat';
import WeeklyReport from './components/WeeklyReport';
import Navigation from './components/Navigation';
import OfflineIndicator from './components/OfflineIndicator';
import Settings from './components/Settings';
import FarmerRegistration from './components/FarmerRegistration';
import SignalHistory from './components/SignalHistory';
import LookerDashboard from './components/LookerDashboard';
import LandingPage from './components/LandingPage';
import SignIn from './components/SignIn';
import Simulate from './components/Simulate';

// Services
import { getSettings, saveSettings, isOnline, setupNetworkListeners } from './services/offlineManager';
import { getCachedFarm, cacheFarm } from './services/offlineManager';
import { getWeatherForecast } from './services/weatherService';
import { getCurrentPowerStatus } from './data/powerSchedules';
import { agentMemory } from './services/agentMemory';
import { backgroundAgent } from './services/backgroundAgent';

// Utils
import { t, getCurrentLanguage, setCurrentLanguage, SUPPORTED_LANGUAGES } from './utils/translations';

// Create contexts
export const AppContext = createContext();
export const LanguageContext = createContext();
export const ThemeContext = createContext();

// Available themes
export const THEMES = [
    { id: 'dark', name: 'Dark', icon: '🌙', nameHi: 'डार्क' },
    { id: 'light', name: 'Light', icon: '☀️', nameHi: 'लाइट' }
];

const MOCK_FARM_PREVIEW = {
    id: 'preview-farmer',
    name: 'Rajesh Kumar (Preview)',
    state: 'UP',
    district: 'Lucknow',
    village: 'Demo Village',
    land_size_ha: 2.5,
    soil_type: 'alluvial',
    water_source: 'borewell',
    irrigation_method: 'drip',
    latitude: 26.8467,
    longitude: 80.9462
};

function App() {
    // State
    const [language, setLanguage] = useState(getCurrentLanguage());
    const [settings, setSettings] = useState(getSettings());
    const [isOffline, setIsOffline] = useState(!isOnline());
    const [farm, setFarm] = useState(null);
    const [weather, setWeather] = useState(null);
    const [powerStatus, setPowerStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('krishi-theme') || 'dark';
    });

    const location = useLocation();

    // Initialize app
    useEffect(() => {
        // Handle Preview Routes specifically (any path starting with /preview)
        if (location.pathname.startsWith('/preview')) {
            console.log('Entering Preview Mode');
            setFarm(MOCK_FARM_PREVIEW);
            setIsRegistered(true);
            setLoading(false);
            return; // Skip normal initialization
        }

        initializeApp();

        // Setup network listeners
        const cleanup = setupNetworkListeners(
            () => setIsOffline(false),
            () => setIsOffline(true)
        );

        return cleanup;
    }, [location.pathname]);

    // Start background agent when farmer is registered
    useEffect(() => {
        if (isRegistered && agentMemory.hasFarmer()) {
            backgroundAgent.start();
        }
        return () => backgroundAgent.stop();
    }, [isRegistered]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('krishi-theme', theme);
    }, [theme]);

    // Fetch weather when farm location changes
    useEffect(() => {
        if (farm?.latitude && farm?.longitude) {
            fetchWeather(farm.latitude, farm.longitude);
        }
    }, [farm?.latitude, farm?.longitude]);

    // Update power status when region changes
    useEffect(() => {
        if (farm?.regionId || farm?.state) {
            const status = getCurrentPowerStatus(farm.regionId || farm.state);
            setPowerStatus(status);
        }
    }, [farm?.regionId, farm?.state]);

    async function initializeApp() {
        try {
            // Check if farmer is registered in agent memory
            if (agentMemory.hasFarmer()) {
                const context = agentMemory.getContext();
                setFarm(context.farm);
                setIsRegistered(true);
            } else {
                // Try to get cached farm data (legacy)
                const cachedFarm = getCachedFarm();
                if (cachedFarm?.data) {
                    setFarm(cachedFarm.data);
                    setIsRegistered(true);
                } else {
                    setIsRegistered(false);
                }
            }
        } catch (error) {
            console.error('Failed to initialize:', error);
            setIsRegistered(false);
        } finally {
            setLoading(false);
        }
    }

    async function fetchWeather(lat, lon) {
        try {
            const weatherData = await getWeatherForecast(lat, lon, 7);
            setWeather(weatherData);
            // Update agent memory with weather
            agentMemory.updateWeather(weatherData);
        } catch (error) {
            console.error('Failed to fetch weather:', error);
        }
    }

    function handleLanguageChange(newLang) {
        setLanguage(newLang);
        setCurrentLanguage(newLang);
        agentMemory.updatePreferences({ language: newLang });
        setSettings(prev => {
            const updated = { ...prev, language: newLang };
            saveSettings(updated);
            return updated;
        });
    }

    function handleFarmUpdate(updatedFarm) {
        setFarm(updatedFarm);
        cacheFarm(updatedFarm);
        agentMemory.updateFarm(updatedFarm);
    }

    // Handle registration complete
    function handleRegistrationComplete() {
        const context = agentMemory.getContext();
        setFarm(context.farm);
        setIsRegistered(true);
        backgroundAgent.start();
    }

    // Context value
    const appContextValue = {
        farm,
        setFarm: handleFarmUpdate,
        weather,
        refreshWeather: () => farm && fetchWeather(farm.latitude, farm.longitude),
        powerStatus,
        settings,
        updateSettings: (updates) => {
            const updated = { ...settings, ...updates };
            setSettings(updated);
            saveSettings(updated);
        },
        isOffline,
        loading,
        isRegistered,
        farmerId: agentMemory.getContext().farmerId
    };

    const languageContextValue = {
        language,
        setLanguage: handleLanguageChange,
        t: (key) => t(key, language),
        languages: SUPPORTED_LANGUAGES
    };

    const themeContextValue = {
        theme,
        setTheme: setThemeState,
        themes: THEMES
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <span className="loading-icon">🌾</span>
                    <h1>BloomWise</h1>
                    <p>Loading...</p>
                    <div className="loading-spinner"></div>
                </div>
                <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
          }
          .loading-content {
            text-align: center;
          }
          .loading-icon {
            font-size: 4rem;
            display: block;
            margin-bottom: 1rem;
          }
          .loading-content h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            margin: 1rem auto;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <AppContext.Provider value={appContextValue}>
            <ThemeContext.Provider value={themeContextValue}>
                <LanguageContext.Provider value={languageContextValue}>
                    <div className="app">
                        {/* Offline Banner */}
                        {isOffline && <OfflineIndicator />}

                        {/* Main Content */}
                        <main className="app-main" style={{ paddingBottom: (location.pathname === '/chat' || location.pathname === '/preview/chat') ? '0' : '80px' }}>
                            <Routes>
                                {/* Registration route - shown if not registered */}
                                <Route
                                    path="/register"
                                    element={<FarmerRegistration onComplete={handleRegistrationComplete} />}
                                />

                                {/* Protected routes - redirect to welcome if not registered */}
                                <Route
                                    path="/"
                                    element={isRegistered ? <Dashboard /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/welcome"
                                    element={isRegistered ? <Navigate to="/" replace /> : <LandingPage />}
                                />
                                <Route
                                    path="/signin"
                                    element={isRegistered ? <Navigate to="/" replace /> : <SignIn />}
                                />
                                <Route
                                    path="/preview"
                                    element={<Dashboard />}
                                />
                                <Route
                                    path="/preview/schedule"
                                    element={<IrrigationSchedule />}
                                />
                                <Route
                                    path="/preview/chat"
                                    element={<WhatsAppChat />}
                                />
                                <Route
                                    path="/preview/report"
                                    element={<WeeklyReport />}
                                />
                                <Route
                                    path="/preview/signals"
                                    element={<SignalHistory />}
                                />
                                <Route
                                    path="/preview/settings"
                                    element={<Settings />}
                                />
                                <Route
                                    path="/schedule"
                                    element={isRegistered ? <IrrigationSchedule /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/chat"
                                    element={isRegistered ? <WhatsAppChat /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/farm"
                                    element={isRegistered ? <FarmSetup /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/report"
                                    element={isRegistered ? <WeeklyReport /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/settings"
                                    element={isRegistered ? <Settings /> : <Navigate to="/welcome" replace />}
                                />

                                {/* New routes */}
                                <Route
                                    path="/signals"
                                    element={isRegistered ? <SignalHistory /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/simulate"
                                    element={isRegistered ? <Simulate /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/preview/simulate"
                                    element={<Simulate />}
                                />
                                <Route
                                    path="/analytics/crops"
                                    element={isRegistered ? <LookerDashboard type="cropGrowth" /> : <Navigate to="/welcome" replace />}
                                />
                                <Route
                                    path="/analytics/water"
                                    element={isRegistered ? <LookerDashboard type="waterUsage" /> : <Navigate to="/welcome" replace />}
                                />
                            </Routes>
                        </main>

                        {/* Bottom Navigation - hide on registration only */}
                        {location.pathname !== '/register' &&
                            location.pathname !== '/welcome' &&
                            location.pathname !== '/signin' &&
                            (isRegistered || location.pathname.startsWith('/preview')) &&
                            <Navigation isPreviewMode={location.pathname.startsWith('/preview')} />}
                    </div>
                </LanguageContext.Provider>
            </ThemeContext.Provider>
        </AppContext.Provider>
    );
}

// Custom hooks for using context
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppContext');
    }
    return context;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageContext');
    }
    return context;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeContext');
    }
    return context;
}

export default App;
