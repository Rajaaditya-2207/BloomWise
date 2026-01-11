import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { WaterIcon, ChartIcon, PlantIcon, CloudRainIcon, ArrowLeftIcon, MoneyIcon, DatabaseIcon } from './Icons';

/**
 * Weekly Water Report
 * Shows water used vs saved compared to fixed schedule
 */
function WeeklyReport() {
  const { farm, weather } = useApp();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [exportFormat, setExportFormat] = useState(null);

  // Calculate water usage data with realistic variation
  const calculateWaterData = () => {
    const areaHectares = farm?.areaHectares || farm?.land_size_ha || 2;
    const baseWaterPerHa = 5000; // liters per hectare per day (baseline)

    // Predefined scenarios - ALWAYS use these reduction values for visible variation
    const dayPatterns = [
      { rainProb: 75, reduction: 1.0, reason: 'heavy_rain' },   // Day 1 - Heavy rain, skip completely
      { rainProb: 10, reduction: 0, reason: 'clear' },           // Day 2 - Clear, full irrigation
      { rainProb: 45, reduction: 0.5, reason: 'light_rain' },    // Day 3 - Light rain, 50% reduced
      { rainProb: 5, reduction: 0, reason: 'hot_day' },          // Day 4 - Hot dry, full irrigation
      { rainProb: 85, reduction: 1.0, reason: 'monsoon' },       // Day 5 - Monsoon, skip completely
      { rainProb: 30, reduction: 0.3, reason: 'cloudy' },        // Day 6 - Cloudy, 30% reduced
      { rainProb: 8, reduction: 0, reason: 'clear' },            // Day 7 - Clear, full irrigation
    ];

    // Generate 7 days of data
    const days = [];
    let totalUsed = 0;
    let totalSaved = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayIndex = 6 - i;

      const pattern = dayPatterns[dayIndex];

      // Add some randomness to base water (±15%)
      const randomFactor = 0.85 + Math.random() * 0.3;
      const dayBaseWater = baseWaterPerHa * areaHectares * randomFactor;

      // Fixed schedule would use full water
      const fixedScheduleWater = Math.round(dayBaseWater);

      // Smart schedule uses the predefined reduction directly
      let smartScheduleWater = Math.round(fixedScheduleWater * (1 - pattern.reduction));
      let skippedReason = null;

      // Set reason based on reduction level
      if (pattern.reduction >= 1.0) {
        smartScheduleWater = 0;
        skippedReason = language === 'hi' ? '🌧️ बारिश' : '🌧️ Rain';
      } else if (pattern.reduction >= 0.5) {
        skippedReason = language === 'hi' ? '50% कम' : '50% reduced';
      } else if (pattern.reduction >= 0.3) {
        skippedReason = language === 'hi' ? '30% कम' : '30% reduced';
      }

      const saved = fixedScheduleWater - smartScheduleWater;
      totalUsed += smartScheduleWater;
      totalSaved += saved;

      days.push({
        date: date,
        dayName: date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' }),
        dateStr: date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }),
        fixedWater: fixedScheduleWater,
        smartWater: smartScheduleWater,
        saved: saved,
        skippedReason,
        rainProbability: pattern.rainProb
      });
    }

    const totalFixed = days.reduce((sum, d) => sum + d.fixedWater, 0);

    return {
      days,
      totalUsed,
      totalSaved,
      totalFixed,
      percentSaved: totalFixed > 0 ? Math.round((totalSaved / totalFixed) * 100) : 0
    };
  };

  const waterData = calculateWaterData();

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Date', 'Day', 'Fixed Schedule (L)', 'Smart Schedule (L)', 'Saved (L)', 'Reason'];
    const rows = waterData.days.map(d => [
      d.dateStr,
      d.dayName,
      d.fixedWater,
      d.smartWater,
      d.saved,
      d.skippedReason || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setExportFormat('csv');
    setTimeout(() => setExportFormat(null), 2000);
  };

  // Export to JSON
  const exportJSON = () => {
    const data = {
      farmName: farm?.name || 'My Farm',
      farmArea: farm?.areaHectares || 2,
      reportDate: new Date().toISOString(),
      summary: {
        totalWaterUsed: waterData.totalUsed,
        totalWaterSaved: waterData.totalSaved,
        percentSaved: waterData.percentSaved
      },
      dailyData: waterData.days.map(d => ({
        date: d.date.toISOString().split('T')[0],
        fixedScheduleLiters: d.fixedWater,
        smartScheduleLiters: d.smartWater,
        savedLiters: d.saved,
        skippedReason: d.skippedReason
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExportFormat('json');
    setTimeout(() => setExportFormat(null), 2000);
    setExportFormat('json');
    setTimeout(() => setExportFormat(null), 2000);
  };

  // Estimate money saved (mock calculation: ₹0.05 per liter pumping cost)
  const moneySaved = Math.round(waterData.totalSaved * 0.05);

  const maxWater = Math.max(...waterData.days.map(d => d.fixedWater));

  return (
    <div className="weekly-report">
      {/* Header */}
      <header className="report-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeftIcon size={24} />
        </button>
        <h1><ChartIcon size={28} style={{ marginRight: '0.5rem' }} /> {t('weekly_report')}</h1>
        <p className="header-subtitle">{t('report_desc')}</p>
      </header>

      {/* Summary Cards */}
      <section className="summary-section">
        <div className="summary-grid">
          <div className="summary-card glass-card active-card">
            <div className="summary-icon"><WaterIcon size={32} /></div>
            <div className="summary-content">
              <span className="summary-value">{(waterData.totalSaved / 1000).toFixed(1)}k</span>
              <span className="summary-label">{t('liters_saved')}</span>
            </div>
          </div>

          <div className="summary-card glass-card percent-saved">
            <div className="summary-icon"><ChartIcon size={32} /></div>
            <div className="summary-content">
              <span className="summary-value">{waterData.percentSaved}%</span>
              <span className="summary-label">{t('water_saved')}</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-icon"><PlantIcon size={32} /></div>
            <div className="summary-content">
              <span className="summary-value">{(waterData.totalUsed / 1000).toFixed(1)}k</span>
              <span className="summary-label">{t('liters_used')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Comparison */}
      <section className="chart-section glass-card">
        <h3>{t('daily_comparison')}</h3>
        <div className="chart-container">
          {/* Simple Bar Chart Visualization */}
          <div className="bar-chart">
            {waterData.days.map((day, index) => {
              // Determine savings class for coloring
              const savingsPercent = day.fixedWater > 0 ? (day.saved / day.fixedWater) * 100 : 0;
              let savingsClass = '';
              if (savingsPercent >= 50) savingsClass = ''; // Green (default)
              else if (savingsPercent >= 20) savingsClass = 'moderate'; // Orange
              else if (savingsPercent <= 0) savingsClass = 'no-saving'; // Red

              return (
                <div key={index} className="bar-group">
                  <div className="bars">
                    <div
                      className="bar fixed-bar"
                      style={{ height: `${(day.fixedWater / maxWater) * 100}%` }}
                      title={`${t('fixed')}: ${day.fixedWater}L`}
                    />
                    <div
                      className={`bar smart-bar ${savingsClass}`}
                      style={{ height: `${(day.smartWater / maxWater) * 100}%` }}
                      title={`${t('smart')}: ${day.smartWater}L`}
                    />
                  </div>
                  <span className="bar-label">{day.dayName}</span>
                  {day.skippedReason && (
                    <span className="rain-badge"><CloudRainIcon size={12} /></span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <div className="legend-item"><span className="dot fixed"></span> {t('fixed_schedule')}</div>
            <div className="legend-item"><span className="dot smart"></span> {t('smart_ai')}</div>
          </div>
        </div>
      </section>

      {/* Daily Details */}
      <section className="daily-details glass-card">
        <h2>{t('daily_details')}</h2>
        <div className="details-table">
          <div className="table-header">
            <span>{t('day')}</span>
            <span>{t('fixed')}</span>
            <span>{t('smart')}</span>
            <span>{t('saved')}</span>
          </div>
          {waterData.days.map((day, index) => (
            <div key={index} className={`table-row ${day.saved > 0 ? 'has-savings' : ''}`}>
              <span className="day-cell">
                <strong>{day.dayName}</strong>
                <small>{day.dateStr}</small>
              </span>
              <span className="water-cell">{(day.fixedWater / 1000).toFixed(1)}k L</span>
              <span className="water-cell smart">{(day.smartWater / 1000).toFixed(1)}k L</span>
              <span className="saved-cell">
                {day.saved > 0 ? (
                  <>+{(day.saved / 1000).toFixed(1)}k L</>
                ) : (
                  '-'
                )}
                {day.skippedReason && <small className="reason">{day.skippedReason}</small>}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Export Actions */}
      <section className="export-section glass-card">
        <h2>{t('export_report')}</h2>
        <div className="export-buttons">
          <button onClick={exportCSV} className="export-btn csv">
            <DatabaseIcon size={18} />
            {t('export_csv')}
            {exportFormat === 'csv' && <span className="check">✓</span>}
          </button>
          <button onClick={exportJSON} className="export-btn json">
            <DatabaseIcon size={18} />
            {t('export_json')}
            {exportFormat === 'json' && <span className="check">✓</span>}
          </button>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="disclaimer">
        <p>
          <p>
            {t('report_disclaimer')}
          </p>
        </p>
      </div>

      <style>{`
        .weekly-report {
          min-height: 100vh;
          padding: 1rem;
          padding-bottom: 100px;
        }

        .report-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .report-header .back-btn {
          color: var(--text-primary);
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .report-header .back-btn:hover {
          background: var(--glass-bg);
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .header-content p.header-subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-left: 0.5rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .summary-card {
          padding: 1rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .summary-card.active-card {
          border: 1px solid var(--accent-color);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2);
        }

        .summary-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .summary-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .summary-card.percent-saved .summary-value {
          color: var(--text-primary);
        }

        .chart-section, .daily-details, .export-section {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .chart-section h2, .daily-details h2, .export-section h2 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .bar-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 150px;
          gap: 0.5rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .bars {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 120px;
        }

        .bar {
          width: 16px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }

        .fixed-bar {
          background: rgba(128, 128, 128, 0.5);
        }

        /* Dark theme: green for saved, orange for moderate, default accent for regular */
        [data-theme="dark"] .smart-bar {
          background: #10b981;
        }

        [data-theme="dark"] .smart-bar.moderate {
          background: #f59e0b;
        }

        [data-theme="dark"] .smart-bar.no-saving {
          background: #ef4444;
        }

        /* Light theme: purple/lavender for better visibility */
        [data-theme="light"] .smart-bar {
          background: #8b5cf6;
        }

        [data-theme="light"] .fixed-bar {
          background: #d1d5db;
        }

        /* Legend color dots */
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot.fixed {
          background: rgba(128, 128, 128, 0.5);
        }

        [data-theme="light"] .dot.fixed {
          background: #d1d5db;
        }

        .dot.smart {
          background: var(--accent-color);
        }

        [data-theme="light"] .dot.smart {
          background: #8b5cf6;
        }

        [data-theme="dark"] .dot.smart {
          background: #10b981;
        }

        .bar-label {
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .rain-badge {
          font-size: 0.8rem;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--glass-border);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .legend-color.fixed {
          background: rgba(255, 255, 255, 0.3);
        }

        .legend-color.smart {
          background: var(--accent-color);
        }

        .details-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 0.5rem;
          padding: 0.75rem;
          align-items: center;
        }

        .table-header {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--glass-border);
        }

        .table-row {
          background: var(--glass-bg);
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .table-row.has-savings {
          border-left: 3px solid var(--accent-color);
        }

        .day-cell {
          display: flex;
          flex-direction: column;
        }

        .day-cell strong {
          color: var(--text-primary);
        }

        .day-cell small {
          color: var(--text-secondary);
          font-size: 0.7rem;
        }

        .water-cell {
          color: var(--text-secondary);
        }

        .water-cell.smart {
          color: var(--text-primary);
          font-weight: 500;
        }

        .saved-cell {
          color: var(--accent-color);
          font-weight: 600;
          display: flex;
          flex-direction: column;
        }

        .saved-cell .reason {
          font-size: 0.65rem;
          font-weight: 400;
          opacity: 0.8;
        }

        .export-buttons {
          display: flex;
          gap: 1rem;
        }

        .export-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-btn.csv {
          background: var(--accent-color);
          color: white;
        }

        /* Light theme: purple/lavender buttons */
        [data-theme="light"] .export-btn.csv {
          background: #8b5cf6;
          color: white;
        }

        [data-theme="light"] .export-btn.json {
          background: #e9d5ff;
          color: #6b21a8;
          border: 1px solid #c4b5fd;
        }

        .export-btn.json {
          background: var(--glass-bg);
          color: var(--text-primary);
          border: 1px solid var(--glass-border);
        }

        .export-btn:hover {
          transform: translateY(-2px);
        }

        .export-btn .check {
          color: #10b981;
          font-weight: bold;
        }

        .disclaimer {
          text-align: center;
          padding: 1rem;
        }

        .disclaimer p {
          margin: 0.5rem 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

export default WeeklyReport;
