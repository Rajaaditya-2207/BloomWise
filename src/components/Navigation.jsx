import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../App';

import { HomeIcon, AgentIcon, SignalIcon, ReportIcon, SettingsIcon } from './Icons';

function Navigation({ isPreviewMode = false }) {
    const { t } = useLanguage();
    const location = useLocation();

    // Determine base path for preview mode
    const basePath = isPreviewMode ? '/preview' : '';

    const navItems = [
        // Home logic: In preview, use /preview/home. In user mode, use /home (since / is now welcome)
        {
            path: isPreviewMode ? '/preview/home' : '/home',
            actualPath: isPreviewMode ? '/preview/home' : '/home',
            icon: HomeIcon,
            label: t('nav_home'),
            isHome: true
        },
        { path: `${basePath}/chat`, actualPath: `${basePath}/chat`, icon: AgentIcon, label: t('nav_chat') },
        { path: `${basePath}/simulate`, actualPath: `${basePath}/simulate`, icon: SignalIcon, label: t('nav_simulate') || 'Simulate' },
        { path: `${basePath}/report`, actualPath: `${basePath}/report`, icon: ReportIcon, label: t('nav_report') },
        { path: `${basePath}/settings`, actualPath: `${basePath}/settings`, icon: SettingsIcon, label: t('nav_settings') }
    ];

    // Custom active check - exact match required
    const isItemActive = (itemPath, isHome = false) => {
        const currentPath = location.pathname;

        if (isHome) {
            // Home active if exact match
            return currentPath === itemPath;
        }

        // Other items active if path starts with itemPath (e.g. /preview/report/analytics active for Report tab)
        return currentPath.startsWith(itemPath);
    };

    return (
        <nav className="icon-nav" role="navigation" aria-label="Main navigation">
            {navItems.map(item => {
                const IconComponent = item.icon;
                const active = isItemActive(item.actualPath, item.isHome);
                return (
                    <Link
                        key={item.path}
                        to={item.actualPath}
                        className={`icon-nav-item ${active ? 'active' : ''}`}
                        aria-label={item.label}
                    >
                        <span className="icon" aria-hidden="true">
                            <IconComponent filled={active && item.icon === SignalIcon} />
                        </span>
                        <span className="label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export default Navigation;
