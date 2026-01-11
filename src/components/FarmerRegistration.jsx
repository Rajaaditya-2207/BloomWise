import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { agentMemory } from '../services/agentMemory';
import { indianSoils } from '../data/indianSoils';
import { indianCrops } from '../data/indianCrops';
import { indianRegions } from '../data/indianRegions';
import { t, SUPPORTED_LANGUAGES } from '../utils/translations';
import { useLanguage } from '../App';
import LanguageSelector from './LanguageSelector';

const WATER_SOURCES = [
    { id: 'borewell', name: 'Borewell', nameHindi: 'बोरवेल' },
    { id: 'canal', name: 'Canal', nameHindi: 'नहर' },
    { id: 'tank', name: 'Tank/Pond', nameHindi: 'तालाब' },
    { id: 'river', name: 'River', nameHindi: 'नदी' },
    { id: 'well', name: 'Open Well', nameHindi: 'कुआं' },
    { id: 'rainwater', name: 'Rainwater Harvesting', nameHindi: 'वर्षा जल संचयन' }
];

const IRRIGATION_METHODS = [
    { id: 'drip', name: 'Drip Irrigation', nameHindi: 'ड्रिप सिंचाई', efficiency: 0.9 },
    { id: 'sprinkler', name: 'Sprinkler', nameHindi: 'स्प्रिंकलर', efficiency: 0.75 },
    { id: 'flood', name: 'Flood/Surface', nameHindi: 'बाढ़/सतही', efficiency: 0.5 },
    { id: 'furrow', name: 'Furrow', nameHindi: 'नाली', efficiency: 0.6 }
];



// Eye icon for preview mode
const EyeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// Mock farmer profile for preview mode
const MOCK_FARMER_PROFILE = {
    id: 'demo-farmer-001',
    full_name: 'राजेश कुमार (Demo)',
    phone: '9876543210',
    state: 'UP',
    district: 'Lucknow',
    village: 'Demo Village',
    land_size_ha: 2.5,
    soil_type: 'alluvial',
    water_source: 'borewell',
    irrigation_method: 'drip',
    primary_crop: 'wheat',
    planting_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days ago
    language: 'en',
    latitude: 26.8467,
    longitude: 80.9462,
    isDemo: true
};

