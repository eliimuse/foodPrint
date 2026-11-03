import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemeMeta {
  name: string;
  primaryHex: string;
  accentHex: string;
  fontFamily: string;
}

export const HERITAGE_CLAY_THEME: ThemeMeta = {
  name: 'Heritage Clay',
  primaryHex: '#c2410c', // Warm Terracotta 700
  accentHex: '#ea580c',  // Spice Orange 600
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeOption: ThemeMeta;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('foodprint_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'terracotta');

    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('foodprint_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        activeOption: HERITAGE_CLAY_THEME,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
