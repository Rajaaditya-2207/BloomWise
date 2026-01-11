import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useLanguage } from '../App';
import { indianRegions, getDistrictsByRegion } from '../data/indianRegions';
import { indianCrops, cropCategories } from '../data/indianCrops';
import { indianSoils } from '../data/indianSoils';
import { powerSchedules } from '../data/powerSchedules';

const STEPS = ['location', 'soil', 'water', 'power', 'crop', 'area'];

const waterSources = [
    { id: 'borewell', name: 'Borewell', nameTranslit: 'Borewell', icon: '🕳️' },
    { id: 'canal', name: 'Canal', nameTranslit: 'Nahar', icon: '🏞️' },
    { id: 'tank', name: 'Tank/Pond', nameTranslit: 'Talaab', icon: '💧' },
    { id: 'river', name: 'River', nameTranslit: 'Nadi', icon: '🌊' },
    { id: 'tanker', name: 'Water Tanker', nameTranslit: 'Tanker', icon: '🚚' }
];

const irrigationMethods = [
    { id: 'flood', name: 'Flood/Surface', nameTranslit: 'Flood', icon: '🌊', efficiency: 0.4 },
    { id: 'furrow', name: 'Furrow', nameTranslit: 'Nali', icon: '〰️', efficiency: 0.55 },
    { id: 'sprinkler', name: 'Sprinkler', nameTranslit: 'Sprinkler', icon: '🚿', efficiency: 0.75 },
    { id: 'drip', name: 'Drip', nameTranslit: 'Drip', icon: '💧', efficiency: 0.90 }
];

