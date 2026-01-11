import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

// Components
import Dashboard from './components/Dashboard';
import FarmSetup from './components/FarmSetup';
import IrrigationSchedule from './components/IrrigationSchedule';
import WhatsAppChat from './components/WhatsAppChat';
import WeeklyReport from './components/WeeklyReport';
import { ProjectLogo } from './components/Icons';
import Navigation from './components/Navigation';
import OfflineIndicator from './components/OfflineIndicator';
import Settings from './components/Settings';
import FarmerRegistration from './components/FarmerRegistration';
import SignalHistory from './components/SignalHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AnalyticsPage from './components/AnalyticsPage';
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
    longitude: 80.9462,
    isDemo: true
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
            const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));

            // Wait for splash screen regardless of preview
            (async () => {
                await minLoadTime;
                setFarm(MOCK_FARM_PREVIEW);
                setIsRegistered(true);
                setLoading(false);
            })();

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
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Check if farmer is registered in agent memory
            let foundFarm = null;

            if (agentMemory.hasFarmer()) {
                const context = agentMemory.getContext();
                foundFarm = context.farm;
            } else {
                // Try to get cached farm data (legacy)
                const cachedFarm = getCachedFarm();
                if (cachedFarm?.data) {
                    foundFarm = cachedFarm.data;
                }
            }

            // Important: If data is demo/preview, treat as NOT registered for persistent session
            if (foundFarm && !foundFarm.isDemo) {
                setFarm(foundFarm);
                setIsRegistered(true);
            } else {
                setIsRegistered(false);
                // Optionally clear invalid demo data from storage if needed, but ignoring it is safer
                if (foundFarm?.isDemo) {
                    console.log('Clearing leftover demo data from session');
                    setFarm(null);
                }
            }
        } catch (error) {
            console.error('Failed to initialize:', error);
            setIsRegistered(false);
        } finally {
            await minLoadTime; // Wait for minimum 2s
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
        // Only persist if NOT demo data
        if (!updatedFarm?.isDemo) {
            cacheFarm(updatedFarm);
            agentMemory.updateFarm(updatedFarm);
        }
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
                    <div className="loading-icon-wrapper">
                        <ProjectLogo size={64} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <h1>BloomWise</h1>
                    <p>{t('loading')}</p>
                    <div className="loading-spinner"></div>
                </div>
                <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-gradient);
            color: var(--text-primary);
          }
          .loading-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .loading-icon-wrapper {
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
            color: var(--accent-primary);
          }
          .loading-content h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: var(--accent-primary);
            border-radius: 50%;
            margin: 1rem auto;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
            40% {transform: translateY(-10px);}
            60% {transform: translateY(-5px);}
          }
        `}</style>
            </div >
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
                        <main className="app-main" style={{ paddingBottom: (location.pathname === '/chat' || location.pathname === '/preview/chat' || location.pathname.includes('/analytics')) ? '0' : '80px' }}>
                            <Routes>
                                {/* Registration route - shown if not registered */}
                                <Route
                                    path="/register"
                                    element={<FarmerRegistration onComplete={handleRegistrationComplete} />}
                                />

                                {/* Public Welcome Page - ALWAYS Welcome unless logged in */}
                                <Route
                                    path="/"
                                    element={<LandingPage />}
                                />

                                {/* User Routes - Authenticated */}
                                <Route
                                    path="/home"
                                    element={isRegistered ? <Dashboard /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/welcome"
                                    element={<LandingPage />}
                                />
                                <Route
                                    path="/signin"
                                    element={isRegistered ? <Navigate to="/home" replace /> : <SignIn />}
                                />

                                {/* Preview Routes - Explicit Paths */}
                                <Route
                                    path="/preview"
                                    element={<Navigate to="/preview/home" replace />}
                                />
                                <Route
                                    path="/preview/home"
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
                                    path="/preview/analytics"
                                    element={<AnalyticsPage />}
                                />
                                <Route
                                    path="/preview/analytics/water"
                                    element={<AnalyticsDashboard type="waterUsage" />}
                                />
                                <Route
                                    path="/preview/analytics/crop"
                                    element={<AnalyticsDashboard type="cropGrowth" />}
                                />
                                <Route
                                    path="/preview/analytics/agent"
                                    element={<AnalyticsDashboard type="agentDecisions" />}
                                />

                                {/* Legacy /preview/simulate and others if needed, but sticking to requested list */}
                                <Route
                                    path="/preview/simulate"
                                    element={<Simulate />}
                                />

                                {/* User Feature Routes */}
                                <Route
                                    path="/schedule"
                                    element={isRegistered ? <IrrigationSchedule /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/chat"
                                    element={isRegistered ? <WhatsAppChat /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/farm"
                                    element={isRegistered ? <FarmSetup /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/report"
                                    element={isRegistered ? <WeeklyReport /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/settings"
                                    element={isRegistered ? <Settings /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/signals"
                                    element={isRegistered ? <SignalHistory /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/simulate"
                                    element={isRegistered ? <Simulate /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/analytics"
                                    element={isRegistered ? <AnalyticsPage /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/analytics/water"
                                    element={isRegistered ? <AnalyticsDashboard type="waterUsage" /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/analytics/crop"
                                    element={isRegistered ? <AnalyticsDashboard type="cropGrowth" /> : <Navigate to="/" replace />}
                                />
                                <Route
                                    path="/analytics/agent"
                                    element={isRegistered ? <AnalyticsDashboard type="agentDecisions" /> : <Navigate to="/" replace />}
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
