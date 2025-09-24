import React from 'react';
import './App.css';
import ModuleExplorer from './ModuleExplorer';
import { ThemeProvider, useTheme } from './ThemeContext';
import './themes/light.css';
import './themes/dark.css';

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
};

function App() {
  return (
    <div className="app-container">
      <header className="app-header flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Software Components Explorer</h1>
        </div>
        <ThemeToggle />
      </header>
      <main className="app-main">
        <ModuleExplorer />
      </main>
    </div>
  );
}

// Wrapper component with ThemeProvider
const AppWithTheme = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

export default AppWithTheme;
