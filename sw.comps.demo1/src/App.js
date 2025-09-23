import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import CodePlayground from './CodePlayground';
import ModuleExplorer from './ModuleExplorer';

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
      <nav className="app-nav">
        <button 
          onClick={() => setCurrentPage('home')}
          className={currentPage === 'home' ? 'nav-btn active' : 'nav-btn'}
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentPage('playground')}
          className={currentPage === 'playground' ? 'nav-btn active' : 'nav-btn'}
        >
          Code Playground
        </button>
        <button 
          onClick={() => setCurrentPage('modules')}
          className={currentPage === 'modules' ? 'nav-btn active' : 'nav-btn'}
        >
          Module Explorer
        </button>
      </nav>
      {renderPage()}
    </div>
  );
}

export default App;
