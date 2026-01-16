import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { getCropById, getCurrentKc, getGrowthStage } from '../data/indianCrops';
import { getSoilById } from '../data/indianSoils';
import { getPowerSchedule, formatTimeSlot } from '../data/powerSchedules';
import {
  SunIcon, CloudRainIcon, WaterIcon, ThermometerIcon, CheckCircleIcon,
  AlertTriangleIcon, PlantIcon, PowerIcon, AgentIcon, SignalIcon
} from './Icons';
import { agentDecisionLog } from '../services/agentDecisionLog';

function Dashboard() {
  const { farm, weather, powerStatus } = useApp();
  const { t } = useLanguage();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ totalWaterSaved: 0 });

  // Detect preview mode from URL
  const isPreviewMode = location.pathname.startsWith('/preview');
  const basePath = isPreviewMode ? '/preview' : '';

  React.useEffect(() => {
    async function loadStats() {
      const isDemo = farm?.isDemo || isPreviewMode;
      // Simulate loading time for agent initialization (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (isDemo && farm?.history?.resourceUsage) {
        const totalWater = farm.history.resourceUsage.reduce((sum, i) => sum + i.waterLiters, 0);
        const totalSaved = Math.round(totalWater * 0.15);
        setStats({ totalWaterSaved: totalSaved });
      } else {
        const result = await agentDecisionLog.getStats(isDemo);
        if (result) {
          setStats(result);
        }
      }
      setIsLoading(false);
    }
    loadStats();
  }, [farm, isPreviewMode]);

  const getWeatherSvg = (code) => {
    if (code === 0 || code === 1) return <SunIcon size={48} className="weather-icon-svg sun" />;
    return <CloudRainIcon size={48} className="weather-icon-svg cloud" />;
  };

  const getRecommendationIcon = (urgency, isRainExpected) => {
    if (urgency === 'critical') return <AlertTriangleIcon size={32} className="rec-icon critical" />;
    if (isRainExpected) return <CloudRainIcon size={32} className="rec-icon rain" />;
    if (urgency === 'high') return <WaterIcon size={32} className="rec-icon high" />;
    if (urgency === 'watch') return <ThermometerIcon size={32} className="rec-icon watch" />;
    return <CheckCircleIcon size={32} className="rec-icon normal" />;
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="agent-loader">
          <div className="loader-circle-outer"></div>
          <div className="loader-icon">
            <AgentIcon size={40} className="pulse-icon" />
          </div>
        </div>
        <p className="loading-text">Agent is loading the data...</p>
        <style>{`
          .dashboard-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-app);
          }
          .agent-loader {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
          }
          .loader-circle-outer {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 4px solid var(--border-glass);
            border-top-color: var(--accent-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
           @media (prefers-color-scheme: dark) {
            .loader-circle-outer {
               border: 4px solid rgba(255,255,255, 0.1);
               border-top-color: white;
            }
          }
           @media (prefers-color-scheme: light) {
            .loader-circle-outer {
               border: 4px solid rgba(0,0,0, 0.1);
               border-top-color: #666;
            }
          }
          .loader-icon {
             z-index: 1;
             color: var(--accent-primary);
          }
          .pulse-icon {
            animation: pulse 2s infinite ease-in-out;
          }
          .loading-text {
            color: var(--text-secondary);
            font-size: 1.1rem;
            animation: fadeIn 0.5s ease-out;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.9); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Get today's irrigation recommendation
  const getTodayRecommendation = () => {
    if (!weather?.summary) return { action: 'loading', color: 'watch' };

    const { rainChanceToday, todayEt0, avgSoilMoisture, isHeatwave } = weather.summary;

    if (avgSoilMoisture < 0.25) {
      return {
        action: 'critical',
        color: 'critical',
        message: t('irrigate_now'),
        detail: t('soil_dry'),
        icon: getRecommendationIcon('critical', false)
      };
    }
    if (rainChanceToday > 60) {
      return {
        action: 'wait',
        color: 'water',
        message: t('rain_expected'),
        detail: `${rainChanceToday}% ${t('rain_expected')}.`,
        icon: getRecommendationIcon('normal', true)
      };
    }
    if (avgSoilMoisture < 0.45 && todayEt0 > 3) {
      return {
        action: 'irrigate',
        color: 'safe',
        message: t('irrigate_now'),
        detail: `${t('irrigate_evening')}. ET₀: ${todayEt0.toFixed(1)}mm`,
        icon: getRecommendationIcon('high', false)
      };
    }
    if (isHeatwave) {
      return {
        action: 'watch',
        color: 'watch',
        message: t('heat_wave_alert'),
        detail: t('heat_wave_desc'),
        icon: getRecommendationIcon('watch', false)
      };
    }
    return {
      action: 'ok',
      color: 'safe',
      message: t('no_irrigation_needed'),
      detail: t('soil_moisture_adequate'),
      icon: getRecommendationIcon('normal', false)
    };
  };

  const recommendation = getTodayRecommendation();
  const powerSchedule = farm?.regionId ? getPowerSchedule(farm.regionId) : null;
  const waterSaved = stats.totalWaterSaved || 0;
  const tankerEquivalent = Math.round(waterSaved / 5000);

  const currentCropId = farm?.primary_crop || farm?.crops?.[0]?.id;
  const currentCrop = currentCropId ? { id: currentCropId, plantingDate: farm?.planting_date || farm?.crops?.[0]?.plantingDate } : null;
  const cropData = currentCrop ? getCropById(currentCrop.id) : null;
  const daysAfterPlanting = currentCrop
    ? Math.floor((new Date() - new Date(currentCrop.plantingDate)) / (1000 * 60 * 60 * 24))
    : 0;
  const growthStage = cropData ? getGrowthStage(cropData, daysAfterPlanting) : null;
  const currentKc = cropData ? getCurrentKc(cropData, daysAfterPlanting) : null;

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>
          <span className="header-icon"><PlantIcon size={24} /></span>
          {t('app_name')}
        </h1>
        <span className="tagline">{farm?.district}, {farm?.regionId}</span>
      </header>

      <div className="dashboard-content">
        <section className={`action-card ${recommendation.color}`}>
          <div className="action-header">
            <span className="action-icon">{recommendation.icon}</span>
            <div className="action-text">
              <h2>{t('today_action')}</h2>
              <p className="action-message">{recommendation.message}</p>
            </div>
          </div>
          <p className="action-detail">{recommendation.detail}</p>
          {recommendation.action === 'irrigate' && powerSchedule && (
            <div className="power-info">
              <span><PowerIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {t('power_available')}: {formatTimeSlot(powerSchedule.slots[0])}</span>
            </div>
          )}
        </section>

        {weather?.current && (
          <section className="weather-strip">
            <span className="icon">{getWeatherSvg(weather.current.weatherCode)}</span>
            <span className="temp">{Math.round(weather.current.temperature)}°</span>
            <div className="details">
              <span className="location">{farm?.district}</span>
              <span className="condition">{weather.current.weatherDescription}</span>
            </div>
            <div className="weather-metrics">
              <div className="humidity">
                <WaterIcon size={16} /> {weather.current.humidity}%
              </div>
            </div>
          </section>
        )}

        {powerStatus && (
          <section className={`power-indicator ${powerStatus.available ? 'available' : ''}`}>
            <span className="icon"><PowerIcon size={24} /></span>
            <div className="text">
              {powerStatus.available ? (
                <>
                  <span className="title">{t('power_available')}</span>
                  <span className="subtitle"> — {t('power_available_desc')}</span>
                </>
              ) : (
                <>
                  <span className="title">{t('power_next_slot')}</span>
                  <span className="subtitle">
                    - {t('power_starts_at')} {powerStatus.nextSlot?.start}
                  </span>
                </>
              )}
            </div>
          </section>
        )}

        {cropData && (
          <section className="glass-card crop-card">
            <div className="crop-header">
              <span className="crop-icon"><PlantIcon size={32} /></span>
              <div>
                <h3>{cropData.nameTranslit}</h3>
                <p>{daysAfterPlanting} {t('days')} / {cropData.totalGrowthDays} {t('days')}</p>
              </div>
            </div>
            <div className="crop-stats">
              <div className="stat">
                <span className="label">{t('growth_stage')}</span>
                <span className="value">{growthStage}</span>
              </div>
              <div className="stat">
                <span className="label">{t('crop_coeff')}</span>
                <span className="value">{currentKc?.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="label">{t('water_need')}</span>
                <span className="value">{cropData.peakWaterMmDay} {t('mm_day')}</span>
              </div>
            </div>
            <div className="growth-progress">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (daysAfterPlanting / cropData.totalGrowthDays) * 100)}%` }}
              />
            </div>
          </section>
        )}

        <section className="savings-counter">
          <span className="savings-icon"><WaterIcon size={48} /></span>
          <div className="savings-text">
            <span className="value">{waterSaved.toLocaleString()}</span>
            <span className="unit">{t('liters')}</span>
            <span className="label">
              {t('water_saved')} ({tankerEquivalent} {t('tanker_equivalent')})
            </span>
          </div>
        </section>

        <section className="quick-actions">
          <h3>{t('quick_actions')}</h3>
          <div className="action-buttons">
            <Link to={`${basePath}/chat`} className="btn btn-primary">
              <AgentIcon size={18} /> {t('nav_chat')}
            </Link>
            <Link to={`${basePath}/decisions`} className="btn btn-glass">
              <SignalIcon size={18} /> {t('nav_decisions') || 'Decisions'}
            </Link>
          </div>
        </section>

        {weather?.current?.soilMoisture && (
          <section className="glass-card soil-card">
            <h3><WaterIcon size={20} /> {t('soil_moisture')}</h3>
            <div className="moisture-bar">
              <div
                className="moisture-fill"
                style={{
                  width: `${weather.current.soilMoisture * 100}%`,
                  backgroundColor: weather.current.soilMoisture < 0.3
                    ? 'var(--danger)'
                    : weather.current.soilMoisture > 0.6
                      ? 'var(--water)'
                      : 'var(--success)'
                }}
              />
            </div>
            <div className="moisture-labels">
              <span>{t('dry')}</span>
              <span>{Math.round(weather.current.soilMoisture * 100)}%</span>
              <span>{t('wet')}</span>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .dashboard { min-height: 100vh; }
        .dashboard-content { padding: 1rem; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
        .header-icon { display: inline-flex; vertical-align: text-bottom; margin-right: 0.5rem; }
        .app-header h1 { display: flex; align-items: center; }
        .app-header .tagline { flex: 1; color: var(--text-secondary); font-size: 0.875rem; margin-left: 0.5rem; }
        .action-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
        .action-icon { display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 10px currentColor); }
        .rec-icon.critical { color: var(--accent-red); }
        .rec-icon.rain { color: var(--accent-blue); }
        .rec-icon.high { color: var(--accent-blue); }
        .rec-icon.watch { color: var(--accent-orange); }
        .rec-icon.normal { color: var(--accent-green); }
        .weather-icon-svg.sun { color: var(--accent-yellow); }
        .weather-icon-svg.cloud { color: var(--text-secondary); }
        .action-text h2 { font-size: 0.875rem; opacity: 0.9; margin: 0; font-weight: 500; }
        .action-message { font-size: 1.25rem; font-weight: 700; margin: 0; }
        .action-detail { opacity: 0.85; font-size: 0.875rem; margin: 0; }
        .power-info { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.15); font-size: 0.875rem; }
        .humidity { font-size: 0.875rem; opacity: 0.9; background: rgba(255,255,255,0.1); padding: 0.5rem 0.75rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.5rem; }
        .crop-card { padding: var(--space-4); }
        .crop-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .crop-icon { display: flex; align-items: center; justify-content: center; color: var(--accent-green); }
        .crop-header h3 { margin: 0; color: var(--text-primary); }
        .crop-header p { margin: 0; color: var(--text-secondary); font-size: 0.875rem; }
        .crop-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .stat { text-align: center; padding: 0.75rem 0.5rem; background: var(--bg-glass); border-radius: var(--radius-md); border: 1px solid var(--border-glass); }
        .stat .label { display: block; font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat .value { display: block; font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-top: 0.25rem; }
        .growth-progress { height: 8px; background: var(--bg-glass); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--border-glass); }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%); border-radius: var(--radius-full); transition: width 0.5s ease; box-shadow: 0 0 10px var(--accent-glow); }
        .quick-actions { margin-top: 0.5rem; }
        .quick-actions h3 { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem; }
        .action-buttons { display: flex; flex-direction: column; gap: 0.5rem; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .soil-card { padding: var(--space-4); }
        .soil-card h3 { margin: 0 0 0.75rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .moisture-bar { height: 24px; background: linear-gradient(90deg, rgba(239,68,68,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(59,130,246,0.3) 100%); border-radius: var(--radius-full); overflow: hidden; position: relative; border: 1px solid var(--border-glass); }
        .moisture-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; box-shadow: 0 0 15px currentColor; }
        .moisture-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}

export default Dashboard;
