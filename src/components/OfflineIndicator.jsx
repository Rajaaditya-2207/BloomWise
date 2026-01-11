import React from 'react';
import { useLanguage } from '../App';

function OfflineIndicator() {
    const { t } = useLanguage();

    return (
        <div className="offline-banner" role="alert">
            <span className="offline-icon">📴</span>
            <span>{t('offline_mode')}</span>
        </div>
    );
}

export default OfflineIndicator;
