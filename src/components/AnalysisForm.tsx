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
import { docxBase64ToText } from '../utils/docxText';
import { detectLanguage, getLanguageName } from '../utils/languageTranslator';
import '../styles/AnalysisForm.css';

interface AnalysisFormProps {
  onAnalyze: (jobPosting: string, cv: string, language: string) => Promise<AnalysisResult | null>;
}

export function AnalysisForm({ onAnalyze }: AnalysisFormProps) {
  const [jobPosting, setJobPosting] = useState('');
  const [cv, setCv] = useState('');
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<string>('');
  const [jobPostingLang, setJobPostingLang] = useState<string>('');
  const [cvLang, setCvLang] = useState<string>('');

  const canAnalyze = jobPosting.trim().length > 0 && cv.trim().length > 0;

  const handleImportDocument = async () => {
    setPdfLoading(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'CV Document', extensions: ['pdf', 'docx'] }],
        title: 'Select your CV (PDF or Word)',
      });

      if (!selected || Array.isArray(selected)) {
        setPdfLoading(false);
        return;
      }

      // Get filename for display
      const fileName = selected.split(/[/\\]/).pop() || 'CV';
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      // Read file as base64 via Tauri backend
      const base64 = await invoke<string>('read_file_base64', { path: selected });

      // Convert to text based on file type
      let text: string;
      if (fileExtension === 'docx') {
        text = await docxBase64ToText(base64);
      } else {
        text = await pdfBase64ToText(base64);
      }

      if (text.trim().length === 0) {
        alert('Could not extract text from document. The file might be protected or image-based.');
        return;
      }

      // Detect language of imported document
      setCvLang(detectLanguage(text));
      setCv(text);
      setCvFileName(fileName);
    } catch (e) {
      console.error('Document import error:', e);
      alert('Failed to import document. Please try another file or paste text directly.');
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
    setTranslationStatus('');
    setResult(null);

    try {
      // Detect languages
      const jobLang = detectLanguage(jobPosting);
      const cvLang = detectLanguage(cv);
      
      const jobLangName = getLanguageName(jobLang);
      const cvLangName = getLanguageName(cvLang);
      
      // Use job posting language for analysis (or CV if different)
      const analysisLanguage = jobLang;
      
      setTranslationStatus(`🌐 Analyzing: Job Posting (${jobLangName}) vs CV (${cvLangName})...`);

      // Call async analyze function with language parameter
      onAnalyze(jobPosting, cv, analysisLanguage).then((analysisResult) => {
        setResult(analysisResult);
        setTranslationStatus('');
      }).catch((error) => {
        console.error('Analysis error:', error);
        alert('An error occurred during analysis. Please try again.');
        setTranslationStatus('');
      }).finally(() => {
        setLoading(false);
      });
    } catch (error) {
      console.error('Analysis error:', error);
      alert('An error occurred during analysis. Please try again.');
      setLoading(false);
      setTranslationStatus('');
    }
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
            onChange={(e) => {
              setJobPosting(e.target.value);
              if (e.target.value.trim().length > 20) {
                setJobPostingLang(detectLanguage(e.target.value));
              } else {
                setJobPostingLang('');
              }
            }}
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
            <span>
              {jobPosting.length} characters • {jobPosting.split(/\s+/).filter(Boolean).length} words
            </span>
            {jobPostingLang && (
              <span className="language-badge">
                🌐 {getLanguageName(jobPostingLang)}
              </span>
            )}
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

          {/* Document Import Button */}
          <div className="cv-actions">
            <button
              type="button"
              className="btn btn-import"
              onClick={handleImportDocument}
              disabled={pdfLoading}
            >
              {pdfLoading ? '⏳ Reading Document...' : '📁 Import PDF or Word'}
            </button>
            <span className="cv-actions-divider">or paste text below</span>
          </div>

          <textarea
            value={cv}
            onChange={(e) => {
              setCv(e.target.value);
              setCvFileName(null); // Clear filename when manually editing
              if (e.target.value.trim().length > 20) {
                setCvLang(detectLanguage(e.target.value));
              } else {
                setCvLang('');
              }
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
            <span>
              {cv.length} characters • {cv.split(/\s+/).filter(Boolean).length} words
            </span>
            {cvLang && (
              <span className="language-badge">
                🌐 {getLanguageName(cvLang)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="actions-bar">
        {translationStatus && (
          <div className="translation-status">
            ✨ {translationStatus}
          </div>
        )}
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
        <div className="score-details">
          <small>Semantic Similarity: {result.overallSimilarity}%</small>
        </div>
      </div>

      {/* Skills Comparison */}
      <div className="skills-grid">
        {/* Job Requirements Structure */}
        <div className="skills-card">
          <h3>📋 Job Requirements</h3>
          <div className="requirements-structure">
            {result.jobRequirements.title && (
              <div className="req-item">
                <strong>Position:</strong> {result.jobRequirements.title}
              </div>
            )}
            {result.jobRequirements.experience && (
              <div className="req-item">
                <strong>Experience:</strong> {result.jobRequirements.experience}
              </div>
            )}
            {result.jobRequirements.education.length > 0 && (
              <div className="req-item">
                <strong>Education:</strong> {result.jobRequirements.education.join(', ')}
              </div>
            )}
            {result.jobRequirements.requiredSkills.length > 0 && (
              <div className="req-item">
                <strong>Required Skills ({result.jobRequirements.requiredSkills.length}):</strong>
                <div className="skills-list">
                  {result.jobRequirements.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className={`skill-chip ${
                        result.matchingSkills.includes(skill) ? 'matched' : 'unmatched'
                      }`}
                    >
                      {result.matchingSkills.includes(skill) ? '✓' : '✗'} {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.jobRequirements.techStack.length > 0 && (
              <div className="req-item">
                <strong>Tech Stack:</strong>
                <div className="skills-list">
                  {result.jobRequirements.techStack.map((tech) => (
                    <span
                      key={tech}
                      className={`skill-chip ${
                        result.matchingSkills.includes(tech) ? 'matched' : 'unmatched'
                      }`}
                    >
                      {result.matchingSkills.includes(tech) ? '✓' : '✗'} {tech}
                    </span>
                  ))}
                </div>
              </div>
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
              <span className="no-skills">Develop more skills to improve your match</span>
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
