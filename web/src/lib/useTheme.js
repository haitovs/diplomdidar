import { useState, useEffect } from 'react';

const KEY = 'app-theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggleTheme];
}
