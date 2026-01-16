import React, { useState, useEffect } from 'react';
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

  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Week selection - default to current week's Monday
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  };

  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    return getWeekStart(new Date()).toISOString().split('T')[0];
  });

  // Get min date (planting date)
  const minDate = farm?.planting_date || farm?.plantingDate || '2024-01-01';

  useEffect(() => {
    console.log('WeeklyReport: Effect triggered', { farm });
    async function fetchData() {
      // If preview mode OR explicit demo flag, use mock data. 
      // If it is a real logged-in user (farm.id exists and !isDemo), we fetch real data.
      if (!farm?.id || farm?.isDemo) {
        console.log('WeeklyReport: Using Mock Data (Demo Mode)', { farm });
        setWaterData(generateMockData());
        setLoading(false);
        return;
      }

      console.log('WeeklyReport: Fetching Real Data from Supabase');

      try {
        // Fetch data for selected week
        const startDate = new Date(selectedWeekStart);
        if (isNaN(startDate.getTime())) {
          console.error("WeeklyReport: Invalid startDate", selectedWeekStart);
          throw new Error("Invalid start date");
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        // Import supabase properly
        const { supabase } = await import('../services/supabase');
        const { data: logs, error } = await supabase
          .from('irrigation_logs')
          .select('*')
          .eq('farmer_id', farm.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (error) throw error;

        // For real users, if no logs, we show EMPTY data (zeros), not mock data
        if (!logs || logs.length === 0) {
          console.log('WeeklyReport: No logs found, showing zeros.');
          setWaterData(processRealData([])); // Pass empty array to generate zeroed days
        } else {
          setWaterData(processRealData(logs));
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err);
        // On error for real user, show zeros, not mock
        setWaterData(processRealData([]));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [farm, selectedWeekStart]);

  // Process Real Supabase Data
  const processRealData = (logs) => {
    const days = [];
    let totalUsed = 0;
    let totalSaved = 0;

    // Group by date
    const logsByDate = {};
    logs.forEach(log => {
      const dateStr = log.date; // YYYY-MM-DD
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = { used: 0, saved: 0, reason: null };
      }
      logsByDate[dateStr].used += (log.water_used_liters || 0);
      logsByDate[dateStr].saved += (log.water_saved_liters || 0);
      // Keep last reason
      if (log.water_saved_liters > 0) {
        logsByDate[dateStr].reason = log.rain_avoided ? 'Rain Avoided' : 'Soil Moisture OK';
      }
    });

    // Generate 7 days starting from selectedWeekStart
    const baseDate = new Date(selectedWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const log = logsByDate[dateKey] || { used: 0, saved: 0, reason: null };

      // Fixed = Used + Saved (Baseline)
      const fixedWater = log.used + log.saved;

      totalUsed += log.used;
      totalSaved += log.saved;

      days.push({
        date: d,
        dayName: d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' }),
        dateStr: d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }),
        fixedWater: fixedWater,
        smartWater: log.used,
        saved: log.saved,
        skippedReason: log.reason,
        rainProbability: 0
      });
    }

    const totalFixed = days.reduce((sum, d) => sum + d.fixedWater, 0);

    return {
      days,
      totalUsed,
      totalSaved,
      totalFixed,
      percentSaved: totalFixed > 0 ? Math.round((totalSaved / totalFixed) * 100) : 0,
      isRealData: true
    };
  };

  // Calculate water usage data with realistic variation (MOCK)
  const generateMockData = () => {
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
        skippedReason = language === 'hi' ? 'बारिश' : 'Rain';
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
      percentSaved: totalFixed > 0 ? Math.round((totalSaved / totalFixed) * 100) : 0,
      isRealData: false
    };
  };

  if (loading) return <div className="p-4 text-center">Loading Report...</div>;
  if (!waterData) return null;

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


      {/* Header - Now inside the glass card */}
      <div className="report-title-card glass-card" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button
          onClick={() => navigate('/')}
          className="back-btn"
          aria-label="Back"
          style={{
            position: 'absolute',
            left: '1rem',
            top: '1rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <ArrowLeftIcon size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{t('weekly_report') || 'Weekly Water Usage Report'}</h1>
        <p className="header-subtitle" style={{ marginTop: '0.5rem', opacity: 0.8 }}>{t('report_desc')}</p>
      </div>

      {/* Summary Cards */}
      <section className="summary-section">
        <div className="summary-grid">
          <div className="summary-card glass-card">
            <div className="icon-wrapper water">
              <WaterIcon size={28} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{(waterData.totalSaved / 1000).toFixed(1)}k</span>
              <span className="summary-label">{t('liters_saved')}</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="icon-wrapper chart">
              <ChartIcon size={28} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{waterData.percentSaved}%</span>
              <span className="summary-label">{t('water_saved')}</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="icon-wrapper plant">
              <PlantIcon size={28} />
            </div>
            <div className="summary-content">
              <span className="summary-value">{(waterData.totalUsed / 1000).toFixed(1)}k</span>
              <span className="summary-label">{t('liters_used')}</span>
            </div>
          </div>
        </div>
      </section >

      {/* Daily Comparison */}
      < section className="chart-section glass-card" >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0 }}>{t('daily_comparison')}</h3>
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            min={minDate}
            max={new Date().toISOString().split('T')[0]}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
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
      </section >

      {/* Daily Details */}
      < section className="daily-details glass-card" >
        <h2>{t('daily_details')}</h2>
        <div className="details-table">
          <div className="table-header">
            <span>{t('day')}</span>
            <span>{t('fixed')}</span>
            <span>{t('smart')}</span>
            <span>{t('saved')}</span>
          </div>
          {waterData.days.map((day, i) => (
            <div key={i} className="table-row">
              <span className="day-name">
                {day.dayName}
                {day.skippedReason && <span className="reason-tag">{day.skippedReason}</span>}
              </span>
              <span>{(day.fixedWater / 1000).toFixed(1)}k</span>
              <span className="smart-val">{(day.smartWater / 1000).toFixed(1)}k</span>
              <span className="saved-val">{(day.saved / 1000).toFixed(1)}k</span>
            </div>
          ))}
        </div>
      </section >

      {/* Export Actions */}
      < section className="export-section glass-card" >
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

        {/* Advanced Analytics Link */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => {
              if (farm?.isDemo) {
                navigate('/preview/analytics');
              } else {
                navigate('/analytics');
              }
            }}
            className="export-btn"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
          >
            <ChartIcon size={18} />
            {t('view_detailed_analytics') || 'View Detailed Analytics (Looker)'} <ArrowLeftIcon size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </section >

      {/* Disclaimer */}
      < div className="disclaimer" >
        <div className="disclaimer">
          <p>{t('report_disclaimer')}</p>
        </div>
      </div >

      <style>{`
        .weekly-report {
          min-height: 100vh;
          padding: 1.5rem 1rem 6rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .report-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .report-header .back-btn {
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-glass);
          border: 1px solid var(--glass-border);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .report-header .back-btn:hover {
          background: var(--glass-hover);
          transform: translateX(-2px);
        }

        .header-content h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .header-subtitle {
          margin: 0.25rem 0 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }



        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
        }

        .icon-wrapper.water { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .icon-wrapper.chart { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .icon-wrapper.plant { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

        .summary-content {
          text-align: center;
        }

        .summary-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .summary-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chart-section, .daily-details, .export-section {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .chart-section h3, .daily-details h2, .export-section h2 {
          margin: 0 0 1.25rem;
          font-size: 1.125rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bar-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 180px;
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .bars {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 140px;
          width: 100%;
          justify-content: center;
        }

        .bar {
          width: 8px; /* Thinner bars */
          border-radius: 4px 4px 0 0;
          transition: height 0.5s ease;
          min-height: 4px;
        }

        [data-theme="dark"] .fixed-bar { background: rgba(255, 255, 255, 0.15); }
        [data-theme="light"] .fixed-bar { background: #e5e7eb; }

        [data-theme="dark"] .smart-bar { background: var(--accent-primary); }
        [data-theme="light"] .smart-bar { background: var(--accent-primary); }

        .smart-bar.moderate { background-color: #f59e0b !important; }
        .smart-bar.no-saving { background-color: #ef4444 !important; }

        .bar-label {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .rain-badge {
          position: absolute;
          top: -20px;
          color: #3b82f6;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
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
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.fixed { background: #9ca3af; }
        .dot.smart { background: var(--accent-primary); }

        .details-table {
          width: 100%;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 0.75rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--glass-border);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 1rem 0.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--glass-border);
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .day-name {
          color: var(--text-primary);
          font-weight: 500;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .reason-tag {
          font-size: 0.7rem;
          color: var(--accent-blue);
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        .smart-val { color: var(--accent-primary); font-weight: 600; }
        .saved-val { color: var(--accent-green); }

        .export-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .export-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-glass);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          transition: all 0.2s;
          cursor: pointer;
        }

        .export-btn:hover {
          background: var(--glass-hover);
          border-color: var(--accent-primary);
        }

        .check {
          color: var(--accent-green);
          font-weight: bold;
        }

        /* Light mode button styles */
        [data-theme="light"] .export-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #1f2937;
        }

        [data-theme="light"] .export-btn:hover {
          background: #e5e7eb;
          border-color: var(--accent-primary);
        }

        .disclaimer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          opacity: 0.7;
        }

        @media (max-width: 600px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          
          .bar-chart {
            height: 150px;
          }
          
          .bar {
            width: 8px;
          }
        }
      `}</style>
    </div >
  );
}

export default WeeklyReport;
