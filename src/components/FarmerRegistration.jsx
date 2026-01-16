import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { agentMemory } from '../services/agentMemory';
import { backgroundAgent } from '../services/backgroundAgent';
import { indianSoils } from '../data/indianSoils';
import { indianCrops } from '../data/indianCrops';
import { indianRegions } from '../data/indianRegions';
import { t, SUPPORTED_LANGUAGES } from '../utils/translations';
import { useLanguage } from '../App';
import LanguageSelector from './LanguageSelector';
import {
    ColoredProjectLogo,
    AlertCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckIcon,
    UserIcon,
    MapPinIcon,
    LeafIcon,
    WheatIcon,
    EyeIcon,
    WaveIcon,
    DropletsIcon,
    SunIcon,
    AlertTriangleIcon
} from './Icons';

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

// Power Schedule Options for Agent
const POWER_SCHEDULES = [
    { id: 'morning', name: 'Morning (6 AM - 10 AM)', nameHindi: 'सुबह (6 - 10 बजे)', hours: [6, 7, 8, 9] },
    { id: 'evening', name: 'Evening (6 PM - 10 PM)', nameHindi: 'शाम (6 - 10 बजे)', hours: [18, 19, 20, 21] },
    { id: 'night', name: 'Night (10 PM - 6 AM)', nameHindi: 'रात (10 बجे - 6 बजे)', hours: [22, 23, 0, 1, 2, 3, 4, 5] },
    { id: 'morning_evening', name: 'Morning + Evening', nameHindi: 'सुबह + शाम', hours: [6, 7, 8, 9, 18, 19, 20, 21] },
    { id: 'all_day', name: 'Available All Day', nameHindi: 'पूरे दिन उपलब्ध', hours: Array.from({ length: 24 }, (_, i) => i) }
];



