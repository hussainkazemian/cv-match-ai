/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */

import { useState } from 'react';
import { AnalysisForm } from './components/AnalysisForm';
import { textAnalyzer, AnalysisResult } from './utils/textAnalyzer';
import './App.css';

function App() {
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = (jobPosting: string, cv: string): AnalysisResult | null => {
    try {
      setError(null);
      return textAnalyzer.analyze(jobPosting, cv);
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
      return null;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🎯 CV-Match AI</h1>
        <p>Compare your CV against job requirements using local AI</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <AnalysisForm onAnalyze={handleAnalyze} />

      <footer className="app-footer">
        <p>Powered by MediaPipe Text Models • All processing happens locally</p>
      </footer>
    </div>
  );
}

export default App;
