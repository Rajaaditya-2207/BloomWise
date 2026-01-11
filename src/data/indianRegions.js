/**
 * Indian Regions Data
 * 28 States + 8 Union Territories
 * Includes Hindi names, transliteration, climate zones, and monsoon windows
 */

export const indianRegions = [
    // ===================== STATES =====================
    {
        id: 'AP',
        name: 'Andhra Pradesh',
        nameHindi: 'आंध्र प्रदेश',
        nameTranslit: 'Andhra Pradesh',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 940,
        monsoonStart: 6, // June
        monsoonEnd: 10,  // October
        majorDistricts: ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa']
    },
    {
        id: 'AR',
        name: 'Arunachal Pradesh',
        nameHindi: 'अरुणाचल प्रदेश',
        nameTranslit: 'Arunachal Pradesh',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 2782,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['Itanagar', 'Tawang', 'West Kameng', 'Papum Pare', 'Lower Subansiri', 'Changlang']
    },
    {
        id: 'AS',
        name: 'Assam',
        nameHindi: 'असम',
        nameTranslit: 'Assam',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 2818,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['Guwahati', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Silchar', 'Tezpur', 'Tinsukia', 'Barpeta', 'Karimganj', 'Goalpara']
    },
    {
        id: 'BR',
        name: 'Bihar',
        nameHindi: 'बिहार',
        nameTranslit: 'Bihar',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 1326,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Begusarai', 'Chapra', 'Munger', 'Araria', 'Samastipur', 'Nalanda']
    },
    {
        id: 'CG',
        name: 'Chhattisgarh',
        nameHindi: 'छत्तीसगढ़',
        nameTranslit: 'Chhattisgarh',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1292,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Raipur', 'Bilaspur', 'Durg', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur']
    },
    {
        id: 'GA',
        name: 'Goa',
        nameHindi: 'गोवा',
        nameTranslit: 'Goa',
        type: 'state',
        climateZone: 'tropical_monsoon',
        avgRainfallMm: 2932,
        monsoonStart: 6,
        monsoonEnd: 9,
        majorDistricts: ['North Goa', 'South Goa']
    },
    {
        id: 'GJ',
        name: 'Gujarat',
        nameHindi: 'गुजरात',
        nameTranslit: 'Gujarat',
        type: 'state',
        climateZone: 'semi_arid',
        avgRainfallMm: 803,
        monsoonStart: 6,
        monsoonEnd: 9,
        majorDistricts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Kutch', 'Mehsana', 'Anand', 'Kheda', 'Bharuch', 'Morbi']
    },
    {
        id: 'HR',
        name: 'Haryana',
        nameHindi: 'हरियाणा',
        nameTranslit: 'Haryana',
        type: 'state',
        climateZone: 'semi_arid',
        avgRainfallMm: 617,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Jhajjar', 'Sirsa', 'Jind', 'Kurukshetra']
    },
    {
        id: 'HP',
        name: 'Himachal Pradesh',
        nameHindi: 'हिमाचल प्रदेश',
        nameTranslit: 'Himachal Pradesh',
        type: 'state',
        climateZone: 'alpine',
        avgRainfallMm: 1469,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Shimla', 'Kangra', 'Mandi', 'Solan', 'Hamirpur', 'Una', 'Kullu', 'Sirmaur', 'Bilaspur', 'Chamba']
    },
    {
        id: 'JH',
        name: 'Jharkhand',
        nameHindi: 'झारखंड',
        nameTranslit: 'Jharkhand',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1430,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Dumka', 'Ramgarh']
    },
    {
        id: 'KA',
        name: 'Karnataka',
        nameHindi: 'कर्नाटक',
        nameTranslit: 'Karnataka',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1355,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubli-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Davangere', 'Tumakuru', 'Shivamogga', 'Udupi', 'Hassan', 'Mandya', 'Raichur']
    },
    {
        id: 'KL',
        name: 'Kerala',
        nameHindi: 'केरल',
        nameTranslit: 'Kerala',
        type: 'state',
        climateZone: 'tropical_monsoon',
        avgRainfallMm: 3055,
        monsoonStart: 6,
        monsoonEnd: 11,
        majorDistricts: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Malappuram', 'Kottayam', 'Idukki', 'Pathanamthitta', 'Wayanad', 'Kasaragod']
    },
    {
        id: 'MP',
        name: 'Madhya Pradesh',
        nameHindi: 'मध्य प्रदेश',
        nameTranslit: 'Madhya Pradesh',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1160,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Chhindwara', 'Hoshangabad', 'Vidisha', 'Khargone']
    },
    {
        id: 'MH',
        name: 'Maharashtra',
        nameHindi: 'महाराष्ट्र',
        nameTranslit: 'Maharashtra',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1438,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Ahmednagar', 'Latur', 'Satara', 'Ratnagiri', 'Beed', 'Osmanabad', 'Wardha', 'Yavatmal']
    },
    {
        id: 'MN',
        name: 'Manipur',
        nameHindi: 'मणिपुर',
        nameTranslit: 'Manipur',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 1467,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['Imphal East', 'Imphal West', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul']
    },
    {
        id: 'ML',
        name: 'Meghalaya',
        nameHindi: 'मेघालय',
        nameTranslit: 'Meghalaya',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 2818,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['East Khasi Hills', 'West Khasi Hills', 'Jaintia Hills', 'West Garo Hills', 'East Garo Hills', 'Ri-Bhoi']
    },
    {
        id: 'MZ',
        name: 'Mizoram',
        nameHindi: 'मिज़ोरम',
        nameTranslit: 'Mizoram',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 2350,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Mamit', 'Saiha']
    },
    {
        id: 'NL',
        name: 'Nagaland',
        nameHindi: 'नागालैंड',
        nameTranslit: 'Nagaland',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 1800,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto', 'Phek']
    },
    {
        id: 'OD',
        name: 'Odisha',
        nameHindi: 'ओडिशा',
        nameTranslit: 'Odisha',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1489,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Rourkela', 'Sambalpur', 'Balasore', 'Bhadrak', 'Puri', 'Mayurbhanj', 'Ganjam', 'Khordha', 'Jajpur', 'Kendrapara']
    },
    {
        id: 'PB',
        name: 'Punjab',
        nameHindi: 'पंजाब',
        nameTranslit: 'Punjab',
        type: 'state',
        climateZone: 'semi_arid',
        avgRainfallMm: 649,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot', 'Moga', 'Sangrur', 'Firozpur', 'Gurdaspur', 'Kapurthala', 'Faridkot', 'Muktsar']
    },
    {
        id: 'RJ',
        name: 'Rajasthan',
        nameHindi: 'राजस्थान',
        nameTranslit: 'Rajasthan',
        type: 'state',
        climateZone: 'arid',
        avgRainfallMm: 531,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Nagaur', 'Chittorgarh', 'Jhunjhunu', 'Ganganagar', 'Barmer', 'Jaisalmer', 'Tonk']
    },
    {
        id: 'SK',
        name: 'Sikkim',
        nameHindi: 'सिक्किम',
        nameTranslit: 'Sikkim',
        type: 'state',
        climateZone: 'alpine',
        avgRainfallMm: 2739,
        monsoonStart: 6,
        monsoonEnd: 9,
        majorDistricts: ['East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim']
    },
    {
        id: 'TN',
        name: 'Tamil Nadu',
        nameHindi: 'तमिलनाडु',
        nameTranslit: 'Tamil Nadu',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 998,
        monsoonStart: 10, // Northeast monsoon
        monsoonEnd: 12,
        majorDistricts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thanjavur', 'Dindigul', 'Kanchipuram', 'Cuddalore', 'Karur', 'Thoothukudi']
    },
    {
        id: 'TS',
        name: 'Telangana',
        nameHindi: 'तेलंगाना',
        nameTranslit: 'Telangana',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 906,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Hyderabad', 'Rangareddy', 'Warangal', 'Khammam', 'Karimnagar', 'Nizamabad', 'Nalgonda', 'Mahbubnagar', 'Adilabad', 'Medak', 'Sangareddy']
    },
    {
        id: 'TR',
        name: 'Tripura',
        nameHindi: 'त्रिपुरा',
        nameTranslit: 'Tripura',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 2150,
        monsoonStart: 5,
        monsoonEnd: 10,
        majorDistricts: ['West Tripura', 'South Tripura', 'North Tripura', 'Dhalai', 'Khowai', 'Sipahijala', 'Gomati', 'Unakoti']
    },
    {
        id: 'UP',
        name: 'Uttar Pradesh',
        nameHindi: 'उत्तर प्रदेश',
        nameTranslit: 'Uttar Pradesh',
        type: 'state',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 990,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Budaun', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Ayodhya', 'Sultanpur', 'Barabanki', 'Unnao', 'Rae Bareli', 'Sitapur', 'Hardoi', 'Lakhimpur Kheri', 'Bahraich', 'Gonda', 'Basti', 'Deoria', 'Azamgarh', 'Jaunpur', 'Mirzapur', 'Sonbhadra', 'Chandauli', 'Ghazipur', 'Ballia', 'Mau', 'Bhadohi', 'Pratapgarh', 'Kaushambi', 'Fatehpur', 'Banda', 'Chitrakoot', 'Hamirpur', 'Mahoba', 'Lalitpur', 'Etawah', 'Auraiya', 'Mainpuri', 'Kannauj', 'Etah', 'Kasganj', 'Hathras', 'Sambhal', 'Amroha', 'Bijnor', 'Pilibhit', 'Kheri', 'Gautam Buddh Nagar', 'Bulandshahr', 'Hapur', 'Baghpat', 'Shamli']
    },
    {
        id: 'UK',
        name: 'Uttarakhand',
        nameHindi: 'उत्तराखंड',
        nameTranslit: 'Uttarakhand',
        type: 'state',
        climateZone: 'alpine',
        avgRainfallMm: 1554,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Almora', 'Pithoragarh', 'Tehri Garhwal', 'Pauri Garhwal', 'Chamoli', 'Uttarkashi', 'Rudraprayag', 'Champawat', 'Bageshwar']
    },
    {
        id: 'WB',
        name: 'West Bengal',
        nameHindi: 'पश्चिम बंगाल',
        nameTranslit: 'Paschim Bangal',
        type: 'state',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1750,
        monsoonStart: 6,
        monsoonEnd: 10,
        majorDistricts: ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Hooghly', 'Nadia', 'Murshidabad', 'Bardhaman', 'Malda', 'Jalpaiguri', 'Cooch Behar', 'Darjeeling', 'Birbhum', 'Bankura', 'Purulia', 'Midnapore']
    },

    // ===================== UNION TERRITORIES =====================
    {
        id: 'AN',
        name: 'Andaman and Nicobar Islands',
        nameHindi: 'अंडमान और निकोबार द्वीप समूह',
        nameTranslit: 'Andaman aur Nicobar',
        type: 'ut',
        climateZone: 'tropical_monsoon',
        avgRainfallMm: 3000,
        monsoonStart: 5,
        monsoonEnd: 12,
        majorDistricts: ['South Andaman', 'North & Middle Andaman', 'Nicobar']
    },
    {
        id: 'CH',
        name: 'Chandigarh',
        nameHindi: 'चंडीगढ़',
        nameTranslit: 'Chandigarh',
        type: 'ut',
        climateZone: 'humid_subtropical',
        avgRainfallMm: 1110,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Chandigarh']
    },
    {
        id: 'DN',
        name: 'Dadra and Nagar Haveli and Daman and Diu',
        nameHindi: 'दादरा और नगर हवेली और दमन और दीव',
        nameTranslit: 'Dadra Nagar Haveli aur Daman Diu',
        type: 'ut',
        climateZone: 'tropical_monsoon',
        avgRainfallMm: 2500,
        monsoonStart: 6,
        monsoonEnd: 9,
        majorDistricts: ['Dadra and Nagar Haveli', 'Daman', 'Diu']
    },
    {
        id: 'DL',
        name: 'Delhi',
        nameHindi: 'दिल्ली',
        nameTranslit: 'Delhi',
        type: 'ut',
        climateZone: 'semi_arid',
        avgRainfallMm: 797,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Central Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara']
    },
    {
        id: 'JK',
        name: 'Jammu and Kashmir',
        nameHindi: 'जम्मू और कश्मीर',
        nameTranslit: 'Jammu Kashmir',
        type: 'ut',
        climateZone: 'alpine',
        avgRainfallMm: 1100,
        monsoonStart: 7,
        monsoonEnd: 9,
        majorDistricts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Doda', 'Rajouri', 'Poonch', 'Kupwara', 'Pulwama', 'Kulgam', 'Ganderbal', 'Bandipora', 'Shopian', 'Budgam', 'Ramban', 'Reasi', 'Samba', 'Kishtwar']
    },
    {
        id: 'LA',
        name: 'Ladakh',
        nameHindi: 'लद्दाख',
        nameTranslit: 'Ladakh',
        type: 'ut',
        climateZone: 'cold_desert',
        avgRainfallMm: 102,
        monsoonStart: 7,
        monsoonEnd: 8,
        majorDistricts: ['Leh', 'Kargil']
    },
    {
        id: 'LD',
        name: 'Lakshadweep',
        nameHindi: 'लक्षद्वीप',
        nameTranslit: 'Lakshadweep',
        type: 'ut',
        climateZone: 'tropical_monsoon',
        avgRainfallMm: 1600,
        monsoonStart: 6,
        monsoonEnd: 9,
        majorDistricts: ['Lakshadweep']
    },
    {
        id: 'PY',
        name: 'Puducherry',
        nameHindi: 'पुडुचेरी',
        nameTranslit: 'Puducherry',
        type: 'ut',
        climateZone: 'tropical_wet_dry',
        avgRainfallMm: 1276,
        monsoonStart: 10,
        monsoonEnd: 12,
        majorDistricts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
    }
];