function FarmSetup() {
    const { farm, setFarm } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: farm?.name || '',
        regionId: farm?.regionId || '',
        district: farm?.district || '',
        latitude: farm?.latitude || null,
        longitude: farm?.longitude || null,
        soilTypeId: farm?.soilTypeId || '',
        soilDepthCm: farm?.soilDepthCm || 60,
        waterSourceId: farm?.waterSourceId || '',
        irrigationMethodId: farm?.irrigationMethodId || '',
        areaHectares: farm?.areaHectares || 1,
        crops: farm?.crops || []
    });

    const [selectedCrop, setSelectedCrop] = useState('');
    const [plantingDate, setPlantingDate] = useState('');

    const currentStep = STEPS[step];
    const isLastStep = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            saveFarm();
        } else {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addCrop = () => {
        if (selectedCrop && plantingDate) {
            const newCrop = {
                id: selectedCrop,
                plantingDate: plantingDate
            };
            updateField('crops', [...formData.crops, newCrop]);
            setSelectedCrop('');
            setPlantingDate('');
        }
    };

    const removeCrop = (index) => {
        const updated = formData.crops.filter((_, i) => i !== index);
        updateField('crops', updated);
    };

    const saveFarm = () => {
        // Get coordinates for the region (simplified)
        const region = indianRegions.find(r => r.id === formData.regionId);
        const updatedFarm = {
            ...formData,
            id: farm?.id || `farm-${Date.now()}`,
            latitude: formData.latitude || getRegionCoords(formData.regionId).lat,
            longitude: formData.longitude || getRegionCoords(formData.regionId).lon
        };

        setFarm(updatedFarm);
        navigate('/');
    };

    // Simplified coordinates for regions
    const getRegionCoords = (regionId) => {
        const coords = {
            'MH': { lat: 19.7515, lon: 75.7139 },
            'UP': { lat: 26.8467, lon: 80.9462 },
            'GJ': { lat: 22.2587, lon: 71.1924 },
            'RJ': { lat: 27.0238, lon: 74.2179 },
            'PB': { lat: 31.1471, lon: 75.3412 },
            'HR': { lat: 29.0588, lon: 76.0856 },
            'MP': { lat: 22.9734, lon: 78.6569 },
            'KA': { lat: 15.3173, lon: 75.7139 },
            'TN': { lat: 11.1271, lon: 78.6569 },
            'AP': { lat: 15.9129, lon: 79.7400 },
            'TS': { lat: 18.1124, lon: 79.0193 },
            'WB': { lat: 22.9868, lon: 87.8550 },
            'BR': { lat: 25.0961, lon: 85.3131 }
        };
        return coords[regionId] || { lat: 20.5937, lon: 78.9629 }; // Default: center of India
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'location': return formData.regionId && formData.district;
            case 'soil': return formData.soilTypeId;
            case 'water': return formData.waterSourceId && formData.irrigationMethodId;
            case 'power': return true; // Optional step
            case 'crop': return formData.crops.length > 0;
            case 'area': return formData.areaHectares > 0;
            default: return true;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'location':
                return (
                    <div className="step-content">
                        <h2>📍 {t('select_state')}</h2>
                        <p>{t('select_state_desc')}</p>

                        <div className="form-group">
                            <label className="form-label">State/UT</label>
                            <select
                                className="form-select"
                                value={formData.regionId}
                                onChange={(e) => {
                                    updateField('regionId', e.target.value);
                                    updateField('district', '');
                                }}
                            >
                                <option value="">{t('select_option')}</option>
                                {indianRegions.map(region => (
                                    <option key={region.id} value={region.id}>
                                        {region.name} ({region.nameTranslit})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.regionId && (
                            <div className="form-group">
                                <label className="form-label">{t('select_district')}</label>
                                <select
                                    className="form-select"
                                    value={formData.district}
                                    onChange={(e) => updateField('district', e.target.value)}
                                >
                                    <option value="">{t('select_option')}</option>
                                    {getDistrictsByRegion(formData.regionId).map(district => (
                                        <option key={district} value={district}>
                                            {district}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                );

            case 'soil':
                return (
                    <div className="step-content">
                        <h2>🌍 {t('select_soil')}</h2>
                        <p>{t('select_soil_desc')}</p>

                        <div className="soil-grid">
                            {indianSoils.map(soil => (
                                <button
                                    key={soil.id}
                                    className={`soil-card ${formData.soilTypeId === soil.id ? 'selected' : ''}`}
                                    onClick={() => updateField('soilTypeId', soil.id)}
                                >
                                    <span className="soil-icon">{soil.icon}</span>
                                    <span className="soil-name">{soil.nameTranslit}</span>
                                    <span className="soil-english">{soil.name}</span>
                                    <span className="soil-depth">{soil.typicalDepthCategory}</span>
                                </button>
                            ))}
                        </div>

                        {formData.soilTypeId && (
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">
                                    {t('soil_depth')} (cm): {formData.soilDepthCm}
                                </label>
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    value={formData.soilDepthCm}
                                    onChange={(e) => updateField('soilDepthCm', parseInt(e.target.value))}
                                    className="range-input"
                                />
                                <div className="range-labels">
                                    <span>{t('shallow')} (20cm)</span>
                                    <span>{t('deep')} (200cm)</span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'water':
                return (
                    <div className="step-content">
                        <h2>💧 {t('select_water_source')}</h2>
                        <p>{t('water_source_desc')}</p>

                        <div className="option-grid">
                            {waterSources.map(source => (
                                <button
                                    key={source.id}
                                    className={`option-card ${formData.waterSourceId === source.id ? 'selected' : ''}`}
                                    onClick={() => updateField('waterSourceId', source.id)}
                                >
                                    <span className="option-icon">{source.icon}</span>
                                    <span className="option-name">{source.nameTranslit}</span>
                                </button>
                            ))}
                        </div>

                        <h3 style={{ marginTop: '1.5rem' }}>{t('irrigation_method_title')}</h3>
                        <div className="option-grid">
                            {irrigationMethods.map(method => (
                                <button
                                    key={method.id}
                                    className={`option-card ${formData.irrigationMethodId === method.id ? 'selected' : ''}`}
                                    onClick={() => updateField('irrigationMethodId', method.id)}
                                >
                                    <span className="option-icon">{method.icon}</span>
                                    <span className="option-name">{method.nameTranslit}</span>
                                    <span className="option-efficiency">{Math.round(method.efficiency * 100)}% {t('efficient')}</span>
                                </button>
                            ))}
                        </div>
                    </div >
                );

            case 'power':
                const powerSchedule = powerSchedules[formData.regionId] || powerSchedules.DEFAULT;
                return (
                    <div className="step-content">
                        <h2>⚡ {t('power_schedule_title')}</h2>
                        <p>{t('power_schedule_desc')}</p>

                        <div className="power-info-card">
                            <h3>{powerSchedule.name}</h3>
                            <p className="scheme">{powerSchedule.scheme}</p>

                            <div className="power-slots">
                                <strong>{t('power_timings')}</strong>
                                {powerSchedule.slots.map((slot, i) => (
                                    <div key={i} className="slot-badge">
                                        {slot.start} - {slot.end}
                                    </div>
                                ))}
                            </div>

                            <p className="power-hours">
                                ⏱️ {powerSchedule.hoursPerDay} {t('hours_per_day')}
                            </p>

                            <p className="power-note">
                                💡 {powerSchedule.notesTranslit || powerSchedule.notes}
                            </p>
                        </div>

                        <p className="note">
                            ✅ {t('schedule_note')}
                        </p>
                    </div>
                );

            case 'crop':
                return (
                    <div className="step-content">
                        <h2>🌾 {t('select_crop')}</h2>
                        <p>{t('select_crop_desc')}</p>

                        {/* Added crops */}
                        {formData.crops.length > 0 && (
                            <div className="added-crops">
                                {formData.crops.map((crop, index) => {
                                    const cropData = indianCrops.find(c => c.id === crop.id);
                                    return (
                                        <div key={index} className="added-crop-chip">
                                            <span>{cropData?.icon} {cropData?.nameTranslit}</span>
                                            <button onClick={() => removeCrop(index)}>×</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add new crop */}
                        <div className="add-crop-form">
                            <select
                                className="form-select"
                                value={selectedCrop}
                                onChange={(e) => setSelectedCrop(e.target.value)}
                            >
                                <option value="">{t('select_crop_placeholder')}</option>
                                {Object.entries(cropCategories).map(([catId, cat]) => (
                                    <optgroup key={catId} label={`${cat.icon} ${cat.nameTranslit}`}>
                                        {indianCrops.filter(c => c.category === catId).map(crop => (
                                            <option key={crop.id} value={crop.id}>
                                                {crop.icon} {crop.nameTranslit} ({crop.name})
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>

                            <input
                                type="date"
                                className="form-input"
                                value={plantingDate}
                                onChange={(e) => setPlantingDate(e.target.value)}
                                placeholder={t('planting_date_placeholder')}
                            />

                            <button
                                className="btn btn-secondary"
                                onClick={addCrop}
                                disabled={!selectedCrop || !plantingDate}
                            >
                                {t('add_btn')}
                            </button>
                        </div>

                        {/* Popular crops quick select */}
                        <div className="popular-crops">
                            <h4>{t('popular_crops')}</h4>
                            <div className="crop-grid">
                                {['wheat', 'rice_paddy', 'cotton', 'sugarcane', 'soybean', 'groundnut', 'tomato', 'onion'].map(cropId => {
                                    const crop = indianCrops.find(c => c.id === cropId);
                                    if (!crop) return null;
                                    return (
                                        <button
                                            key={cropId}
                                            className="crop-icon-btn"
                                            onClick={() => setSelectedCrop(cropId)}
                                        >
                                            <span className="icon">{crop.icon}</span>
                                            <span className="name">{crop.nameTranslit}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 'area':
                return (
                    <div className="step-content">
                        <h2>📐 {t('farm_area')}</h2>
                        <p>{t('farm_size_desc')}</p>

                        <div className="area-input">
                            <input
                                type="number"
                                className="form-input big-input"
                                value={formData.areaHectares}
                                onChange={(e) => updateField('areaHectares', parseFloat(e.target.value) || 0)}
                                min="0.1"
                                step="0.1"
                            />
                            <span className="unit">{t('hectare')}</span>
                        </div>

                        <div className="area-conversion">
                            <p>≈ {(formData.areaHectares * 2.47).toFixed(1)} {t('acre')}</p>
                            <p>≈ {(formData.areaHectares * 4).toFixed(1)} Bigha {t('approx')}</p>
                        </div>

                        <div className="area-quick-select">
                            {[0.5, 1, 2, 5, 10].map(size => (
                                <button
                                    key={size}
                                    className={`quick-btn ${formData.areaHectares === size ? 'selected' : ''}`}
                                    onClick={() => updateField('areaHectares', size)}
                                >
                                    {size} ha
                                </button>
                            ))}
                        </div>

                        <div className="farm-name-input" style={{ marginTop: '1.5rem' }}>
                            <label className="form-label">{t('farm_name_optional')}</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder={t('farm_name_placeholder')}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="farm-setup">
            {/* Progress */}
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
            </div>
            <div className="step-indicator">
                Step {step + 1} of {STEPS.length}
            </div>

            {/* Step Content */}
            {renderStep()}

            {/* Navigation */}
            <div className="setup-nav">
                {step > 0 && (
                    <button className="btn btn-secondary" onClick={handleBack}>
                        ← {t('back')}
                    </button>
                )}
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={!canProceed()}
                >
                    {isLastStep ? `✓ ${t('save')}` : `${t('next')} →`}
                </button>
            </div>

            <style>{`
        .farm-setup {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .progress-bar {
          height: 4px;
          background: var(--bg-glass);
          border-radius: var(--radius-full);
          margin-bottom: 0.5rem;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }
        
        .step-indicator {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }
        
        .step-content {
          flex: 1;
        }
        
        .step-content h2 {
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }
        
        .step-content > p {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        
        .step-content h3 {
          color: var(--text-primary);
        }
        
        .soil-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        
        .soil-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }
        
        .soil-card:hover, .soil-card.selected {
          border-color: var(--accent-primary);
          background: var(--bg-glass-hover);
        }
        
        .soil-card.selected {
          box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .soil-icon {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }
        
        .soil-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        
        .soil-english {
          font-size: 0.625rem;
          color: var(--text-muted);
        }
        
        .soil-depth {
          font-size: 0.625rem;
          background: var(--bg-glass);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          margin-top: 0.25rem;
          color: var(--text-secondary);
        }
        
        .range-input {
          width: 100%;
          margin: 0.5rem 0;
          accent-color: var(--accent-primary);
        }
        
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .option-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        
        .option-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }
        
        .option-card:hover, .option-card.selected {
          border-color: var(--accent-primary);
          background: var(--bg-glass-hover);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        
        .option-icon {
          font-size: 1.5rem;
        }
        
        .option-name {
          font-size: 0.75rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }
        
        .option-efficiency {
          font-size: 0.625rem;
          color: var(--success);
        }
        
        .power-info-card {
          padding: 1rem;
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--warning);
          color: var(--text-primary);
        }
        
        .power-info-card h3 {
          margin: 0;
          color: var(--text-primary);
        }
        
        .power-info-card .scheme {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 1rem;
        }
        
        .power-slots {
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
        }
        
        .slot-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--bg-glass-strong);
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.875rem;
          margin: 0.25rem 0.25rem 0 0;
          color: var(--text-primary);
        }
        
        .power-hours {
          font-size: 0.875rem;
          margin: 0.5rem 0;
        }
        
        .power-note {
          font-size: 0.8125rem;
          margin: 0;
          color: var(--text-secondary);
        }
        
        .note {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-glass);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          border-left: 3px solid var(--success);
          color: var(--text-primary);
        }
        
        .added-crops {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .added-crop-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-glass);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        
        .added-crop-chip button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--danger);
          line-height: 1;
        }
        
        .add-crop-form {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .popular-crops h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        
        .area-input {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .big-input {
          font-size: 2rem;
          font-weight: 700;
          width: 150px;
          text-align: center;
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
        }
        
        .big-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        
        .unit {
          font-size: 1.25rem;
          color: var(--text-secondary);
        }
        
        .area-conversion {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        
        .area-conversion p {
          margin: 0.25rem 0;
        }
        
        .area-quick-select {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .quick-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-full);
          background: var(--bg-glass);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
        }
        
        .quick-btn:hover, .quick-btn.selected {
          border-color: var(--accent-primary);
          background: var(--bg-glass-hover);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        
        .setup-nav {
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          padding: 1rem 0;
          margin-top: auto;
        }
        
        .setup-nav .btn {
          flex: 1;
        }
        
        .btn-secondary {
          background: var(--bg-glass);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-secondary:hover {
          background: var(--bg-glass-hover);
        }
      `}</style>
        </div>
    );
}

export default FarmSetup;

