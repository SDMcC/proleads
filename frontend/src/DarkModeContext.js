import React, { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
}

export function DarkModeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage or default to dark mode
    const saved = localStorage.getItem('darkMode');
    return saved === null ? true : saved === 'true'; // Default to dark mode
  });

  useEffect(() => {
    // Update document class and localStorage when mode changes
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
