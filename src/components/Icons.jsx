import React from 'react';

// Common props: filled (boolean), className (string), size (number/string)
const IconBase = ({ children, filled, className = '', size = 24, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        {children}
    </svg>
);

export const HomeIcon = (props) => (
    <IconBase {...props}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
    </IconBase>
);

// Project Logo: Agent (ADK Icon) + Water Drop near the hand (>)
export const ProjectLogo = (props) => (
    <IconBase {...props}>
        {/* Agent Head (Pill) - Shifted left */}
        <rect x="2" y="4" width="16" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="8" r="1.5" stroke="none" fill="currentColor" />
        <circle cx="13" cy="8" r="1.5" stroke="none" fill="currentColor" />

        {/* Left Bracket */}
        <path d="M4 16v2a2 2 0 0 0 2 2h1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

        {/* Right Bracket (>) - The "Hand" */}
        <polyline points="13 16 16 19 13 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Water Drop - On the right side, near the bracket */}
        <path d="M20 15c0 0-2.5 2.5-2.5 4a2.5 2.5 0 0 0 5 0c0-1.5-2.5-4-2.5-4z" fill="currentColor" stroke="none" />
    </IconBase>
);

// Google AI / Gemini Sparkle
// Google AI / Agent Logo
export const AgentIcon = (props) => (
    <IconBase {...props}>
        {/* Head: Pill/Stadium shape */}
        <rect x="2" y="4" width="20" height="10" rx="5" />
        {/* Eyes */}
        <circle cx="8" cy="9" r="1.5" stroke="none" fill="currentColor" />
        <circle cx="16" cy="9" r="1.5" stroke="none" fill="currentColor" />
        {/* Bottom Left: Bracket-like shape */}
        <path d="M5 18v2a2 2 0 0 0 2 2h2" />
        {/* Bottom Right: Angle bracket */}
        <polyline points="15 18 19 21 15 24" />
    </IconBase>
);

export const SignalIcon = (props) => (
    <IconBase {...props}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </IconBase>
);

export const SettingsIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </IconBase>
);

export const ReportIcon = (props) => (
    <IconBase {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </IconBase>
);

export const WaterIcon = (props) => (
    <IconBase {...props}>
        <path d="M12 2.69l5.74 5.82a8.009 8.009 0 0 1 1.45 9.68 8.03 8.03 0 0 1-14.39 0 8.019 8.019 0 0 1 1.45-9.68L12 2.69z" />
    </IconBase>
);

export const SunIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </IconBase>
);

export const CloudRainIcon = (props) => (
    <IconBase {...props}>
        <line x1="16" y1="13" x2="16" y2="21" />
        <line x1="8" y1="13" x2="8" y2="21" />
        <line x1="12" y1="15" x2="12" y2="23" />
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </IconBase>
);

export const ThermometerIcon = (props) => (
    <IconBase {...props}>
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </IconBase>
);

export const PlantIcon = (props) => (
    <IconBase {...props}>
        <path d="M10 22v-8" />
        <path d="M22 22v-3" />
        <path d="M2 22v-2" />
        <path d="M17 19h5" />
        <path d="M2 19h5" />
        <path d="M2 12c-4 5 7 7 11.07 0 .1-.14.2-.28.31-.42" />
        <path d="M13.43 8.35c.14.8-.46 1.4-1.21 2.22" />
        <path d="M16 11c1-4 6-2 6 4" />
        <path d="M2 5c6-6 10 2 10 7" />
    </IconBase>
);

export const PowerIcon = (props) => (
    <IconBase {...props}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </IconBase>
);

export const ChatIcon = (props) => (
    <IconBase {...props}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </IconBase>
);

export const ChartIcon = (props) => (
    <IconBase {...props}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </IconBase>
);

export const MoneyIcon = (props) => (
    <IconBase {...props}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </IconBase>
);

export const PauseIcon = (props) => (
    <IconBase {...props}>
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </IconBase>
);

export const TrendingDownIcon = (props) => (
    <IconBase {...props}>
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </IconBase>
);

export const StopIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </IconBase>
);

export const RefreshIcon = (props) => (
    <IconBase {...props}>
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </IconBase>
);

export const ArrowLeftIcon = (props) => (
    <IconBase {...props}>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </IconBase>
);

export const InfoIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </IconBase>
);

