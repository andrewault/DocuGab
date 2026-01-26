import { type ReactNode, useEffect, useState } from 'react';
import { ThemeContext, type ThemeMode } from './ThemeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        const saved = localStorage.getItem('theme-mode');
        return (saved as ThemeMode) || 'system';
    });

    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        localStorage.setItem('theme-mode', mode);
    };

    const effectiveTheme = themeMode === 'system' ? systemTheme : themeMode;

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, effectiveTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
