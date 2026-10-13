import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const explicitChoice = localStorage.getItem('billing_theme_user_set');
      if (explicitChoice === 'true') {
        return localStorage.getItem('billing_theme') || 'light';
      }
      // Default to fresh light green theme for user
      localStorage.setItem('billing_theme', 'light');
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('billing_theme', theme);

    // Broadcast change to other components listening on window
    window.dispatchEvent(new CustomEvent('theme_change', { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail && e.detail !== theme) {
        setTheme(e.detail);
      }
    };
    window.addEventListener('theme_change', handleThemeChange);
    return () => window.removeEventListener('theme_change', handleThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    localStorage.setItem('billing_theme_user_set', 'true');
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
};

export default useTheme;
