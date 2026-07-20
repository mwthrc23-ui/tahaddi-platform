'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applyTheme, resolveTheme, themeStorageKey, type Theme } from '@/lib/theme';

type ThemeContextValue = { theme: Theme; resolvedTheme: 'dark' | 'light'; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(themeStorageKey) as Theme | null;
    return saved && ['dark', 'light', 'system'].includes(saved) ? saved : 'dark';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(themeStorageKey) as Theme | null;
    return resolveTheme(saved && ['dark', 'light', 'system'].includes(saved) ? saved : 'dark');
  });

  const setTheme = useCallback((next: Theme) => {
    updateTheme(next); localStorage.setItem(themeStorageKey, next); applyTheme(next); setResolvedTheme(resolveTheme(next));
  }, []);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => { if (theme === 'system') { applyTheme('system'); setResolvedTheme(resolveTheme('system')); } };
    media.addEventListener('change', sync); return () => media.removeEventListener('change', sync);
  }, [theme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
