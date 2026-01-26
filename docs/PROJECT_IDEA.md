# CV-Match AI - Project Idea

## 🎯 What is it?

CV-Match AI is a **privacy-focused desktop application** that compares job postings with applicant CVs using **local AI processing**. No data leaves your computer.

## 💡 The Problem

Job seekers often struggle to know if their CV matches what employers are looking for. They apply to jobs without knowing which skills they're missing or how to improve their application.

## ✅ The Solution

1. **Paste a job posting** → The app extracts required skills, qualifications, and keywords
2. **Paste or import your CV (PDF)** → The app extracts your skills and experience
3. **Compare** → Get instant analysis showing:
   - Match score (percentage)
   - Matching skills ✅
   - Missing skills ❌
   - Personalized recommendations 💡

## 🔧 Technology Stack

- **Tauri** - Lightweight desktop app framework
- **React + TypeScript** - Modern UI
- **MediaPipe Text Tasks** - Local AI text analysis (planned)
- **pdfjs-dist** - PDF text extraction

## 🔒 Privacy First

All processing happens **locally on your device**. Your CV and job data are never uploaded to any server.

## 🚀 Future Plans

- Semantic similarity using MediaPipe text embeddings
- Multi-language support (Finnish/English)
- Export analysis reports
- CV improvement suggestions