export const CheckCircleIcon = (props) => (
    <IconBase {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </IconBase>
);

export const AlertTriangleIcon = (props) => (
    <IconBase {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </IconBase>
);

export const UserIcon = (props) => (
    <IconBase {...props}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </IconBase>
);

export const MoonIcon = (props) => (
    <IconBase {...props}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </IconBase>
);

export const GlobeIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </IconBase>
);

export const DatabaseIcon = (props) => (
    <IconBase {...props}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5" />
    </IconBase>
);

export const PaletteIcon = (props) => (
    <IconBase {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.25 0 2.25-2 2.25-2 0-.55-.45-1-1-1-.55 0-1-.45-1-1 0-1.1.9-2 2-2 1.66 0 3 1.34 3 3 0 .74-.2 1.44-.55 2.05C18.66 21 20 19.5 20 17c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 1.66 1.34 3 3 3 .55 0 1-.45 1-1 0-2.76-2.24-5-5-5-2.21 0-4 2.24-4 5s1.79 5 4 5c2.76 0 5-2.24 5-5 0-2.76-2.24-5-5-5z" />
        {/* Simplified palette path, actually let's use a standard one. Above is bad. */}
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.5-.3A6 6 0 0 0 21 13c0-2.7-1.7-5-4.2-5.8-.5-.2-1 .3-1 .8 0 .6-.4 1-1 1s-1-.4-1-1c0-1.7 1.3-3 3-3 .2 0 .4 0 .6.1A10 10 0 0 0 12 2z" />
    </IconBase>
);

export const ListFilterIcon = (props) => (
    <IconBase {...props}>
        <line x1="21" y1="6" x2="3" y2="6" />
        <line x1="21" y1="12" x2="3" y2="12" />
        <line x1="21" y1="18" x2="3" y2="18" />
    </IconBase>
);

export const MenuIcon = (props) => (
    <IconBase {...props}>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </IconBase>
);

export const SendIcon = (props) => (
    <IconBase {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </IconBase>
);

export const SmileIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
    </IconBase>
);

export const TrashIcon = (props) => (
    <IconBase {...props}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </IconBase>
);

export const EyeIcon = (props) => (
    <IconBase {...props}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </IconBase>
);

export const SimulateIcon = (props) => (
    <IconBase {...props}>
        <polygon points="5 3 19 12 5 21 5 3" />
    </IconBase>
);

export const LogOutIcon = (props) => (
    <IconBase {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </IconBase>
);
export const BrainCircuitIcon = (props) => (
    <IconBase {...props}>
        <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 3.97 2.5 2.5 0 0 0 1.32 3.97 2.5 2.5 0 0 0 1.98 3 2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-3.97 2.5 2.5 0 0 0-1.32-3.97 2.5 2.5 0 0 0-1.98-3z" />
        <path d="M12 12h.01" />
    </IconBase>
);

export const ChevronDownIcon = (props) => (
    <IconBase {...props}>
        <polyline points="6 9 12 15 18 9" />
    </IconBase>
);

export const ChevronRightIcon = (props) => (
    <IconBase {...props}>
        <polyline points="9 18 15 12 9 6" />
    </IconBase>
);

export const CheckIcon = (props) => (
    <IconBase {...props}>
        <polyline points="20 6 9 17 4 12" />
    </IconBase>
);

export const AlertCircleIcon = (props) => (
    <IconBase {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </IconBase>
);

export const CloudyIcon = (props) => (
    <IconBase {...props}>
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </IconBase>
);

export const SproutIcon = (props) => (
    <IconBase {...props}>
        <path d="M7 20h10" />
        <path d="M10 20v-6" />
        <path d="M6 8c4 4 10 2 10 7v5" />
        <path d="M13.5 10.5c.5-.9 1.5-1.5 2.5-1.5a3 3 0 0 1 3 3c0 2-3 4-3 4" />
    </IconBase>
);

export const DropletsIcon = (props) => (
    <IconBase {...props}>
        <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.8-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
        <path d="M12.56 6c-2.2 0-4 1.83-4 4.05 0 1.16.57 2.26 1.71 3.19s2.16 2.3 2.29 3.76c.29-1.45 1.14-2.8 2.29-3.76s1.29-2.26 1.29-3.41C16.56 7.83 14.76 6 12.56 6z" />
    </IconBase>
);
export const CalendarIcon = (props) => (
    <IconBase {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </IconBase>
);
