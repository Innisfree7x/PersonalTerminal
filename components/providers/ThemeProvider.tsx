'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { LEGACY_STORAGE_KEYS, readStorageValueWithLegacy, STORAGE_KEYS } from '@/lib/storage/keys';

export type Theme =
    | 'midnight'
    | 'nord'
    | 'dracula'
    | 'ocean'
    | 'emerald'
    | 'gold'
    | 'platinum'
    | 'sapphire'
    | 'copper'
    | 'amethyst'
    | 'obsidian'
    | 'rosegold'
    | 'carbon'
    | 'titanium'
    | 'onyx';

export type AccentColor =
    | 'purple'
    | 'blue'
    | 'green'
    | 'orange'
    | 'pink'
    | 'red'
    | 'gold'
    | 'sunset'
    | 'aurora'
    | 'royal'
    | 'plasma'
    | 'ember'
    | 'champagne'
    | 'ice'
    | 'rose'
    | 'jade'
    | 'slate';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const VALID_THEMES = [
    'midnight',
    'nord',
    'dracula',
    'ocean',
    'emerald',
    'gold',
    'platinum',
    'sapphire',
    'copper',
    'amethyst',
    'obsidian',
    'rosegold',
    'carbon',
    'titanium',
    'onyx',
] as const;

const VALID_ACCENTS = [
    'purple',
    'blue',
    'green',
    'orange',
    'pink',
    'red',
    'gold',
    'sunset',
    'aurora',
    'royal',
    'plasma',
    'ember',
    'champagne',
    'ice',
    'rose',
    'jade',
    'slate',
] as const;

const ACCENT_COLORS: Record<AccentColor, { base: string; hover: string; secondary: string }> = {
    purple: { base: '124 58 237', hover: '109 40 217', secondary: '168 85 247' },
    blue: { base: '59 130 246', hover: '37 99 235', secondary: '56 189 248' },
    green: { base: '16 185 129', hover: '5 150 105', secondary: '52 211 153' },
    orange: { base: '249 115 22', hover: '234 88 12', secondary: '245 158 11' },
    pink: { base: '236 72 153', hover: '219 39 119', secondary: '244 114 182' },
    red: { base: '239 68 68', hover: '220 38 38', secondary: '248 113 113' },
    gold: { base: '234 179 8', hover: '202 138 4', secondary: '245 158 11' },
    sunset: { base: '249 115 22', hover: '234 88 12', secondary: '236 72 153' },
    aurora: { base: '16 185 129', hover: '5 150 105', secondary: '59 130 246' },
    royal: { base: '99 102 241', hover: '79 70 229', secondary: '236 72 153' },
    plasma: { base: '168 85 247', hover: '147 51 234', secondary: '59 130 246' },
    ember: { base: '239 68 68', hover: '220 38 38', secondary: '245 158 11' },
    champagne: { base: '212 175 55', hover: '186 150 40', secondary: '232 204 110' },
    ice: { base: '148 210 236', hover: '120 190 220', secondary: '200 230 255' },
    rose: { base: '201 135 143', hover: '180 110 120', secondary: '232 169 176' },
    jade: { base: '0 168 107', hover: '0 140 90', secondary: '46 204 113' },
    slate: { base: '112 128 144', hover: '90 105 120', secondary: '143 163 179' },
};

function isTheme(value: string): value is Theme {
    return (VALID_THEMES as readonly string[]).includes(value);
}

function isAccent(value: string): value is AccentColor {
    return (VALID_ACCENTS as readonly string[]).includes(value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('midnight');
    const [accentColor, setAccentColor] = useState<AccentColor>('gold');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storage = window.localStorage;

        // Load saved settings (with one-time migration from legacy keys)
        const savedTheme = readStorageValueWithLegacy(
            storage,
            STORAGE_KEYS.theme,
            LEGACY_STORAGE_KEYS.theme
        );
        const savedAccent = readStorageValueWithLegacy(
            storage,
            STORAGE_KEYS.accent,
            LEGACY_STORAGE_KEYS.accent
        );

        if (savedTheme && isTheme(savedTheme)) setTheme(savedTheme);
        if (savedAccent && isAccent(savedAccent)) setAccentColor(savedAccent);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEYS.theme, theme);

        // Apply accent color
        const colors = ACCENT_COLORS[accentColor] ?? ACCENT_COLORS.gold;
        document.documentElement.style.setProperty('--primary', colors.base);
        document.documentElement.style.setProperty('--primary-hover', colors.hover);
        document.documentElement.style.setProperty('--primary-secondary', colors.secondary);

        // Save accent preference
        localStorage.setItem(STORAGE_KEYS.accent, accentColor);

    }, [theme, accentColor, mounted]);

    // Prevent flash of wrong theme


    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
