import { useState, useEffect, useCallback } from 'react';
import { ThemeContext } from './theme-context-core';

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('saferoute-theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore localStorage access issues
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      return 'dark';
    }
  }

  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply theme to document element and sync color-scheme
  const applyTheme = useCallback((newTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.style.colorScheme = newTheme;
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Synchronize when system theme changes and user has not manually set a preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      try {
        const userSaved = localStorage.getItem('saferoute-theme');
        if (!userSaved) {
          const nextTheme = e.matches ? 'dark' : 'light';
          setThemeState(nextTheme);
          applyTheme(nextTheme);
        }
      } catch {
        // Ignore localStorage error
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme) => {
      const targetTheme = newTheme === 'dark' ? 'dark' : 'light';
      try {
        localStorage.setItem('saferoute-theme', targetTheme);
      } catch {
        // Ignore localStorage error
      }
      setThemeState(targetTheme);
      applyTheme(targetTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
