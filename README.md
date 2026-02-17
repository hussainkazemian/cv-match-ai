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

### Core Component Workflow

Here’s a more detailed look at how the main components work together:

#### 1. The Organizer: `sectionParser.ts`

-   **What it does**: This is the first worker on the line. It takes the raw text from the job posting or your CV and chops it up into logical sections. It looks for common headings like "Responsibilities," "Experience," or "Skills" to sort the content into organized buckets.
-   **Interaction with the model**: It has **no interaction** with the language model. Its job is purely structural, like sorting mail into different trays before anyone reads the letters.

#### 2. The Brain: `textAnalyzer.ts`

-   **What it does**: This is the project manager. It orchestrates the entire analysis.
    1.  It first asks the `sectionParser` for the organized sections of the job post and the CV.
    2.  It then takes the content from those sections (like a list of required skills) and decides they need to be compared for meaning.
    3.  To do this, it sends each skill or phrase to the `textEmbedder` to be translated into a "meaning vector."
    4.  Once it gets the vectors back, it performs the final comparison, calculating the similarity between the job skill vectors and the CV skill vectors to find matches.
-   **Interaction with the model**: It **indirectly** interacts with the model by using the `textEmbedder` as a go-between. It tells the embedder *what* to analyze.

#### 3. The Translator: `textEmbedder.ts` & the Language Model

-   **What it does**: This component is the specialist that directly handles the AI. It holds the loaded language model (`universal_sentence_encoder.tflite`). When the `textAnalyzer` gives it a piece of text (e.g., the skill "Backend Development"), the `textEmbedder` feeds this text into the model.
-   **How the model works**: The language model's sole purpose is to act as a universal translator. It translates human language into a format the computer can understand mathematically: a list of numbers called a **vector** or an **embedding**. This vector represents the text's semantic meaning.
    -   For example, the vectors for "server-side programming" and "backend development" will be mathematically very similar.
    -   The vectors for "Java" and "coffee" will be very different.
-   **Interaction**: The `textEmbedder` **directly** uses the language model. It takes text, passes it to the model, and gets a meaningful numerical vector in return, which it then hands back to the `textAnalyzer`.

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


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
