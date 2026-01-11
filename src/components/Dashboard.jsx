import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { getCropById, getCurrentKc, getGrowthStage } from '../data/indianCrops';
import { getSoilById } from '../data/indianSoils';
import { getPowerSchedule, formatTimeSlot } from '../data/powerSchedules';
import {
  SunIcon, CloudRainIcon, WaterIcon, ThermometerIcon, CheckCircleIcon,
  AlertTriangleIcon, PlantIcon, PowerIcon, AgentIcon, SignalIcon, InfoIcon
} from './Icons';

function Dashboard() {
  const { farm, weather, powerStatus, isOffline } = useApp();
  const { t, language } = useLanguage();
  const location = useLocation();

  // Detect preview mode from URL
  const isPreviewMode = location.pathname.startsWith('/preview');
  const basePath = isPreviewMode ? '/preview' : '';

  const getWeatherSvg = (code) => {
    if (code === 0 || code === 1) return <SunIcon size={48} className="weather-icon-svg sun" />;
    // For partial clouds (2,3) or fog, use CloudRain (generic cloud) or similar. 
    // Since we only have CloudRainIcon, we'll use it for all non-clear weather for now.
    return <CloudRainIcon size={48} className="weather-icon-svg cloud" />;
  };

  const getRecommendationIcon = (urgency, isRainExpected) => {
    if (urgency === 'critical') return <AlertTriangleIcon size={32} className="rec-icon critical" />;
    if (isRainExpected) return <CloudRainIcon size={32} className="rec-icon rain" />;
    if (urgency === 'high') return <WaterIcon size={32} className="rec-icon high" />;
    if (urgency === 'watch') return <ThermometerIcon size={32} className="rec-icon watch" />;
    return <CheckCircleIcon size={32} className="rec-icon normal" />;
  };

  // Get today's irrigation recommendation
  const getTodayRecommendation = () => {
    if (!weather?.summary) {
      return { action: 'loading', color: 'watch' };
    }

    const { rainChanceToday, todayEt0, avgSoilMoisture, isHeatwave } = weather.summary;

    // Critical condition - soil very dry
    if (avgSoilMoisture < 0.25) {
      return {
        action: 'critical',
        color: 'critical',
        message: t('irrigate_now'),
        detail: t('soil_dry'),
        icon: getRecommendationIcon('critical', false)
      };
    }

    // Rain expected - wait
    if (rainChanceToday > 60) {
      return {
        action: 'wait',
        color: 'water',
        message: t('rain_expected'),
        detail: `${rainChanceToday}% ${t('rain_expected')}.`,
        icon: getRecommendationIcon('normal', true)
      };
    }

    // Normal irrigation needed
    if (avgSoilMoisture < 0.45 && todayEt0 > 3) {
      return {
        action: 'irrigate',
        color: 'safe',
        message: t('irrigate_now'),
        detail: `${t('irrigate_evening')}. ET₀: ${todayEt0.toFixed(1)}mm`,
        icon: getRecommendationIcon('high', false)
      };
    }

    // Heatwave warning
    if (isHeatwave) {
      return {
        action: 'watch',
        color: 'watch',
        message: t('heat_wave_alert'),
        detail: t('heat_wave_desc'),
        icon: getRecommendationIcon('watch', false)
      };
    }

    // No irrigation needed
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

  // Calculate water saved (demo calculation)
  const waterSaved = 45000; // liters
  const tankerEquivalent = Math.round(waterSaved / 5000); // 5000L per tanker

  // Get current crop info
  const currentCrop = farm?.crops?.[0];
  const cropData = currentCrop ? getCropById(currentCrop.id) : null;
  const daysAfterPlanting = currentCrop
    ? Math.floor((new Date() - new Date(currentCrop.plantingDate)) / (1000 * 60 * 60 * 24))
    : 0;
  const growthStage = cropData ? getGrowthStage(cropData, daysAfterPlanting) : null;
  const currentKc = cropData ? getCurrentKc(cropData, daysAfterPlanting) : null;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="app-header">
        <h1>
          <span className="header-icon"><PlantIcon size={24} /></span>
          {t('app_name')}
        </h1>
        <span className="tagline">{farm?.district}, {farm?.regionId}</span>
      </header>

      <div className="dashboard-content">
        {/* Today's Action Card */}
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

        {/* Weather Widget */}
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
              {/* Wind logic not in original but adding for spacing */}
            </div>
          </section>
        )}

        {/* Power Schedule Card */}
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

        {/* Current Crop Card */}
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
            {/* Growth Progress Bar */}
            <div className="growth-progress">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (daysAfterPlanting / cropData.totalGrowthDays) * 100)}%` }}
              />
            </div>
          </section>
        )}

        {/* Water Savings Card */}
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

        {/* Quick Actions */}
        <section className="quick-actions">
          <h3>{t('quick_actions')}</h3>
          <div className="action-buttons">
            <Link to={`${basePath}/chat`} className="btn btn-primary">
              <AgentIcon size={18} /> {t('nav_chat')}
            </Link>
            <Link to={`${basePath}/simulate`} className="btn btn-glass">
              <SignalIcon size={18} /> {t('nav_simulate')}
            </Link>
          </div>
        </section>

        {/* Soil Moisture (if available) */}
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
        .dashboard {
          min-height: 100vh;
        }
        
        .dashboard-content {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .header-icon {
            display: inline-flex;
            vertical-align: text-bottom;
            margin-right: 0.5rem;
        }
        
        .app-header h1 {
            display: flex;
            align-items: center;
        }
        
        .app-header .tagline {
          flex: 1;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-left: 0.5rem;
        }
        
        .action-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 10px currentColor);
        }

        /* SVG Icon Specific Colors for Actions */
        .rec-icon.critical { color: var(--accent-red); }
        .rec-icon.rain { color: var(--accent-blue); }
        .rec-icon.high { color: var(--accent-blue); } /* or yellow? default high needs water */
        .rec-icon.watch { color: var(--accent-orange); }
        .rec-icon.normal { color: var(--accent-green); }

        .weather-icon-svg.sun { color: var(--accent-yellow); }
        .weather-icon-svg.cloud { color: var(--text-secondary); }
        
        .action-text h2 {
          font-size: 0.875rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 500;
        }
        
        .action-message {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        
        .action-detail {
          opacity: 0.85;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .power-info {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.15);
          font-size: 0.875rem;
        }
        
        .humidity {
          font-size: 0.875rem;
          opacity: 0.9;
          background: rgba(255,255,255,0.1);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .crop-card {
          padding: var(--space-4);
        }
        
        .crop-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .crop-icon {
        /*
          font-size: 2.5rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        */
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--accent-green);
        }
        
        .crop-header h3 {
          margin: 0;
          color: var(--text-primary);
        }
        
        .crop-header p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .crop-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .stat {
          text-align: center;
          padding: 0.75rem 0.5rem;
          background: var(--bg-glass);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-glass);
        }
        
        .stat .label {
          display: block;
          font-size: 0.625rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat .value {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
          margin-top: 0.25rem;
        }
        
        .growth-progress {
          height: 8px;
          background: var(--bg-glass);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid var(--border-glass);
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
          box-shadow: 0 0 10px var(--accent-glow);
        }
        
        .quick-actions {
          margin-top: 0.5rem;
        }
        
        .quick-actions h3 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .soil-card {
          padding: var(--space-4);
        }
        
        .soil-card h3 {
          margin: 0 0 0.75rem 0;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .moisture-bar {
          height: 24px;
          background: linear-gradient(90deg, 
            rgba(239,68,68,0.3) 0%, 
            rgba(34,197,94,0.3) 50%, 
            rgba(59,130,246,0.3) 100%
          );
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
          border: 1px solid var(--border-glass);
        }
        
        .moisture-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
          box-shadow: 0 0 15px currentColor;
        }
        
        .moisture-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
