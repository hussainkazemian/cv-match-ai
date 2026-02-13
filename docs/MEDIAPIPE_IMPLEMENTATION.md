# MediaPipe Text Embedder Implementation

## Overview

Replace keyword-based matching with semantic similarity using MediaPipe Text Embedder.

## Current vs New Approach

| Current (Keyword) | New (Embeddings) |
|-------------------|------------------|
| "react" matches "react" only | "react" ≈ "reactjs" ≈ "react.js" |
| Misses synonyms | Understands "developer" ≈ "engineer" |
| Exact string match | Semantic similarity score |

## Installation

```bash
npm install @mediapipe/tasks-text
```

## Model Download

Download the Universal Sentence Encoder model:
- URL: https://storage.googleapis.com/mediapipe-models/text_embedder/universal_sentence_encoder/float32/latest/universal_sentence_encoder.tflite
- Save to: `public/models/universal_sentence_encoder.tflite`

## Usage Flow

1. Load model once at app startup
2. Generate embedding for job posting
3. Generate embedding for CV
4. Calculate cosine similarity
5. Return match percentage

## Sentence-Level Comparison

For better results, compare individual sentences/requirements:
- Split job posting into requirements
- Split CV into experience statements
- Compare each requirement against all CV statements
- Find best matches and gaps
