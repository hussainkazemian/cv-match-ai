# CV-Match AI 🎯

A **privacy-first desktop application** that intelligently compares job postings with your CV using a local, built-in AI model. All analysis happens directly on your device — no data is ever uploaded to any server, ensuring your information remains completely private.

## 🌟 Core Features

- **Local AI Processing**: Leverages a sophisticated, built-in sentence encoder model for deep semantic understanding of text. All analysis is performed offline.
- **Intelligent Skill Matching**: Goes beyond simple keyword matching to understand the context and meaning of skills listed in both the job posting and your CV.
- **Comprehensive Analysis**: Extracts and compares key job requirements, including:
  - **Position Title**: Automatically identifies the role.
  - **Required Experience**: Pinpoints experience levels (e.g., "5+ years", "Senior").
  - **Matching & Missing Skills**: Clearly lists which of your skills align with the job and which are absent.
- **Cross-Platform**: Built with Tauri, making it available for Windows, macOS, and Linux.
- **Supports Common Formats**: Easily import your CV from `.pdf` and `.docx` files.

## 🔒 Privacy First

- **Zero Cloud Uploads**: All processing happens locally on your machine. Your CV and any job details never leave your computer.
- **No Data Collection**: The app does not collect or store any personal information.

## 🛠️ How It Works

The application follows a three-step process:

1.  **Parse & Extract**: It first parses the job posting and your CV, using a rule-based system to identify distinct sections like "Responsibilities," "Experience," and "Skills."
2.  **Analyze & Embed**: The text from these sections is then fed into the local Universal Sentence Encoder model. This model converts the text into high-dimensional vectors (embeddings) that capture its semantic meaning.
3.  **Compare & Score**: By calculating the similarity between the vectors from the job posting and your CV, the app can identify matching skills with high accuracy and determine the overall match score.

This hybrid approach of rule-based parsing and deep semantic analysis allows for robust and nuanced results that simple keyword searching cannot achieve.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) and Cargo

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/cv-match-ai.git
    cd cv-match-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run tauri dev
    ```
    This will open the application in a new window.

## 📂 Project Structure

```
cv-match-ai/
├── public/
│   └── models/
│       └── universal_sentence_encoder.tflite  # The local AI model
├── src/
│   ├── components/
│   │   ├── AnalysisForm.tsx       # Main form UI
│   │   └── AnalysisResult.tsx     # Results display UI
│   ├── styles/
│   │   ├── App.css
│   │   └── AnalysisForm.css
│   ├── utils/
│   │   ├── docxText.ts            # DOCX parser
│   │   ├── pdfText.ts             # PDF parser
│   │   ├── sectionParser.ts       # Rule-based text section identifier
│   │   ├── textAnalyzer.ts        # Core analysis and matching logic
│   │   └── textEmbedder.ts        # Manages the AI model and embeddings
│   ├── App.tsx                    # Main application component
│   └── main.tsx                   # Entry point
└── src-tauri/
    ├── tauri.conf.json            # Tauri configuration
    └── ...                        # Rust backend
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
