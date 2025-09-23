import React, { useState } from 'react';
import './CodePlayground.css';

function CodePlayground() {
  const [code, setCode] = useState('// Paste your code here\n');

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  const clearCode = () => {
    setCode('// Paste your code here\n');
  };

  return (
    <div className="code-playground">
      <div className="playground-header">
        <h1>Code Playground</h1>
        <div className="controls">
          <button onClick={clearCode} className="clear-btn">
            Clear
          </button>
        </div>
      </div>
      
      <div className="playground-content">
        <div className="code-section">
          <h3>Code Editor</h3>
          <textarea
            value={code}
            onChange={handleCodeChange}
            className="code-editor"
            placeholder="Paste your code here..."
            spellCheck={false}
          />
        </div>
        
        <div className="output-section">
          <h3>Notes</h3>
          <div className="notes-area">
            <p>This is your code playground where you can:</p>
            <ul>
              <li>Paste and edit code snippets</li>
              <li>Test small code blocks</li>
              <li>Take notes about your code</li>
              <li>Experiment with different solutions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodePlayground;
