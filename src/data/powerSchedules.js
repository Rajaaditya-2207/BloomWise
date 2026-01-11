/**
 * Indian Power Schedules Database
 * State-wise agricultural electricity patterns
 * Critical for scheduling irrigation in rural India
 */

export const powerSchedules = {
    // Gujarat - Jyotigram Yojana (24x7 domestic, 8hr agri)
    GJ: {
        name: 'Gujarat',
        scheduleType: 'fixed',
        hoursPerDay: 8,
        slots: [
            { start: '22:00', end: '06:00', type: 'night' }
        ],
        peakLoadRestricted: true,
        scheme: 'Jyotigram Yojana',
        notes: 'Agricultural feeders separated from domestic. Night supply only (10 PM - 6 AM).',
        notesHindi: 'कृषि फीडर अलग। रात को ही बिजली मिलती है (10 बजे रात - 6 बजे सुबह)।',
        notesTranslit: 'Krishi feeder alag. Raat ko hi bijli milti hai (10 baje raat - 6 baje subah).',
        reliability: 'high'
    },

    // Punjab - High consumption state
    PB: {
        name: 'Punjab',
        scheduleType: 'fixed',
        hoursPerDay: 8,
        slots: [
            { start: '21:00', end: '05:00', type: 'night' }
        ],
        peakLoadRestricted: true,
        scheme: 'PSPCL Agricultural',
        notes: 'Free power for farmers. Night supply 9 PM to 5 AM. Extended during peak paddy season.',
        notesHindi: 'किसानों को मुफ्त बिजली। रात 9 बजे से सुबह 5 बजे तक।',
        notesTranslit: 'Kisaano ko muft bijli. Raat 9 baje se subah 5 baje tak.',
        reliability: 'high'
    },

    // Haryana
    HR: {
        name: 'Haryana',
        scheduleType: 'fixed',
        hoursPerDay: 7,
        slots: [
            { start: '22:00', end: '05:00', type: 'night' }
        ],
        peakLoadRestricted: true,
        scheme: 'UHBVN/DHBVN',
        notes: 'Night supply for tube wells. 7-8 hours typically. Schedule varies by season.',
        notesHindi: 'ट्यूबवेल के लिए रात की बिजली। 7-8 घंटे।',
        notesTranslit: 'Tubewell ke liye raat ki bijli. 7-8 ghante.',
        reliability: 'medium'
    },

    // Rajasthan
    RJ: {
        name: 'Rajasthan',
        scheduleType: 'rotating',
        hoursPerDay: 6,
        slots: [
            { start: '20:00', end: '02:00', type: 'night' },
            { start: '05:00', end: '08:00', type: 'morning' }
        ],
        peakLoadRestricted: true,
        scheme: 'RRVPNL',
        notes: 'Split supply - evening/night + early morning. Varies by district.',
        notesHindi: 'बंटी हुई बिजली - शाम/रात + सुबह। जिले के अनुसार बदलती है।',
        notesTranslit: 'Banti hui bijli - shaam/raat + subah. Jile ke anusaar badalti hai.',
        reliability: 'medium'
    },

    // Uttar Pradesh
    UP: {
        name: 'Uttar Pradesh',
        scheduleType: 'rotating',
        hoursPerDay: 8,
        slots: [
            { start: '06:00', end: '10:00', type: 'morning' },
            { start: '18:00', end: '22:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'UPPCL',
        notes: 'Split supply - morning and evening. Western UP has better supply than Eastern UP.',
        notesHindi: 'सुबह और शाम की बिजली। पश्चिमी UP में बेहतर आपूर्ति।',
        notesTranslit: 'Subah aur shaam ki bijli. Paschimi UP mein behtar aapurti.',
        reliability: 'medium'
    },

    // Maharashtra
    MH: {
        name: 'Maharashtra',
        scheduleType: 'rotating',
        hoursPerDay: 10,
        slots: [
            { start: '06:00', end: '10:00', type: 'morning' },
            { start: '18:00', end: '24:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'MSEDCL',
        notes: '8-10 hours in two slots. Better supply in irrigated regions like Vidarbha.',
        notesHindi: 'दो स्लॉट में 8-10 घंटे। विदर्भ जैसे क्षेत्रों में बेहतर।',
        notesTranslit: 'Do slot mein 8-10 ghante. Vidarbha jaise kshetron mein behtar.',
        reliability: 'high'
    },

    // Madhya Pradesh
    MP: {
        name: 'Madhya Pradesh',
        scheduleType: 'rotating',
        hoursPerDay: 8,
        slots: [
            { start: '05:00', end: '09:00', type: 'morning' },
            { start: '17:00', end: '21:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'MPMKVVCL',
        notes: 'Morning and evening supply. Better during Rabi season.',
        notesHindi: 'सुबह और शाम की बिजली। रबी सीज़न में बेहतर।',
        notesTranslit: 'Subah aur shaam ki bijli. Rabi season mein behtar.',
        reliability: 'medium'
    },

    // Andhra Pradesh
    AP: {
        name: 'Andhra Pradesh',
        scheduleType: 'fixed',
        hoursPerDay: 9,
        slots: [
            { start: '06:00', end: '09:00', type: 'morning' },
            { start: '18:00', end: '24:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'APSPDCL/APEPDCL',
        notes: 'Free power for farmers. 9-hour supply with focus on non-peak hours.',
        notesHindi: 'किसानों को मुफ्त बिजली। 9 घंटे की आपूर्ति।',
        notesTranslit: 'Kisaano ko muft bijli. 9 ghante ki aapurti.',
        reliability: 'high'
    },

    // Telangana
    TS: {
        name: 'Telangana',
        scheduleType: 'fixed',
        hoursPerDay: 9,
        slots: [
            { start: '05:00', end: '09:00', type: 'morning' },
            { start: '17:00', end: '22:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'TSSPDCL/TSNPDCL',
        notes: 'Free 24x7 power goal. Currently 9 hours in two slots.',
        notesHindi: '24x7 मुफ्त बिजली का लक्ष्य। अभी 9 घंटे।',
        notesTranslit: '24x7 muft bijli ka lakshya. Abhi 9 ghante.',
        reliability: 'high'
    },

    // Karnataka
    KA: {
        name: 'Karnataka',
        scheduleType: 'rotating',
        hoursPerDay: 7,
        slots: [
            { start: '06:00', end: '10:00', type: 'morning' },
            { start: '18:00', end: '21:00', type: 'evening' }
        ],
        peakLoadRestricted: true,
        scheme: 'BESCOM/HESCOM',
        notes: 'Variable by district. North Karnataka has power issues during summer.',
        notesHindi: 'जिले के अनुसार बदलती है। गर्मियों में उत्तर कर्नाटक में समस्या।',
        notesTranslit: 'Jile ke anusaar badalti hai. Garmiyon mein uttar Karnataka mein samasya.',
        reliability: 'medium'
    },

    // Tamil Nadu
    TN: {
        name: 'Tamil Nadu',
        scheduleType: 'fixed',
        hoursPerDay: 9,
        slots: [
            { start: '22:00', end: '06:00', type: 'night' },
            { start: '10:00', end: '13:00', type: 'midday' }
        ],
        peakLoadRestricted: true,
        scheme: 'TANGEDCO',
        notes: 'Free power for farmers. Night supply preferred. Midday slot in some areas.',
        notesHindi: 'किसानों को मुफ्त बिजली। रात की सप्लाई।',
        notesTranslit: 'Kisaano ko muft bijli. Raat ki supply.',
        reliability: 'high'
    },

    // Kerala
    KL: {
        name: 'Kerala',
        scheduleType: 'fixed',
        hoursPerDay: 12,
        slots: [
            { start: '06:00', end: '18:00', type: 'day' }
        ],
        peakLoadRestricted: false,
        scheme: 'KSEB',
        notes: 'Better power situation. 12+ hours common. Rarely affected by load shedding.',
        notesHindi: 'बेहतर बिजली स्थिति। 12+ घंटे आम।',
        notesTranslit: 'Behtar bijli sthiti. 12+ ghante aam.',
        reliability: 'high'
    },

    // West Bengal
    WB: {
        name: 'West Bengal',
        scheduleType: 'rotating',
        hoursPerDay: 8,
        slots: [
            { start: '06:00', end: '10:00', type: 'morning' },
            { start: '16:00', end: '20:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'WBSEDCL',
        notes: 'Fair supply in agricultural areas. Gangetic plains better than hilly regions.',
        notesHindi: 'कृषि क्षेत्रों में अच्छी आपूर्ति। मैदानी इलाकों में बेहतर।',
        notesTranslit: 'Krishi kshetron mein achhi aapurti. Maidani ilakon mein behtar.',
        reliability: 'medium'
    },

    // Bihar
    BR: {
        name: 'Bihar',
        scheduleType: 'unreliable',
        hoursPerDay: 6,
        slots: [
            { start: '18:00', end: '24:00', type: 'evening' }
        ],
        peakLoadRestricted: true,
        scheme: 'BSPHCL',
        notes: 'Unreliable supply. Diesel pump backup often needed. Improving gradually.',
        notesHindi: 'अविश्वसनीय आपूर्ति। डीजल पंप बैकअप अक्सर चाहिए।',
        notesTranslit: 'Avishwasniya aapurti. Diesel pump backup aksar chahiye.',
        reliability: 'low'
    },

    // Odisha
    OD: {
        name: 'Odisha',
        scheduleType: 'rotating',
        hoursPerDay: 7,
        slots: [
            { start: '06:00', end: '09:00', type: 'morning' },
            { start: '17:00', end: '21:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'TPCODL/TPSODL',
        notes: 'Improving power situation. 7-8 hours typical in rural areas.',
        notesHindi: 'सुधरती बिजली स्थिति। ग्रामीण क्षेत्रों में 7-8 घंटे।',
        notesTranslit: 'Sudharti bijli sthiti. Gramin kshetron mein 7-8 ghante.',
        reliability: 'medium'
    },

    // Chhattisgarh
    CG: {
        name: 'Chhattisgarh',
        scheduleType: 'fixed',
        hoursPerDay: 10,
        slots: [
            { start: '05:00', end: '10:00', type: 'morning' },
            { start: '17:00', end: '22:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'CSPDCL',
        notes: 'Good power situation due to thermal plants. 10+ hours common.',
        notesHindi: 'थर्मल प्लांट्स से अच्छी बिजली। 10+ घंटे आम।',
        notesTranslit: 'Thermal plants se achhi bijli. 10+ ghante aam.',
        reliability: 'high'
    },

    // Jharkhand
    JH: {
        name: 'Jharkhand',
        scheduleType: 'rotating',
        hoursPerDay: 6,
        slots: [
            { start: '17:00', end: '23:00', type: 'evening' }
        ],
        peakLoadRestricted: true,
        scheme: 'JBVNL',
        notes: 'Variable supply. Better near mining areas. Diesel backup recommended.',
        notesHindi: 'परिवर्तनशील आपूर्ति। खनन क्षेत्रों के पास बेहतर।',
        notesTranslit: 'Parivartnashil aapurti. Khanan kshetron ke paas behtar.',
        reliability: 'low'
    },

    // Assam
    AS: {
        name: 'Assam',
        scheduleType: 'rotating',
        hoursPerDay: 6,
        slots: [
            { start: '06:00', end: '09:00', type: 'morning' },
            { start: '17:00', end: '20:00', type: 'evening' }
        ],
        peakLoadRestricted: true,
        scheme: 'APDCL',
        notes: 'Limited agricultural power. Tea estates have better supply.',
        notesHindi: 'सीमित कृषि बिजली। चाय बागानों में बेहतर।',
        notesTranslit: 'Seemit krishi bijli. Chai bagaanon mein behtar.',
        reliability: 'medium'
    },

    // Default for other states/UTs
    DEFAULT: {
        name: 'Other Regions',
        scheduleType: 'variable',
        hoursPerDay: 8,
        slots: [
            { start: '06:00', end: '10:00', type: 'morning' },
            { start: '18:00', end: '22:00', type: 'evening' }
        ],
        peakLoadRestricted: false,
        scheme: 'State DISCOM',
        notes: 'Variable supply. Check with local electricity office for schedule.',
        notesHindi: 'परिवर्तनशील आपूर्ति। स्थानीय बिजली कार्यालय से पूछें।',
        notesTranslit: 'Parivartnashil aapurti. Sthaniya bijli karyalaya se poochhein.',
        reliability: 'medium'
    }
};

// Helper functions
export function getPowerSchedule(regionId) {
    return powerSchedules[regionId] || powerSchedules.DEFAULT;
}

export function getCurrentPowerStatus(regionId) {
    const schedule = getPowerSchedule(regionId);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const slot of schedule.slots) {
        if (isTimeInSlot(currentTime, slot.start, slot.end)) {
            return {
                available: true,
                slot: slot,
                schedule: schedule
            };
        }
    }

    // Find next available slot
    const nextSlot = findNextSlot(schedule.slots, currentTime);
    return {
        available: false,
        nextSlot: nextSlot,
        schedule: schedule
    };
}

function isTimeInSlot(current, start, end) {
    if (start <= end) {
        return current >= start && current < end;
    } else {
        // Overnight slot (e.g., 22:00 to 06:00)
        return current >= start || current < end;
    }
}

function findNextSlot(slots, currentTime) {
    // Sort slots by start time
    const sortedSlots = [...slots].sort((a, b) => a.start.localeCompare(b.start));

    // Find next slot
    for (const slot of sortedSlots) {
        if (slot.start > currentTime) {
            return slot;
        }
    }

    // If no slot found today, return first slot of tomorrow
    return sortedSlots[0];
}

export function formatTimeSlot(slot) {
    return `${slot.start} - ${slot.end}`;
}

export function getTimeUntilNextSlot(regionId) {
    const status = getCurrentPowerStatus(regionId);
    if (status.available) {
        return 0; // Power is currently available
    }

    const now = new Date();
    const [hours, mins] = status.nextSlot.start.split(':').map(Number);

    let nextTime = new Date(now);
    nextTime.setHours(hours, mins, 0, 0);

    // If next slot is tomorrow
    if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
    }

    return Math.round((nextTime - now) / 60000); // Return minutes until next slot
}

export default powerSchedules;
