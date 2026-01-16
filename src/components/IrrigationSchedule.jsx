import React, { useState, useEffect } from 'react';
import { useApp, useLanguage } from '../App';
import { getWeatherIcon } from '../services/weatherService';
import { generateIrrigationSchedule } from '../services/agentChatService';
import { getCropById, getCurrentKc } from '../data/indianCrops';
import { getPowerSchedule } from '../data/powerSchedules';
import {
  WaterIcon,
  CloudRainIcon,
  CalendarIcon,
  EyeIcon,
  PauseIcon,
  ClockIcon,
  CheckIcon,
  AlertCircleIcon,
  LightningIcon,
  DropletsIcon
} from './Icons';

function IrrigationSchedule() {
  const { farm, weather } = useApp();
  const { t } = useLanguage();

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [waterSaved, setWaterSaved] = useState(0);
  const [rainAvoided, setRainAvoided] = useState(0);

  useEffect(() => {
    generateSchedule();
  }, [farm, weather]);

  async function generateSchedule() {
    if (!farm || !weather) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Use deterministic calculation (Math-based) to save API credits
    // This mirrors the Background Agent's logic
    calculateDeterministicSchedule();

    setLoading(false);
  }

  function calculateDeterministicSchedule() {
    const today = new Date();
    const calculatedSchedule = [];

    // STRICT: No fallback to "Wheat". If no crop, we cannot generate schedule.
    // Use farm.primary_crop (text id) or farm.crops?.[0]?.id (from db relation if joined)
    const cropId = farm?.primary_crop || farm?.crops?.[0]?.id;

    if (!cropId) {
      console.warn('No crop data found for schedule generation');
      setSchedule([]); // Or empty state
      setLoading(false);
      return;
    }

    const activeCrop = getCropById(cropId) || { name: 'Unknown Crop', id: cropId };
    const powerSchedule = farm?.powerSchedule || 'morning_slot';

    // Determine timing based on power schedule
    let defaultTime = '06:00';
    if (powerSchedule === 'evening_slot') defaultTime = '16:00';
    if (powerSchedule === 'night_slot') defaultTime = '23:00';

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayWeather = weather?.daily?.[i] || {};

      // --- Deterministic Logic (FAO-56 Simplified) ---

      // 1. Rain Check
      const willRain = dayWeather.precipitationProbability > 60 || dayWeather.precipitationSum > 5;

      // 2. Crop Water Need (ETc)
      const et0 = dayWeather.et0 || 5.0;
      // Estimate Kc based on simple timeline (0.4 initial -> 1.15 mid -> 0.7 end)
      // Simplified for this view without full growth engine
      const kc = 1.0;
      const etc = et0 * kc;

      // 3. Scheduling Rule
      // Wheat: Irrigatate when depletion > 50%
      // Simplified: Wheat every 4 days, Paddy every 2 days
      const isRice = activeCrop.id?.includes('rice') || activeCrop.name?.toLowerCase().includes('paddy');
      const interval = isRice ? 2 : 4;

      // Check if today matches interval (pseudo-logic starting from today)
      // In a real app, we'd check "last irrigation date"
      const isIrrigationDay = (i % interval === 0);

      const shouldIrrigate = !willRain && isIrrigationDay;

      // 4. Volume Calculation (Liters)
      // 1mm = 10,000 L/ha. Apply 30mm for Wheat, 50mm for Rice per session
      const depthMm = isRice ? 50 : 30;
      const volumeLiters = depthMm * 10000 * (farm?.areaHectares || 1);
      const durationMins = Math.round(volumeLiters / 600); // 10 L/s flow

      calculatedSchedule.push({
        date: date.toISOString().split('T')[0],
        action: willRain ? 'NO_IRRIGATION' : (shouldIrrigate ? 'IRRIGATE' : 'MONITOR'),
        time: defaultTime,
        duration_mins: durationMins,
        volume_liters: volumeLiters,
        reasoning: willRain
          ? t('reason_rain') // "Rain expected, skipping"
          : shouldIrrigate
            ? `${t('action_irrigate')} - ${activeCrop.name} ${t('needs_water')}`
            : t('soil_moisture_adequate'),
        rainAvoided: willRain,
        weather: dayWeather
      });
    }

    setSchedule(calculatedSchedule);
    setRainAvoided(calculatedSchedule.filter(d => d.rainAvoided).length);
    setWaterSaved(calculatedSchedule.filter(d => d.action === 'NO_IRRIGATION').length * 5000);
  }

  function getActionColor(action) {
    switch (action) {
      case 'IRRIGATE': return 'safe';
      case 'NO_IRRIGATION': return 'water';
      case 'MONITOR': return 'watch';
      default: return '';
    }
  }

  function getActionIcon(action, rainAvoided) {
    if (rainAvoided) return <CloudRainIcon />;
    switch (action) {
      case 'IRRIGATE': return <DropletsIcon />;
      case 'NO_IRRIGATION': return <PauseIcon />;
      case 'MONITOR': return <EyeIcon />;
      default: return <CalendarIcon />;
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return t('today');
    if (date.toDateString() === tomorrow.toDateString()) return t('tomorrow');

    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  }

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const getDayNum = (dateStr) => {
    return new Date(dateStr).getDate();
  };

  if (loading) {
    return (
      <div className="schedule-loading">
        <div className="loading-spinner"></div>
        <p>{t('generating_schedule')}</p>
        <style>{`
          .schedule-loading {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--color-border);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Empty State if no schedule (e.g. no crop data)
  if (!schedule || schedule.length === 0) {
    return (
      <div className="schedule-page">
        <header className="schedule-header">
          <h1>{t('schedule_title')}</h1>
          <p>{t('schedule_desc')}</p>
        </header>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <AlertCircleIcon size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3>{t('no_crop_data') || 'No Crop Data Found'}</h3>
          <p>{t('add_crop_setup') || 'Please complete farm setup to view irrigation schedule.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      {/* Header */}
      <header className="schedule-header">
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <CalendarIcon style={{ color: 'var(--accent-primary)' }} /> {t('schedule_title')}
        </h1>
        <p>{t('schedule_desc')}</p>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card water">
          <span className="icon"><WaterIcon /></span>
          <div>
            <span className="value">{waterSaved.toLocaleString()}</span>
            <span className="label">{t('water_saved')} {t('liters')}</span>
          </div>
        </div>
        <div className="summary-card rain">
          <span className="icon"><CloudRainIcon /></span>
          <div>
            <span className="value">{rainAvoided}</span>
            <span className="label">{t('rain_events_avoided')}</span>
          </div>
        </div>
      </div>

      {/* Week View */}
      <section className="schedule-week">
        {schedule.map((day, index) => {
          const isToday = index === 0;
          const weatherDay = weather?.daily?.[index];

          return (
            <div
              key={day.date}
              className={`schedule-day ${getActionColor(day.action)} ${isToday ? 'today' : ''} ${selectedDay === index ? 'selected' : ''}`}
              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
            >
              <span className="day-name">{getDayName(day.date)}</span>
              <span className="day-num">{getDayNum(day.date)}</span>
              <span className="icon">{getActionIcon(day.action, day.rainAvoided)}</span>
              {weatherDay && (
                <span className="weather-icon">
                  {getWeatherIcon(weatherDay.weatherCode)}
                </span>
              )}
            </div>
          );
        })}
      </section>

      {/* Selected Day Details */}
      {selectedDay !== null && schedule[selectedDay] && (
        <section className="day-details card">
          <h3>
            {formatDate(schedule[selectedDay].date)} {t('details_for')}
          </h3>

          <div className={`action-badge ${getActionColor(schedule[selectedDay].action)}`}>
            {getActionIcon(schedule[selectedDay].action, schedule[selectedDay].rainAvoided)}
            {schedule[selectedDay].action === 'IRRIGATE' ? t('action_irrigate') :
              schedule[selectedDay].action === 'NO_IRRIGATION' ? t('action_no_irrigate') :
                t('action_monitor')}
          </div>

          {schedule[selectedDay].action === 'IRRIGATE' && (
            <div className="irrigation-details">
              <div className="detail-row">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={16} /> {t('time')}
                </span>
                <span className="value">{schedule[selectedDay].time}</span>
              </div>
              <div className="detail-row">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={16} /> {t('duration')}
                </span>
                <span className="value">{schedule[selectedDay].duration_mins} min</span>
              </div>
              <div className="detail-row">
                <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <WaterIcon size={16} /> {t('water_amount')}
                </span>
                <span className="value">{schedule[selectedDay].volume_liters?.toLocaleString()} L</span>
              </div>
            </div>
          )}

          <p className="reasoning" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <AlertCircleIcon size={16} style={{ marginTop: '3px', flexShrink: 0 }} /> {schedule[selectedDay].reasoning}
          </p>

          {/* Weather for the day */}
          {weather?.daily?.[selectedDay] && (
            <div className="day-weather">
              <span>
                {getWeatherIcon(weather.daily[selectedDay].weatherCode)}
                {Math.round(weather.daily[selectedDay].tempMax)}° / {Math.round(weather.daily[selectedDay].tempMin)}°
              </span>
              {weather.daily[selectedDay].precipitationSum > 0 && (
                <span><CloudRainIcon size={14} /> {weather.daily[selectedDay].precipitationSum}mm</span>
              )}
              <span>ET₀: {weather.daily[selectedDay].et0?.toFixed(1)}mm</span>
            </div>
          )}
        </section>
      )}

      {/* Schedule List View */}
      <section className="schedule-list">
        <h3>{t('full_schedule')}</h3>
        {schedule.map((day, index) => (
          <div
            key={day.date}
            className={`schedule-item ${getActionColor(day.action)}`}
          >
            <div className="item-date">
              <span className="date-day">{getDayName(day.date)}</span>
              <span className="date-num">{getDayNum(day.date)}</span>
            </div>
            <div className="item-content">
              <div className="item-action">
                {getActionIcon(day.action, day.rainAvoided)}
                <span>
                  {day.action === 'IRRIGATE'
                    ? `${day.time} - ${day.volume_liters?.toLocaleString()}L`
                    : day.action === 'NO_IRRIGATION'
                      ? (day.rainAvoided ? t('skip_rain') : t('skip_moisture'))
                      : t('action_monitor')}
                </span>
              </div>
            </div>
            {weather?.daily?.[index] && (
              <div className="item-weather">
                {getWeatherIcon(weather.daily[index].weatherCode)}
                {Math.round(weather.daily[index].tempMax)}°
              </div>
            )}
          </div>
        ))}
      </section>

      {/* JSON Output for IoT */}
      <section className="iot-output card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LightningIcon style={{ color: 'var(--warning)' }} /> {t('iot_output')}
        </h3>
        <p className="iot-description">
          {t('iot_desc')}
        </p>
        <pre className="json-output">
          {JSON.stringify({
            action: schedule[0]?.action,
            volume_liters: schedule[0]?.volume_liters,
            duration_mins: schedule[0]?.duration_mins,
            scheduled_time: schedule[0]?.time,
            reasoning: schedule[0]?.reasoning
          }, null, 2)}
        </pre>
      </section>

      <style>{`
        .schedule-page {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .schedule-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .schedule-header h1 {
          margin: 0 0 0.25rem;
          color: var(--text-primary);
        }
        
        .schedule-header p {
          color: var(--text-secondary);
          margin: 0;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .summary-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
        }
        
        .summary-card.water {
          border-left: 4px solid var(--water);
          box-shadow: 0 0 20px var(--water-glow);
        }
        
        .summary-card.rain {
          border-left: 4px solid var(--success);
          box-shadow: 0 0 20px var(--success-glow);
        }
        
        .summary-card .icon {
          font-size: 1.5rem;
        }
        
        .summary-card .value {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .summary-card .label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .schedule-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .schedule-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 0.5rem;
          border-radius: var(--radius-lg);
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
        }
        
        .schedule-day:hover {
          transform: translateY(-2px);
          background: var(--bg-glass-hover);
        }
        
        .schedule-day.today {
          border-color: var(--accent-primary);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .schedule-day.selected {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px var(--shadow-color);
        }
        
        .schedule-day.safe {
          border-color: var(--success);
          box-shadow: 0 0 15px var(--success-glow);
        }
        
        .schedule-day.water {
          border-color: var(--water);
          box-shadow: 0 0 15px var(--water-glow);
        }
        
        .schedule-day.watch {
          border-color: var(--warning);
          box-shadow: 0 0 15px var(--warning-glow);
        }
        
        .schedule-day .day-name {
          font-size: 0.625rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .schedule-day .day-num {
          font-size: 1.125rem;
          font-weight: 700;
        }
        
        .schedule-day .icon {
          font-size: 1.25rem;
          margin-top: 0.25rem;
        }
        
        .schedule-day .weather-icon {
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .day-details {
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease;
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .day-details h3 {
          margin: 0 0 1rem;
          color: var(--text-primary);
        }
        
        .action-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .action-badge.safe {
          background: var(--success);
          color: white;
        }
        
        .action-badge.water {
          background: var(--water);
          color: white;
        }
        
        .action-badge.watch {
          background: var(--warning);
          color: white;
        }
        
        .irrigation-details {
          margin-bottom: 1rem;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-glass);
        }
        
        .detail-row .label {
          color: var(--text-secondary);
        }
        
        .detail-row .value {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .reasoning {
          padding: 0.75rem;
          background: var(--bg-glass-strong);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          margin: 0 0 1rem;
          color: var(--text-primary);
        }
        
        .day-weather {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .schedule-list {
          margin-bottom: 1.5rem;
        }
        
        .schedule-list h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
        
        .schedule-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        
        .schedule-item.safe {
          border-left: 4px solid var(--success);
        }
        
        .schedule-item.water {
          border-left: 4px solid var(--water);
        }
        
        .schedule-item.watch {
          border-left: 4px solid var(--warning);
        }
        
        .item-date {
          text-align: center;
          min-width: 40px;
        }
        
        .item-date .date-day {
          display: block;
          font-size: 0.625rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        
        .item-date .date-num {
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .item-content {
          flex: 1;
        }
        
        .item-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .item-weather {
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .iot-output {
          background: var(--bg-glass-strong);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          padding: 1rem;
          color: var(--text-primary);
        }
        
        .iot-output h3 {
          color: var(--success);
        }
        
        .iot-description {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 1rem;
        }
        
        .json-output {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: var(--radius-md);
          overflow-x: auto;
          font-size: 0.8125rem;
          font-family: 'Courier New', monospace;
          color: var(--accent-primary);
        }
        
        .card {
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}

export default IrrigationSchedule;
