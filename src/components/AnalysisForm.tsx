/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { AnalysisResult } from '../utils/textAnalyzer';
import { pdfBase64ToText } from '../utils/pdfText';
import '../styles/AnalysisForm.css';

interface AnalysisFormProps {
  onAnalyze: (jobPosting: string, cv: string) => AnalysisResult | null;
}

export function AnalysisForm({ onAnalyze }: AnalysisFormProps) {
  const [jobPosting, setJobPosting] = useState('');
  const [cv, setCv] = useState('');
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const canAnalyze = jobPosting.trim().length > 0 && cv.trim().length > 0;

  const handleImportPdf = async () => {
    setPdfLoading(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        title: 'Select your CV (PDF)',
      });

      if (!selected || Array.isArray(selected)) {
        setPdfLoading(false);
        return;
      }

      // Get filename for display
      const fileName = selected.split(/[/\\]/).pop() || 'CV.pdf';

      // Read file as base64 via Tauri backend
      const base64 = await invoke<string>('read_file_base64', { path: selected });

      // Convert PDF to text
      const text = await pdfBase64ToText(base64);

      if (text.trim().length === 0) {
        alert('Could not extract text from PDF. The PDF might be image-based or protected.');
        return;
      }

      setCv(text);
      setCvFileName(fileName);
    } catch (e) {
      console.error('PDF import error:', e);
      alert('Failed to import PDF. Please try another file or paste text directly.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClearCv = () => {
    setCv('');
    setCvFileName(null);
  };

  const handleAnalyze = () => {
    if (!canAnalyze) {
      alert('Please fill in both the job posting and your CV');
      return;
    }

    setLoading(true);
    setResult(null);

    setTimeout(() => {
      try {
        const analysisResult = onAnalyze(jobPosting, cv);
        setResult(analysisResult);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleClear = () => {
    setJobPosting('');
    setCv('');
    setCvFileName(null);
    setResult(null);
  };

  return (
    <div className="analysis-container">
      {/* Two Panel Input Section */}
      <div className="panels-wrapper">
        {/* Left Panel - Job Posting */}
        <div className="panel job-panel">
          <div className="panel-header">
            <span className="panel-icon">📋</span>
            <h2>Job Posting</h2>
          </div>
          <p className="panel-description">
            Paste the job description, requirements, and qualifications
          </p>
          <textarea
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            placeholder="Paste job posting here...

Example:
- Looking for a Full Stack Developer
- Requirements: React, TypeScript, Node.js
- 3+ years of experience
- Strong communication skills
- Problem-solving abilities"
            className="panel-textarea"
          />
          <div className="panel-stats">
            {jobPosting.length} characters • {jobPosting.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Right Panel - CV */}
        <div className="panel cv-panel">
          <div className="panel-header">
            <span className="panel-icon">📄</span>
            <h2>Your CV</h2>
            {cvFileName && (
              <span className="file-badge">
                📎 {cvFileName}
                <button className="file-badge-clear" onClick={handleClearCv} title="Clear">×</button>
              </span>
            )}
          </div>
          <p className="panel-description">
            Paste your CV text or import from PDF
          </p>

          {/* PDF Import Button */}
          <div className="cv-actions">
            <button
              type="button"
              className="btn btn-import"
              onClick={handleImportPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? '⏳ Reading PDF...' : '📁 Import PDF'}
            </button>
            <span className="cv-actions-divider">or paste text below</span>
          </div>

          <textarea
            value={cv}
            onChange={(e) => {
              setCv(e.target.value);
              setCvFileName(null); // Clear filename when manually editing
            }}
            placeholder="Paste your CV here...

Example:
- Software Developer with 5 years experience
- Skills: JavaScript, React, Python, SQL
- Education: BSc Computer Science
- Led team of 4 developers
- Excellent communication"
            className="panel-textarea"
          />
          <div className="panel-stats">
            {cv.length} characters • {cv.split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-bar">
        <button
          onClick={handleClear}
          className="btn btn-secondary"
          disabled={loading}
        >
          🗑️ Clear All
        </button>
        <button
          onClick={handleAnalyze}
          className="btn btn-primary"
          disabled={loading || !canAnalyze}
        >
          {loading ? '⏳ Analyzing...' : '🔍 Compare CV vs Job'}
        </button>
      </div>

      {/* Results Section */}
      {result && <ResultsDisplay result={result} />}
    </div>
  );
}

function ResultsDisplay({ result }: { result: AnalysisResult }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    if (score >= 40) return '🤔';
    return '⚠️';
  };

  return (
    <div className="results-container">
      <h2 className="results-title">📊 Analysis Results</h2>

      {/* Match Score */}
      <div className="score-card">
        <div className="score-header">
          <span className="score-emoji">{getScoreEmoji(result.matchScore)}</span>
          <span className="score-label">Match Score</span>
        </div>
        <div
          className="score-value"
          style={{ color: getScoreColor(result.matchScore) }}
        >
          {result.matchScore}%
        </div>
        <div className="score-bar-container">
          <div
            className="score-bar-fill"
            style={{
              width: `${result.matchScore}%`,
              backgroundColor: getScoreColor(result.matchScore),
            }}
          />
        </div>
      </div>

      {/* Skills Comparison */}
      <div className="skills-grid">
        {/* Job Requirements */}
        <div className="skills-card">
          <h3>📋 Job Requirements ({result.jobSkills.length})</h3>
          <div className="skills-list">
            {result.jobSkills.length > 0 ? (
              result.jobSkills.map((skill) => (
                <span
                  key={skill}
                  className={`skill-chip ${
                    result.matchingSkills.includes(skill) ? 'matched' : 'unmatched'
                  }`}
                >
                  {result.matchingSkills.includes(skill) ? '✓' : '✗'} {skill}
                </span>
              ))
            ) : (
              <span className="no-skills">No specific skills detected</span>
            )}
          </div>
        </div>

        {/* CV Skills */}
        <div className="skills-card">
          <h3>📄 Your Skills ({result.cvSkills.length})</h3>
          <div className="skills-list">
            {result.cvSkills.length > 0 ? (
              result.cvSkills.map((skill) => (
                <span key={skill} className="skill-chip cv-skill">
                  {skill}
                </span>
              ))
            ) : (
              <span className="no-skills">No specific skills detected</span>
            )}
          </div>
        </div>

        {/* Matching Skills */}
        <div className="skills-card success">
          <h3>✅ Matching Skills ({result.matchingSkills.length})</h3>
          <div className="skills-list">
            {result.matchingSkills.length > 0 ? (
              result.matchingSkills.map((skill) => (
                <span key={skill} className="skill-chip matched">
                  {skill}
                </span>
              ))
            ) : (
              <span className="no-skills">No matching skills found</span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="skills-card warning">
          <h3>❌ Missing Skills ({result.missingSkills.length})</h3>
          <div className="skills-list">
            {result.missingSkills.length > 0 ? (
              result.missingSkills.map((skill) => (
                <span key={skill} className="skill-chip missing">
                  {skill}
                </span>
              ))
            ) : (
              <span className="no-skills">Great! No missing skills</span>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-card">
        <h3>💡 Recommendations</h3>
        <ul className="recommendations-list">
          {result.recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