function FarmerRegistration() {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        state: '',
        district: '',
        village: '',
        landSizeHa: '',
        soilType: '',
        waterSource: '',
        irrigationMethod: '',
        primaryCrop: '',
        plantingDate: '',
        language: language
    });

    const [districts, setDistricts] = useState([]);



    // Update districts when state changes
    useEffect(() => {
        if (formData.state) {
            const stateData = indianRegions.find(s => s.id === formData.state);
            setDistricts(stateData?.majorDistricts || []);
            setFormData(prev => ({ ...prev, district: '' }));
        }
    }, [formData.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const validateStep = (stepNum) => {
        switch (stepNum) {
            case 1:
                if (!formData.fullName.trim()) return t('enter_name');
                if (!formData.phone.match(/^[6-9]\d{9}$/)) return t('enter_mobile');
                // Email is optional, no validation needed here
                return null;
            case 2:
                if (!formData.state) return t('select_state');
                if (!formData.district) return t('select_district');
                if (!formData.landSizeHa || parseFloat(formData.landSizeHa) <= 0) return t('land_size');
                return null;
            case 3:
                if (!formData.soilType) return t('select_soil');
                if (!formData.waterSource) return t('select_water_source');
                if (!formData.irrigationMethod) return t('irrigation_method');
                return null;
            case 4:
                if (!formData.primaryCrop) return t('select_crop');
                if (!formData.plantingDate) return t('planting_date');
                return null;
            default:
                return null;
        }
    };

    const nextStep = () => {
        const validationError = validateStep(step);
        if (validationError) {
            setError(validationError);
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateStep(4);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Get coordinates for the district (mock - would use geocoding API)
            const stateData = indianRegions.find(s => s.id === formData.state);

            const farmerData = {
                full_name: formData.fullName.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim() || null, // Include email
                state: formData.state,
                district: formData.district,
                village: formData.village.trim() || null,
                land_size_ha: parseFloat(formData.landSizeHa),
                soil_type: formData.soilType,
                water_source: formData.waterSource,
                irrigation_method: formData.irrigationMethod,
                primary_crop: formData.primaryCrop,
                planting_date: formData.plantingDate,
                language: formData.language,
                latitude: stateData?.capital?.lat || 20.5937,
                longitude: stateData?.capital?.lon || 78.9629
            };

            // Save to Supabase
            const { data, error: dbError } = await supabase
                .from('farmers')
                .insert([farmerData])
                .select()
                .single();

            if (dbError) {
                // If phone/email already exists, try to fetch existing farmer
                // Error code 23505 is unique_violation
                if (dbError.code === '23505') {
                    // Start checking with Phone
                    let { data: existing } = await supabase
                        .from('farmers')
                        .select('*')
                        .eq('phone', formData.phone)
                        .single();

                    // If not found by phone, check Email
                    if (!existing && formData.email) {
                        const { data: existingEmail } = await supabase
                            .from('farmers')
                            .select('*')
                            .eq('email', formData.email)
                            .single();
                        existing = existingEmail;
                    }

                    if (existing) {
                        agentMemory.setFarmer(existing);
                        // Optional: Show a toast "Welcome back! Account existed."
                        navigate('/');
                        return;
                    }
                }
                throw new Error(dbError.message);
            }

            // Save to agent memory
            agentMemory.setFarmer(data);

            // Navigate to dashboard
            navigate('/');

        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');

            // For demo: save locally even if DB fails
            const mockFarmer = {
                id: crypto.randomUUID(),
                ...formData,
                full_name: formData.fullName,
                land_size_ha: parseFloat(formData.landSizeHa),
                primary_crop: formData.primaryCrop,
                planting_date: formData.plantingDate
            };
            agentMemory.setFarmer(mockFarmer);
            navigate('/');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="registration-step">
            <h3>👤 {tr('personal_info')}</h3>
            <div className="form-group">
                <label htmlFor="fullName">{tr('full_name')} *</label>
                <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={tr('enter_name')}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="phone">{tr('mobile_number')} *</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={tr('enter_mobile')}
                    maxLength={10}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">Email ({tr('optional')})</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. farmer@example.com"
                />
            </div>
            <div className="form-group">
                <label htmlFor="language">{tr('preferred_language')}</label>
                <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                >
                    {SUPPORTED_LANGUAGES.filter(l => l.code !== 'hi_translit').map(l => (
                        <option key={l.code} value={l.code}>
                            {l.nativeName} ({l.name})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="registration-step">
            <h3>📍 {tr('farm_location')}</h3>
            <div className="form-group">
                <label htmlFor="state">{tr('select_state')} *</label>
                <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                >
                    <option value="">{tr('select_state')}</option>
                    {indianRegions.map(state => (
                        <option key={state.id} value={state.id}>
                            {state.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="district">{tr('select_district')} *</label>
                <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    disabled={!formData.state}
                >
                    <option value="">{tr('select_district')}</option>
                    {districts.map(district => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="village">{tr('village')} ({tr('optional')})</label>
                <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    placeholder={tr('village')}
                />
            </div>
            <div className="form-group">
                <label htmlFor="landSizeHa">{tr('land_size')} *</label>
                <input
                    type="number"
                    id="landSizeHa"
                    name="landSizeHa"
                    value={formData.landSizeHa}
                    onChange={handleChange}
                    placeholder="e.g., 2.5"
                    min="0.1"
                    step="0.1"
                    required
                />
                <span className="form-hint">{tr('land_hint')}</span>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="registration-step">
            <h3>🌱 {tr('farm_details')}</h3>
            <div className="form-group">
                <label htmlFor="soilType">{tr('select_soil')} *</label>
                <select
                    id="soilType"
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    required
                >
                    <option value="">{tr('select_soil')}</option>
                    {indianSoils.map(soil => (
                        <option key={soil.id} value={soil.id}>
                            {soil.icon} {soil.name} ({soil.nameHindi})
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="waterSource">{tr('select_water_source')} *</label>
                <select
                    id="waterSource"
                    name="waterSource"
                    value={formData.waterSource}
                    onChange={handleChange}
                    required
                >
                    <option value="">{tr('select_water_source')}</option>
                    {WATER_SOURCES.map(source => (
                        <option key={source.id} value={source.id}>
                            {source.name} ({source.nameHindi})
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="irrigationMethod">{tr('irrigation_method')} *</label>
                <select
                    id="irrigationMethod"
                    name="irrigationMethod"
                    value={formData.irrigationMethod}
                    onChange={handleChange}
                    required
                >
                    <option value="">{tr('irrigation_method')}</option>
                    {IRRIGATION_METHODS.map(method => (
                        <option key={method.id} value={method.id}>
                            {method.name} ({method.nameHindi}) - {Math.round(method.efficiency * 100)}% {tr('efficient')}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="registration-step">
            <h3>🌾 {tr('crop_info')}</h3>
            <div className="form-group">
                <label htmlFor="primaryCrop">{tr('primary_crop')} *</label>
                <select
                    id="primaryCrop"
                    name="primaryCrop"
                    value={formData.primaryCrop}
                    onChange={handleChange}
                    required
                >
                    <option value="">{tr('select_crop')}</option>
                    {indianCrops.slice(0, 30).map(crop => (
                        <option key={crop.id} value={crop.id}>
                            {crop.icon} {crop.name} ({crop.nameHindi})
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="plantingDate">{tr('planting_date')} *</label>
                <input
                    type="date"
                    id="plantingDate"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                />
            </div>
        </div>
    );

    // Get current language display
    const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

    return (
        <div className="registration-container">
            {/* Language Selector Button - Top Right */}
            <div className="language-selector-wrapper" style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 100
            }}>
                <LanguageSelector />
            </div>

            <div className="registration-card glass-card">
                <div className="registration-header">
                    <h2>🌾 {tr('registration_title')}</h2>
                    <p>{tr('farmer_registration')}</p>
                </div>

                <div className="progress-bar">
                    {[1, 2, 3, 4].map(s => (
                        <div
                            key={s}
                            className={`progress-step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                        >
                            {s < step ? '✓' : s}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="form-buttons">
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={prevStep}
                            >
                                ← {tr('back')}
                            </button>
                        )}

                        {step < 4 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={nextStep}
                            >
                                {tr('next')} →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? tr('registering') : `✓ ${tr('complete_registration')}`}
                            </button>
                        )}
                    </div>
                </form>

                <div className="registration-footer">
                    <p>{tr('already_registered')}</p>
                </div>
            </div>

            {/* Preview Mode Button - Bottom Right */}
            <button
                type="button"
                className="preview-mode-btn"
                onClick={() => {
                    // Set mock farmer profile and navigate to dashboard
                    agentMemory.setFarmer(MOCK_FARMER_PROFILE);
                    navigate('/');
                }}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 'var(--radius-full)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.3s ease',
                    zIndex: 100
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
                }}
                aria-label={tr('preview_app')}
            >
                <EyeIcon />
                <span>{t('preview_app')}</span>
            </button>
        </div>
    );
}

export default FarmerRegistration;