// Helper to map soil icons
const getSoilIcon = (soilId) => {
    switch (soilId) {
        case 'alluvial': return <WaveIcon size={16} />;
        case 'black': return <DropletsIcon size={16} />;
        case 'red': return <SunIcon size={16} />;
        case 'laterite': return <AlertTriangleIcon size={16} />;
        case 'desert': return <SunIcon size={16} />;
        case 'mountain': return <MapPinIcon size={16} />;
        case 'forest': return <LeafIcon size={16} />;
        case 'saline': return <AlertTriangleIcon size={16} />;
        default: return <LeafIcon size={16} />;
    }
};

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
        powerSchedule: 'morning_evening', // NEW: Default power schedule
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
                if (!formData.email || !formData.email.includes('@')) return 'Please enter a valid email address';
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
                if (!formData.powerSchedule) return 'Please select your power schedule';
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
                email: formData.email.trim() || null,
                state: formData.state,
                district: formData.district,
                village: formData.village.trim() || null,
                land_size_ha: parseFloat(formData.landSizeHa),
                soil_type: formData.soilType,
                water_source: formData.waterSource,
                irrigation_method: formData.irrigationMethod,
                primary_crop: formData.primaryCrop,
                planting_date: formData.plantingDate,
                power_schedule: formData.powerSchedule,
                language: formData.language
                // Note: latitude/longitude removed - not in current schema
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
                        // Navigate to loading screen
                        navigate('/loading');
                        return;
                    }
                }
                throw new Error(dbError.message);
            }

            // Save to agent memory
            agentMemory.setFarmer(data);

            // Navigate to loading screen (agent starts there)
            navigate('/loading');

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
            navigate('/home');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="registration-step">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon style={{ color: 'var(--accent-primary)', marginBottom: '-4px' }} /> {t('personal_info')}
            </h3>
            <div className="form-group">
                <label htmlFor="fullName">{t('full_name')} *</label>
                <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={t('enter_name')}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="phone">{t('mobile_number')} *</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('enter_mobile')}
                    maxLength={10}
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. farmer@example.com"
                    required
                />
            </div>
            <div className="form-group">
                <label htmlFor="language">{t('preferred_language')}</label>
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPinIcon style={{ color: 'var(--danger)', marginBottom: '-4px' }} /> {t('farm_location')}
            </h3>
            <div className="form-group">
                <label htmlFor="state">{t('select_state')} *</label>
                <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                >
                    <option value="">{t('select_state')}</option>
                    {indianRegions.map(state => (
                        <option key={state.id} value={state.id}>
                            {state.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="district">{t('select_district')} *</label>
                <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    disabled={!formData.state}
                >
                    <option value="">{t('select_district')}</option>
                    {districts.map(district => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="village">{t('village')} ({t('optional')})</label>
                <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    placeholder={t('village')}
                />
            </div>
            <div className="form-group">
                <label htmlFor="landSizeHa">{t('land_size')} *</label>
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
                <span className="form-hint">{t('land_hint')}</span>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="registration-step">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LeafIcon style={{ color: 'var(--success)', marginBottom: '-4px' }} /> {t('farm_details')}
            </h3>
            <div className="form-group">
                <label htmlFor="soilType">{t('select_soil')} *</label>
                <select
                    id="soilType"
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    required
                >
                    <option value="">{t('select_soil')}</option>
                    {indianSoils.map(soil => (
                        <option key={soil.id} value={soil.id}>
                            {soil.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="waterSource">{t('select_water_source')} *</label>
                <select
                    id="waterSource"
                    name="waterSource"
                    value={formData.waterSource}
                    onChange={handleChange}
                    required
                >
                    <option value="">{t('select_water_source')}</option>
                    {WATER_SOURCES.map(source => (
                        <option key={source.id} value={source.id}>
                            {source.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="irrigationMethod">{t('irrigation_method')} *</label>
                <select
                    id="irrigationMethod"
                    name="irrigationMethod"
                    value={formData.irrigationMethod}
                    onChange={handleChange}
                    required
                >
                    <option value="">{t('irrigation_method')}</option>
                    {IRRIGATION_METHODS.map(method => (
                        <option key={method.id} value={method.id}>
                            {method.name} - {Math.round(method.efficiency * 100)}% {t('efficient')}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="registration-step">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WheatIcon style={{ color: 'var(--warning)', marginBottom: '-4px' }} /> {t('crop_info')}
            </h3>
            <div className="form-group">
                <label htmlFor="primaryCrop">{t('primary_crop')} *</label>
                <select
                    id="primaryCrop"
                    name="primaryCrop"
                    value={formData.primaryCrop}
                    onChange={handleChange}
                    required
                >
                    <option value="">{t('select_crop')}</option>
                    {indianCrops.slice(0, 30).map(crop => (
                        <option key={crop.id} value={crop.id}>
                            {crop.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="plantingDate">{t('planting_date')} *</label>
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
            {/* NEW: Power Schedule Selector */}
            <div className="form-group">
                <label htmlFor="powerSchedule">{t('power_schedule') || 'Power Schedule'} *</label>
                <select
                    id="powerSchedule"
                    name="powerSchedule"
                    value={formData.powerSchedule}
                    onChange={handleChange}
                    required
                >
                    {POWER_SCHEDULES.map(schedule => (
                        <option key={schedule.id} value={schedule.id}>
                            {language === 'hi' ? schedule.nameHindi : schedule.name}
                        </option>
                    ))}
                </select>
                <small style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                    {t('power_schedule_hint') || 'Select when electricity is typically available for your pump.'}
                </small>
            </div>
        </div>
    );

    // Get current language display
    const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ColoredProjectLogo size={36} />
                        <h2 style={{
                            margin: 0,
                            background: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #059669 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>BloomWise</h2>
                    </div>
                    <p>{t('farmer_registration') || 'Farmer Registration'}</p>
                </div>

                <div className="progress-bar">
                    {[1, 2, 3, 4].map(s => (
                        <div
                            key={s}
                            className={`progress-step ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
                        >
                            {s < step ? <CheckIcon size={14} /> : s}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}

                    {error && (
                        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircleIcon size={18} style={{ color: '#ef4444' }} /> {error}
                        </div>
                    )}

                    <div className="form-buttons">
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={prevStep}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <ChevronLeftIcon size={18} /> {t('back')}
                            </button>
                        )}

                        {step < 4 ? (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={nextStep}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {t('next')} <ChevronRightIcon size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                {isSubmitting ? t('registering') : <><CheckIcon size={18} /> {t('complete_registration')}</>}
                            </button>
                        )}
                    </div>
                </form>

                <div className="registration-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Already have an account?{' '}
                        <span
                            onClick={() => navigate('/signin')}
                            style={{
                                color: 'var(--accent-primary)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            Sign In
                        </span>
                    </p>
                </div>
            </div>

            {/* Preview Mode Button - Bottom Right */}
            <button
                type="button"
                className="preview-mode-btn"
                onClick={() => {
                    // Set mock farmer profile and navigate to preview dashboard
                    agentMemory.setFarmer(MOCK_FARMER_PROFILE);
                    navigate('/preview/home');
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
                aria-label={t('preview_app')}
            >
                <EyeIcon />
                <span>{t('preview_app')}</span>
            </button>
        </div>
    );
}

export default FarmerRegistration;
