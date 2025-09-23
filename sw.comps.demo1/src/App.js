import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import CodePlayground from './CodePlayground';
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
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'playground':
        return <CodePlayground />;
      case 'modules':
        return <ModuleExplorer />;
      case 'home':
      default:
        return (
          <div className="App">
            <header className="App-header">
              <img src={logo} className="App-logo" alt="logo" />
              <p>
                Edit <code>src/App.js</code> and save to reload.
              </p>
              <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn React
              </a>
            </header>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <nav className="app-nav flex items-center justify-between px-4 py-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage('home')}
            className={currentPage === 'home' ? 'nav-btn active px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors' : 'nav-btn px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors'}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('playground')}
            className={currentPage === 'playground' ? 'nav-btn active px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors' : 'nav-btn px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors'}
          >
            Code Playground
          </button>
          <button 
            onClick={() => setCurrentPage('modules')}
            className={currentPage === 'modules' ? 'nav-btn active px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors' : 'nav-btn px-3 py-1.5 rounded-2xl text-sm font-medium transition-colors'}
          >
            Module Explorer
          </button>
        </div>
        <ThemeToggle />
      </nav>
      {renderPage()}
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
