import React, { useState, useEffect } from 'react';
import { useApp, useLanguage } from '../App';
import { getWeatherIcon } from '../services/weatherService';
import { generateIrrigationSchedule } from '../services/geminiService';
import { getCropById, getCurrentKc } from '../data/indianCrops';
import { getPowerSchedule } from '../data/powerSchedules';

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

    try {
      setLoading(true);

      // Get farm data
      const crop = farm.crops?.[0] ? getCropById(farm.crops[0].id) : null;
      const powerSchedule = getPowerSchedule(farm.regionId);

      // Calculate days after planting
      const daysAfterPlanting = farm.crops?.[0]?.plantingDate
        ? Math.floor((new Date() - new Date(farm.crops[0].plantingDate)) / (1000 * 60 * 60 * 24))
        : 45;

      const cropData = crop ? {
        ...crop,
        daysAfterPlanting,
        currentKc: getCurrentKc(crop, daysAfterPlanting),
        currentStage: daysAfterPlanting < 30 ? 'initial' : daysAfterPlanting < 60 ? 'development' : 'mid'
      } : null;

      const farmData = {
        ...farm,
        state: farm.regionId,
        soilType: farm.soilTypeId,
        waterSource: farm.waterSourceId,
        irrigationMethod: farm.irrigationMethodId,
        powerSchedule: powerSchedule.slots.map(s => `${s.start}-${s.end}`).join(', ')
      };

      const result = await generateIrrigationSchedule(farmData, weather, cropData);

      if (result.success && result.schedule) {
        setSchedule(result.schedule);

        // Calculate savings
        const avoided = result.schedule.filter(d => d.rainAvoided).length;
        setRainAvoided(avoided);

        // Estimate water saved (simplified calculation)
        const irrigationDays = result.schedule.filter(d => d.action === 'NO_IRRIGATION').length;
        const savedLiters = irrigationDays * 5000 * (farm.areaHectares || 1);
        setWaterSaved(savedLiters);
      }
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      // Generate demo schedule
      generateDemoSchedule();
    } finally {
      setLoading(false);
    }
  }

  function generateDemoSchedule() {
    const today = new Date();
    const demo = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayWeather = weather?.daily?.[i] || {};
      const willRain = dayWeather.precipitationProbability > 60;

      demo.push({
        date: date.toISOString().split('T')[0],
        action: willRain ? 'NO_IRRIGATION' : (i % 2 === 0 ? 'IRRIGATE' : 'MONITOR'),
        time: '18:00',
        duration_mins: 30,
        volume_liters: 5000,
        reasoning: willRain
          ? t('reason_rain')
          : t('reason_scheduled'),
        rainAvoided: willRain,
        weather: dayWeather
      });
    }

    setSchedule(demo);
    setRainAvoided(demo.filter(d => d.rainAvoided).length);
    setWaterSaved(demo.filter(d => d.action === 'NO_IRRIGATION').length * 5000);
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
    if (rainAvoided) return '🌧️';
    switch (action) {
      case 'IRRIGATE': return '💧';
      case 'NO_IRRIGATION': return '⏸️';
      case 'MONITOR': return '👁️';
      default: return '📅';
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

  return (
    <div className="schedule-page">
      {/* Header */}
      <header className="schedule-header">
        <h1>📅 {t('schedule_title')}</h1>
        <p>{t('schedule_desc')}</p>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card water">
          <span className="icon">💧</span>
          <div>
            <span className="value">{waterSaved.toLocaleString()}</span>
            <span className="label">{t('water_saved')} {t('liters')}</span>
          </div>
        </div>
        <div className="summary-card rain">
          <span className="icon">🌧️</span>
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
                <span className="label">⏰ {t('time')}</span>
                <span className="value">{schedule[selectedDay].time}</span>
              </div>
              <div className="detail-row">
                <span className="label">⏱️ {t('duration')}</span>
                <span className="value">{schedule[selectedDay].duration_mins} min</span>
              </div>
              <div className="detail-row">
                <span className="label">💧 {t('water_amount')}</span>
                <span className="value">{schedule[selectedDay].volume_liters?.toLocaleString()} L</span>
              </div>
            </div>
          )}

          <p className="reasoning">
            💡 {schedule[selectedDay].reasoning}
          </p>

          {/* Weather for the day */}
          {weather?.daily?.[selectedDay] && (
            <div className="day-weather">
              <span>
                {getWeatherIcon(weather.daily[selectedDay].weatherCode)}
                {Math.round(weather.daily[selectedDay].tempMax)}° / {Math.round(weather.daily[selectedDay].tempMin)}°
              </span>
              {weather.daily[selectedDay].precipitationSum > 0 && (
                <span>🌧️ {weather.daily[selectedDay].precipitationSum}mm</span>
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
        <h3>🔌 {t('iot_output')}</h3>
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
