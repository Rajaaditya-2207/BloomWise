import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, useLanguage, useTheme } from '../App';
import { SUPPORTED_LANGUAGES } from '../utils/translations';
import { clearAllCaches, getStorageStats } from '../services/offlineManager';
import {
  SettingsIcon, PaletteIcon, GlobeIcon, PlantIcon, DatabaseIcon,
  InfoIcon, ArrowLeftIcon, SunIcon, MoonIcon, LogOutIcon
} from './Icons';
import { indianSoils } from '../data/indianSoils';
import { powerSchedules } from '../data/powerSchedules';

function Settings() {
  const { farm } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isPreviewMode = location.pathname.startsWith('/preview');

  const [showFarmDetailsModal, setShowFarmDetailsModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const storageStats = getStorageStats();

  const handleClearCache = () => {
    clearAllCaches();
    setShowClearConfirm(false);
    window.location.reload();
  };

  const getThemeIcon = (id) => {
    if (id === 'light') return <SunIcon size={20} />;
    if (id === 'dark') return <MoonIcon size={20} />;
    return <PaletteIcon size={20} />;
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="app-header">
        <button className="btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeftIcon size={24} />
        </button>
        <h1><SettingsIcon size={28} style={{ marginRight: '0.5rem' }} /> {t('settings_title')}</h1>
      </header>

      <div className="settings-content">
        {/* Theme Section */}
        <section className="settings-section">
          <h3><PaletteIcon size={20} className="section-icon" /> {t('theme')}</h3>
          <p className="section-desc">{t('theme_desc')}</p>
          <div className="theme-switcher">
            {themes.map((th) => (
              <button
                key={th.id}
                className={`theme-btn ${theme === th.id ? 'active' : ''}`}
                onClick={() => setTheme(th.id)}
              >
                <span className="theme-icon">{getThemeIcon(th.id)}</span>
                <span className="theme-name">{t(`theme_${th.id}`) || th.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Language Section */}
        <section className="settings-section">
          <h3><GlobeIcon size={20} className="section-icon" /> {t('language')}</h3>
          <p className="section-desc">{t('language_desc')}</p>
          <div className="language-options">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                onClick={() => setLanguage(lang.code)}
              >
                <div className="lang-info">
                  <span className="native">{lang.nativeName}</span>
                  <span className="english">{lang.name}</span>
                </div>
                {language === lang.code && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Farm Info */}
        <section className="settings-section">
          <h3><PlantIcon size={20} className="section-icon" /> {t('farm_details')}</h3>
          <div className="glass-card">
            <div className="info-row">
              <span className="label">{t('name')}</span>
              <span className="value">{farm?.name || 'My Farm'}</span>
            </div>
            <div className="info-row">
              <span className="label">{t('location')}</span>
              <span className="value">{farm?.district}, {farm?.regionId}</span>
            </div>
            <div className="info-row">
              <span className="label">{t('area')}</span>
              <span className="value">{farm?.areaHectares} {t('hectares')}</span>
            </div>
            <button className="btn btn-primary" onClick={() => setShowFarmDetailsModal(true)} style={{ width: '100%', marginTop: '1rem' }}>
              Show Farm Details
            </button>
            <button className="btn btn-glass" onClick={() => navigate('/farm')} style={{ width: '100%', marginTop: '0.5rem' }}>
              {t('edit_farm_details')}
            </button>
          </div>
        </section>

        {/* Storage */}
        <section className="settings-section">
          <h3><DatabaseIcon size={20} className="section-icon" /> {t('storage')}</h3>
          <div className="glass-card">
            <div className="info-row">
              <span className="label">{t('cached_data')}</span>
              <span className="value">{storageStats.totalSizeKB} KB</span>
            </div>
            <p className="cache-note">
              {t('cache_desc')}
            </p>
            <button
              className="btn btn-danger"
              onClick={() => setShowClearConfirm(true)}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {t('clear_cache')}
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="settings-section">
          <h3><InfoIcon size={20} className="section-icon" /> {t('about')}</h3>
          <div className="glass-card">
            <div className="info-row">
              <span className="label">{t('app_name')}</span>
              <span className="value">BloomWise</span>
            </div>
            <div className="info-row">
              <span className="label">{t('app_version')}</span>
              <span className="value">1.0.5 MVP</span>
            </div>
            <p className="about-text">
              {t('app_tagline')}
            </p>
          </div>
        </section>

        {/* Account Actions */}
        <section className="settings-section">
          <button
            className="btn btn-danger"
            onClick={() => {
              if (isPreviewMode) {
                navigate('/');
                window.location.reload(); // Reset state
              } else {
                navigate('/welcome');
              }
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOutIcon size={20} />
            {isPreviewMode ? 'Exit Preview' : 'Log Out'}
          </button>
        </section>
      </div >

      {/* Clear Cache Confirmation */}
      {
        showClearConfirm && (
          <div className="modal-overlay">
            <div className="modal-content glass-strong">
              <h3>{t('clear_cache_confirm')}</h3>
              <p>{t('clear_cache_msg')}</p>
              <div className="modal-actions">
                <button className="btn btn-glass" onClick={() => setShowClearConfirm(false)}>
                  {t('cancel')}
                </button>
                <button className="btn btn-danger" onClick={handleClearCache}>
                  {t('clear_cache')}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Show Farm Details Modal */}
      {
        showFarmDetailsModal && (
          <div className="modal-overlay">
            <div className="modal-content glass-strong" style={{ maxWidth: '400px' }}>
              <h3>Farm Details</h3>
              <div className="farm-details-list">
                <div className="info-row">
                  <span className="label">Name</span>
                  <span className="value">{farm?.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Location</span>
                  <span className="value">{farm?.district}, {farm?.state}</span>
                </div>
                <div className="info-row">
                  <span className="label">Land Size</span>
                  <span className="value">{farm?.areaHectares} Hectares</span>
                </div>
                <div className="info-row">
                  <span className="label">Soil Type</span>
                  <span className="value text-capitalize">
                    {farm?.soilType || farm?.soil_type || (farm?.soilTypeId && indianSoils.find(s => s.id === farm.soilTypeId)?.name) || 'N/A'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Irrigation</span>
                  <span className="value text-capitalize">
                    {farm?.irrigationMethod || farm?.irrigation_method || farm?.irrigationMethodId?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Water Source</span>
                  <span className="value text-capitalize">
                    {farm?.waterSource || farm?.water_source || farm?.waterSourceId?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Power Schedule</span>
                  <span className="value text-capitalize">
                    {(farm?.powerSchedule || farm?.power_schedule || 'morning_evening').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="label">Crops Grown ({(farm?.crops?.length) || (farm?.primary_crop ? 1 : 0)})</span>
                  <div className="crops-tags">
                    {/* Handle Array of Crops (Local Demo) */}
                    {farm?.crops && farm.crops.length > 0 ? (
                      farm.crops.map((crop, index) => (
                        <span key={index} className="crop-tag" style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          marginRight: '4px',
                          marginBottom: '4px',
                          display: 'inline-block'
                        }}>
                          {crop.name || crop.id}
                        </span>
                      ))
                    ) : farm?.primary_crop ? (
                      /* Handle Single DB Crop */
                      <span className="crop-tag" style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        display: 'inline-block'
                      }}>
                        {farm.primary_crop}
                      </span>
                    ) : (
                      <span className="value">No crops added</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setShowFarmDetailsModal(false)} style={{ width: '100%' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style>{`
        .settings-page {
          min-height: 100vh;
        }
        
        .settings-content {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 80px; 
        }

        .app-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg-glass);
        }

        .app-header h1 {
            display: flex;
            align-items: center;
            margin: 0;
            font-size: 1.5rem;
        }
        
        .btn-icon {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .btn-icon:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }
        
        .section-icon {
            margin-right: 0.5rem;
            color: var(--accent-primary);
        }

        .settings-section h3 {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .section-desc {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0 0 1rem;
        }

        .theme-switcher {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .theme-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-lg);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }

        .theme-btn .theme-icon {
             color: var(--text-secondary);
             transition: color 0.2s;
        }

        .theme-btn.active {
            background: var(--accent-primary-glass);
            border-color: var(--accent-primary);
            color: var(--accent-primary);
            box-shadow: 0 0 15px var(--accent-glow);
        }

        .theme-btn.active .theme-icon {
            color: var(--accent-primary);
        }

        .theme-icon {
            margin-bottom: 0.5rem;
        }
        
        .language-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .language-options .lang-btn {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          position: relative;
          text-align: left;
           background: var(--bg-glass);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            cursor: pointer;
        }

        .lang-btn.active {
             border-color: var(--accent-primary);
             background: rgba(var(--accent-primary-rgb), 0.1);
        }

        .lang-info {
            display: flex;
            flex-direction: column;
        }
        
        .lang-btn .native {
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .lang-btn .english {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        
        .lang-btn .check {
          color: var(--accent-primary);
          font-weight: bold;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-glass);
        }
        
        .info-row:last-of-type {
          border-bottom: none;
        }
        
        .info-row .label {
          color: var(--text-secondary);
        }
        
        .info-row .value {
          font-weight: 500;
          color: var(--text-primary);
        }

        .text-capitalize {
            text-transform: capitalize;
        }
        
        .cache-note, .about-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0.5rem 0;
        }
        
        .btn-danger {
          background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 15px var(--danger-glow);
          border: none;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--danger-glow);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
        }
        
        .modal-content {
          padding: 1.5rem;
          max-width: 320px;
          width: 100%;
          border-radius: var(--radius-lg);
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .modal-content h3 {
          margin: 0 0 1rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 0.5rem;
        }
        
        .modal-content p {
          color: var(--text-secondary);
          margin: 0 0 1rem;
        }
        
        .modal-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .modal-actions .btn {
          flex: 1;
        }
        
        @media (max-width: 480px) {
          .language-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div >
  );
}

export default Settings;
