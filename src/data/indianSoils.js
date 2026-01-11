/**
 * Indian Soil Types Database
 * 8 major soil types with depth categories and irrigation implications
 * Includes water-holding properties and regional distribution
 */

export const indianSoils = [
    {
        id: 'alluvial',
        name: 'Alluvial Soil',
        nameHindi: 'जलोढ़ मिट्टी',
        nameTranslit: 'Jalodh Mitti',
        icon: '🏞️',
        // Water properties
        waterHoldingCapacity: 'high',
        infiltrationRateMmHr: 15,
        fieldCapacityPct: 35,
        wiltingPointPct: 15,
        // Depth
        typicalDepthCategory: 'deep',
        typicalDepthCmMin: 100,
        typicalDepthCmMax: 300,
        // Irrigation
        irrigationFrequency: 'deep_infrequent',
        irrigationNote: 'Deep irrigation at longer intervals works best. Good water retention.',
        irrigationNoteHindi: 'गहरी सिंचाई लंबे अंतराल पर करें। अच्छी जल धारण क्षमता।',
        irrigationNoteTranslit: 'Gehri sinchai lambe antral par karein. Achhi jal dharan kshamta.',
        // Regions
        commonRegions: ['UP', 'BR', 'WB', 'PB', 'HR', 'UK'],
        description: 'Formed by river deposits. Most fertile and widespread in Indo-Gangetic plains.',
        descriptionHindi: 'नदियों के निक्षेपों से बनी। सबसे उपजाऊ, गंगा के मैदान में।',
        // Suitable crops
        suitableCrops: ['wheat', 'rice_paddy', 'sugarcane', 'maize', 'potato', 'vegetables'],
        specialNotes: 'Excellent for all types of crops. Monitor for waterlogging in low-lying areas.'
    },
    {
        id: 'black',
        name: 'Black Soil (Regur)',
        nameHindi: 'काली मिट्टी',
        nameTranslit: 'Kaali Mitti',
        icon: '⬛',
        waterHoldingCapacity: 'high',
        infiltrationRateMmHr: 5,
        fieldCapacityPct: 45,
        wiltingPointPct: 22,
        typicalDepthCategory: 'medium',
        typicalDepthCmMin: 60,
        typicalDepthCmMax: 150,
        irrigationFrequency: 'moderate',
        irrigationNote: 'High clay content - cracks when dry. Water slowly to avoid runoff.',
        irrigationNoteHindi: 'मिट्टी में चिकनी मिट्टी ज़्यादा - सूखने पर दरारें पड़ती हैं। धीरे पानी दें।',
        irrigationNoteTranslit: 'Mitti mein chikni mitti zyada - sukhne par dararen padti hain. Dheere paani dein.',
        commonRegions: ['MH', 'MP', 'GJ', 'AP', 'TS', 'KA'],
        description: 'Rich in lime, iron, magnesium. Self-plowing due to expansion/contraction.',
        descriptionHindi: 'चूना, लोहा, मैग्नीशियम से भरपूर। स्व-जुताई करने वाली।',
        suitableCrops: ['cotton', 'soybean', 'groundnut', 'jowar', 'tur', 'sunflower'],
        specialNotes: 'Ideal for cotton. Cracks help aeration. Avoid over-irrigation - slow drainage.'
    },
    {
        id: 'red',
        name: 'Red Soil',
        nameHindi: 'लाल मिट्टी',
        nameTranslit: 'Laal Mitti',
        icon: '🔴',
        waterHoldingCapacity: 'medium',
        infiltrationRateMmHr: 25,
        fieldCapacityPct: 25,
        wiltingPointPct: 10,
        typicalDepthCategory: 'medium',
        typicalDepthCmMin: 50,
        typicalDepthCmMax: 100,
        irrigationFrequency: 'moderate_frequent',
        irrigationNote: 'Lower water retention - irrigate more frequently in smaller amounts.',
        irrigationNoteHindi: 'कम जल धारण क्षमता - थोड़ा-थोड़ा बार-बार पानी दें।',
        irrigationNoteTranslit: 'Kam jal dharan kshamta - thoda-thoda baar-baar paani dein.',
        commonRegions: ['TN', 'KA', 'AP', 'TS', 'OD', 'JH', 'CG', 'WB'],
        description: 'Rich in iron, poor in nitrogen and lime. Found in Deccan Plateau fringes.',
        descriptionHindi: 'लोहे से भरपूर, नाइट्रोजन और चूने की कमी। दक्कन पठार की ढलानों पर।',
        suitableCrops: ['groundnut', 'ragi', 'maize', 'tomato', 'potato', 'millets'],
        specialNotes: 'Responds well to fertilizers. Drip irrigation recommended to prevent erosion.'
    },
    {
        id: 'laterite',
        name: 'Laterite Soil',
        nameHindi: 'लेटराइट मिट्टी',
        nameTranslit: 'Laterite Mitti',
        icon: '🧱',
        waterHoldingCapacity: 'low',
        infiltrationRateMmHr: 40,
        fieldCapacityPct: 18,
        wiltingPointPct: 8,
        typicalDepthCategory: 'shallow',
        typicalDepthCmMin: 30,
        typicalDepthCmMax: 80,
        irrigationFrequency: 'frequent_light',
        irrigationNote: 'Very porous - water drains quickly. Light, frequent irrigation needed.',
        irrigationNoteHindi: 'बहुत छिद्रयुक्त - पानी जल्दी निकल जाता है। हल्की, बार-बार सिंचाई।',
        irrigationNoteTranslit: 'Bahut chhidrayukt - paani jaldi nikal jata hai. Halki, baar-baar sinchai.',
        commonRegions: ['KL', 'KA', 'GA', 'MH', 'OD', 'JH', 'CG', 'AS'],
        description: 'Formed by leaching in high rainfall areas. Iron and aluminum rich.',
        descriptionHindi: 'अधिक वर्षा वाले क्षेत्रों में निक्षालन से बनी। लोहा और एल्युमीनियम युक्त।',
        suitableCrops: ['cashew', 'rubber', 'tea', 'coffee', 'coconut', 'tapioca'],
        specialNotes: 'Low fertility - needs heavy fertilization. Good for plantation crops.'
    },
    {
        id: 'desert',
        name: 'Desert/Arid Soil',
        nameHindi: 'मरुस्थलीय मिट्टी',
        nameTranslit: 'Marusthaliya Mitti / Registani Mitti',
        icon: '🏜️',
        waterHoldingCapacity: 'low',
        infiltrationRateMmHr: 50,
        fieldCapacityPct: 12,
        wiltingPointPct: 4,
        typicalDepthCategory: 'deep',
        typicalDepthCmMin: 100,
        typicalDepthCmMax: 200,
        irrigationFrequency: 'frequent_light',
        irrigationNote: 'Very high drainage - drip irrigation critical. Water evaporates fast.',
        irrigationNoteHindi: 'बहुत तेज जल निकास - ड्रिप सिंचाई ज़रूरी। पानी जल्दी वाष्पित होता है।',
        irrigationNoteTranslit: 'Bahut tez jal nikas - drip sinchai zaroori. Paani jaldi vaashpit hota hai.',
        commonRegions: ['RJ', 'GJ', 'HR', 'PB'],
        description: 'Sandy texture, low organic matter. High evaporation, needs careful water management.',
        descriptionHindi: 'रेतीली बनावट, कम जैविक पदार्थ। उच्च वाष्पीकरण।',
        suitableCrops: ['bajra', 'jowar', 'guar', 'moong', 'sesame', 'cumin'],
        specialNotes: 'Drip irrigation mandatory. Mulching helps retain moisture. Early morning irrigation best.'
    },
    {
        id: 'mountain',
        name: 'Mountain/Hill Soil',
        nameHindi: 'पर्वतीय मिट्टी',
        nameTranslit: 'Pahaadi Mitti',
        icon: '🏔️',
        waterHoldingCapacity: 'medium',
        infiltrationRateMmHr: 30,
        fieldCapacityPct: 28,
        wiltingPointPct: 12,
        typicalDepthCategory: 'shallow',
        typicalDepthCmMin: 20,
        typicalDepthCmMax: 60,
        irrigationFrequency: 'frequent_light',
        irrigationNote: 'Shallow depth - frequent light irrigation. Terrace farming recommended.',
        irrigationNoteHindi: 'कम गहराई - हल्की बार-बार सिंचाई। सीढ़ीदार खेती करें।',
        irrigationNoteTranslit: 'Kam gehrai - halki baar-baar sinchai. Seedhidar kheti karein.',
        commonRegions: ['HP', 'UK', 'JK', 'SK', 'AR', 'NL', 'MZ', 'ML'],
        description: 'Formed from weathered rocks. Rich in organic matter in forest areas.',
        descriptionHindi: 'अपक्षयित चट्टानों से बनी। वन क्षेत्रों में जैविक पदार्थ युक्त।',
        suitableCrops: ['apple', 'tea', 'coffee', 'potato', 'ginger', 'cardamom', 'maize'],
        specialNotes: 'Erosion prone - contour farming essential. Sprinkler irrigation works well.'
    },
    {
        id: 'forest',
        name: 'Forest Soil',
        nameHindi: 'वन मिट्टी',
        nameTranslit: 'Van Mitti',
        icon: '🌲',
        waterHoldingCapacity: 'high',
        infiltrationRateMmHr: 20,
        fieldCapacityPct: 38,
        wiltingPointPct: 18,
        typicalDepthCategory: 'medium',
        typicalDepthCmMin: 50,
        typicalDepthCmMax: 100,
        irrigationFrequency: 'moderate',
        irrigationNote: 'Good organic content. Natural moisture retention. Moderate irrigation.',
        irrigationNoteHindi: 'अच्छी जैविक सामग्री। प्राकृतिक नमी बनाए रखती है। मध्यम सिंचाई।',
        irrigationNoteTranslit: 'Achhi jaivik samagri. Prakritik nami banaye rakhti hai. Madhyam sinchai.',
        commonRegions: ['HP', 'UK', 'JK', 'NE', 'WB', 'OD', 'CG', 'JH'],
        description: 'Rich in humus from decaying vegetation. Acidic in nature.',
        descriptionHindi: 'सड़ी वनस्पतियों से ह्यूमस युक्त। अम्लीय प्रकृति।',
        suitableCrops: ['tea', 'coffee', 'spices', 'fruits', 'vegetables'],
        specialNotes: 'May be acidic - test pH. Excellent for plantation crops and spices.'
    },
    {
        id: 'saline',
        name: 'Saline/Alkaline Soil',
        nameHindi: 'लवणीय/क्षारीय मिट्टी',
        nameTranslit: 'Namkeen Mitti / Usar Mitti',
        icon: '🧂',
        waterHoldingCapacity: 'medium',
        infiltrationRateMmHr: 8,
        fieldCapacityPct: 30,
        wiltingPointPct: 15,
        typicalDepthCategory: 'medium',
        typicalDepthCmMin: 50,
        typicalDepthCmMax: 100,
        irrigationFrequency: 'special',
        irrigationNote: 'Needs leaching irrigation to wash salts. Avoid shallow watering.',
        irrigationNoteHindi: 'नमक धोने के लिए लीचिंग ज़रूरी। उथले पानी से बचें।',
        irrigationNoteTranslit: 'Namak dhone ke liye leaching zaroori. Uthle paani se bachein.',
        commonRegions: ['PB', 'HR', 'UP', 'RJ', 'GJ', 'coastal'],
        description: 'High salt concentration. Common in arid regions and coastal areas.',
        descriptionHindi: 'उच्च नमक सांद्रता। शुष्क और तटीय क्षेत्रों में।',
        suitableCrops: ['bajra', 'barley', 'cotton', 'berseem', 'rice_paddy'],
        specialNotes: 'Salt-tolerant crops only. Deep leaching irrigation in monsoon. Gypsum application helps.'
    }
];

