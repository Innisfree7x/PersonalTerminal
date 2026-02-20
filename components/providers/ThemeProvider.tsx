'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'midnight' | 'nord' | 'dracula' | 'ocean' | 'emerald' | 'gold';
type AccentColor = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'red' | 'gold';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS: Record<AccentColor, { base: string; hover: string }> = {
    purple: { base: '124 58 237', hover: '109 40 217' },
    blue: { base: '59 130 246', hover: '37 99 235' },
    green: { base: '16 185 129', hover: '5 150 105' },
    orange: { base: '249 115 22', hover: '234 88 12' },
    pink: { base: '236 72 153', hover: '219 39 119' },
    red: { base: '239 68 68', hover: '220 38 38' },
    gold: { base: '234 179 8', hover: '202 138 4' }, // Rich Gold
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('gold');
    const [accentColor, setAccentColor] = useState<AccentColor>('red');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved settings
        const savedTheme = localStorage.getItem('prism-theme') as Theme;
        const savedAccent = localStorage.getItem('prism-accent') as AccentColor;

        if (savedTheme) setTheme(savedTheme);
        if (savedAccent) setAccentColor(savedAccent);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('prism-theme', theme);

        // Apply accent color
        const colors = ACCENT_COLORS[accentColor];
        document.documentElement.style.setProperty('--primary', colors.base);
        document.documentElement.style.setProperty('--primary-hover', colors.hover);

        // Save accent preference
        localStorage.setItem('prism-accent', accentColor);

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
