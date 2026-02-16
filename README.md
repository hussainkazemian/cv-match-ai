# CV-Match AI 🎯

A **privacy-first desktop application** that compares job postings with your CV using intelligent local AI processing. All analysis happens on your device — no data is uploaded to any server.

## 🌟 What It Does

CV-Match AI helps job seekers understand how well their CV matches a job posting by:

1. **📋 Extracting job requirements** from job postings (skills, qualifications, keywords)
2. **📄 Analyzing your CV** (supports PDF and DOCX formats)
3. **🔍 Comparing & Scoring** with semantic similarity analysis
4. **✨ Providing insights** including:
   - Match percentage score
   - ✅ Skills you have that match
   - ❌ Skills you're missing
   - 💡 Personalized recommendations for improvement

## 🔒 Privacy First

- **Zero cloud uploads** — all processing happens locally on your machine
- **No tracking** — your CV and job data never leave your computer
- **No sign-up required** — completely offline operation

## 🛠 Technology Stack

### Frontend
- **React 18** + **TypeScript** — Modern, type-safe UI
- **Vite** — Lightning-fast development and production builds
- **React DOM** — Component rendering

### Backend & AI
- **Tauri 1.5** — Lightweight desktop app framework using native system resources
- **MediaPipe Text Tasks** — Local AI text analysis and embeddings
  - Model: Universal Sentence Encoder (TFLITE)
  - Used for semantic similarity calculations
- **Transformers.js (@xenova/transformers)** — Running transformer models locally

### Text Processing
- **pdfjs-dist** — PDF text extraction
- **Mammoth** — DOCX (Word document) text extraction

### Build & Development
- **TypeScript 5.3** — Type safety across the project
- **Node.js** — Required for development

## 📊 AI Models & Languages

### Language Detection
The application automatically detects input language using pattern matching:
- **English** (eng_Latn) — Default
- **Finnish** (fin_Latn) — Primary support
- **Swedish** (swe_Latn) — Secondary support
- Additional support for German, French, Spanish, Italian, Norwegian, Danish

### AI Models
1. **Universal Sentence Encoder (TFLITE)**
   - Location: `/public/models/universal_sentence_encoder.tflite`
   - Purpose: Text embeddings and semantic similarity
   - Size: Lightweight, optimized for local inference
   - Quantized: Yes (for faster processing)

2. **Text Extraction Models**
   - PDF processing uses pdfjs-dist WASM module
   - DOCX processing uses Mammoth library

### Skill Extraction
The application includes a comprehensive skill keywords database covering:
- Programming Languages (JavaScript, TypeScript, Python, Java, C++, Rust, Go, etc.)
- Frontend Frameworks (React, Vue, Angular, Svelte)
- Backend Frameworks (Node, Express, Django, Flask, Spring, etc.)
- Databases (SQL, MySQL, PostgreSQL, MongoDB, Redis, Firebase)
- Cloud & DevOps (AWS, Azure, GCP, Docker, Kubernetes)
- Tools & Platforms (Git, GitHub, Jira, Figma, VSCode)
- Soft Skills (Leadership, Communication, Teamwork, Problem-solving)

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ and **npm** or **yarn**
- **Rust** (required for Tauri desktop builds)
  - Install from: https://rustup.rs/
- **Tauri CLI** (installed via npm)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cv-match-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download AI models** (optional for desktop build)
   ```bash
   node scripts/download-models.mjs
   ```
   The model is already included in the `/public/models/` directory, but you can refresh it with this script.

## 🏃 Running the Application

### Development Mode

**Web Development (with hot reload)**
```bash
npm run dev
```
Opens the development server at `http://localhost:1420`

**Desktop Development (Tauri)**
```bash
npm run tauri:dev
```
Launches the desktop application with hot reload enabled.

### Production Build

**Web Build**
```bash
npm run build
```
Generates optimized production files in the `dist/` directory.

**Desktop Application Build**
```bash
npm run tauri:build
```
Creates a platform-specific executable:
- Windows: `.msi` installer and `.exe` portable executable
- macOS: `.app` bundle
- Linux: `.AppImage` and `.deb` packages

## 📂 Project Structure

```
cv-match-ai/
├── src/                          # React frontend
│   ├── App.tsx                   # Main React component
│   ├── main.tsx                  # React entry point
│   ├── components/
│   │   └── AnalysisForm.tsx      # CV analysis form component
│   ├── styles/                   # CSS styles
│   └── utils/                    # Utility functions
│       ├── textAnalyzer.ts       # Skill extraction & analysis
│       ├── textEmbedder.ts       # Semantic similarity using MediaPipe
│       ├── languageTranslator.ts # Language detection
│       ├── pdfText.ts            # PDF text extraction
│       └── docxText.ts           # DOCX text extraction
├── src-tauri/                    # Tauri desktop app backend
│   ├── src/main.rs              # Rust entry point
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── public/
│   ├── models/
│   │   └── universal_sentence_encoder.tflite  # AI model
│   ├── pdf.worker.min.mjs        # PDF.js WASM worker
│   └── icons/                    # App icons
├── docs/                         # Documentation
│   ├── PROJECT_IDEA.md
│   ├── MEDIAPIPE_PLAN.md
│   └── MEDIAPIPE_IMPLEMENTATION.md
├── scripts/
│   ├── download-models.mjs       # Model download script
│   └── gen-tauri-icons.mjs       # Icon generation
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # NPM dependencies
└── README.md                    # This file
```

## 🎯 Features & Workflow

1. **Paste Job Posted or URL** → Application extracts text
2. **Upload Your CV** → Supports PDF and DOCX formats
3. **Automatic Analysis** → AI processes both documents
4. **Get Results** → View match score and skill analysis
5. **Review Recommendations** → Get actionable improvement suggestions

## 📈 How Matching Works

1. **Skill Extraction** — Identifies keywords from predefined skill database
2. **Semantic Analysis** — Uses Universal Sentence Encoder for deep text understanding
3. **Similarity Scoring** — Calculates cosine similarity between matched concepts
4. **Match Percentage** — Aggregates results into overall match score
5. **Recommendation Engine** — Suggests missing skills and improvements

## 🔧 Development Scripts

```bash
npm run dev              # Start web dev server
npm run build           # Build for web
npm run tauri          # Tauri CLI commands
npm run tauri:dev      # Run desktop app in dev mode
npm run tauri:build    # Build desktop app for distribution
npm run pretauri       # Generate Tauri icons
```

## 🚀 Future Roadmap

- [ ] Multi-language UI support (Finnish/English)
- [ ] Advanced CV parsing with structure recognition
- [ ] Export analysis reports (PDF/JSON)
- [ ] CV improvement suggestions with examples
- [ ] Job description templates library
- [ ] Save/load comparison history
- [ ] Browser extension version

## 📝 License

This project is licensed under the Apache License 2.0 — see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ for job seekers who want smarter applications**