// Group regions by type
export const states = indianRegions.filter(r => r.type === 'state');
export const unionTerritories = indianRegions.filter(r => r.type === 'ut');

// Climate zone descriptions
export const climateZones = {
    tropical_monsoon: {
        name: 'Tropical Monsoon',
        nameHindi: 'उष्णकटिबंधीय मानसून',
        description: 'Heavy monsoon rains, high humidity',
        irrigationNote: 'Use rain gauge, avoid waterlogging'
    },
    tropical_wet_dry: {
        name: 'Tropical Wet & Dry',
        nameHindi: 'उष्णकटिबंधीय आर्द्र एवं शुष्क',
        description: 'Distinct wet and dry seasons',
        irrigationNote: 'Conserve water during dry season'
    },
    humid_subtropical: {
        name: 'Humid Subtropical',
        nameHindi: 'आर्द्र उपोष्णकटिबंधीय',
        description: 'Hot summers, mild winters',
        irrigationNote: 'Monitor soil moisture carefully'
    },
    semi_arid: {
        name: 'Semi-Arid',
        nameHindi: 'अर्ध-शुष्क',
        description: 'Low rainfall, hot summers',
        irrigationNote: 'Drip irrigation recommended'
    },
    arid: {
        name: 'Arid / Desert',
        nameHindi: 'शुष्क / मरुस्थलीय',
        description: 'Very low rainfall, extreme heat',
        irrigationNote: 'Critical water management needed'
    },
    alpine: {
        name: 'Alpine / Mountain',
        nameHindi: 'पर्वतीय',
        description: 'Cool climate, variable rainfall',
        irrigationNote: 'Sprinkler or furrow irrigation'
    },
    cold_desert: {
        name: 'Cold Desert',
        nameHindi: 'ठंडा मरुस्थल',
        description: 'Very low rainfall, cold winters',
        irrigationNote: 'Snowmelt fed systems common'
    }
};

// Helper function to get region by ID
export function getRegionById(id) {
    return indianRegions.find(r => r.id === id);
}

// Helper function to get districts for a region
export function getDistrictsByRegion(regionId) {
    const region = getRegionById(regionId);
    return region ? region.majorDistricts : [];
}

// Helper function to check if monsoon is active
export function isMonsonActive(regionId, month = new Date().getMonth() + 1) {
    const region = getRegionById(regionId);
    if (!region) return false;
    return month >= region.monsoonStart && month <= region.monsoonEnd;
}

export default indianRegions;