// Irrigation frequency descriptions
export const irrigationFrequencies = {
    deep_infrequent: {
        name: 'Deep Infrequent',
        description: 'Apply larger amounts of water with longer intervals between irrigations',
        intervalDays: '7-10',
        amountMultiplier: 1.3
    },
    moderate: {
        name: 'Moderate',
        description: 'Standard irrigation frequency with medium water amounts',
        intervalDays: '4-6',
        amountMultiplier: 1.0
    },
    moderate_frequent: {
        name: 'Moderate Frequent',
        description: 'More frequent irrigation with moderate water amounts',
        intervalDays: '3-5',
        amountMultiplier: 0.85
    },
    frequent_light: {
        name: 'Frequent Light',
        description: 'Light irrigation at short intervals to maintain moisture',
        intervalDays: '1-3',
        amountMultiplier: 0.5
    },
    special: {
        name: 'Special Management',
        description: 'Requires specialized irrigation approach based on specific conditions',
        intervalDays: 'variable',
        amountMultiplier: 1.0
    }
};

// Helper functions
export function getSoilById(id) {
    return indianSoils.find(s => s.id === id);
}

export function getSoilsByDepthCategory(category) {
    return indianSoils.filter(s => s.typicalDepthCategory === category);
}

export function getSoilsByWaterHoldingCapacity(capacity) {
    return indianSoils.filter(s => s.waterHoldingCapacity === capacity);
}

export function getSoilsForRegion(regionId) {
    return indianSoils.filter(s => s.commonRegions.includes(regionId));
}

// Calculate adjusted irrigation amount based on soil type
export function getIrrigationMultiplier(soilId) {
    const soil = getSoilById(soilId);
    if (!soil) return 1.0;
    const frequency = irrigationFrequencies[soil.irrigationFrequency];
    return frequency ? frequency.amountMultiplier : 1.0;
}

export default indianSoils;
