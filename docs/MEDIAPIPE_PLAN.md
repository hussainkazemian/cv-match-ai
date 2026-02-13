# MediaPipe Integration Plan

## Selected Model: Text Embedder

### Why Text Embedder?

1. **Semantic Similarity** - Understands meaning, not just keywords
   - "JavaScript developer" ≈ "JS programmer" (high similarity)
   - "React experience" ≈ "ReactJS knowledge" (high similarity)

2. **Better Matching** - Current keyword approach misses:
   - Synonyms (engineer/developer)
   - Related skills (Python → Django familiarity)
   - Experience phrasing variations

3. **Local Processing** - Runs entirely on user's device

### Implementation Plan

#### Phase 1: Setup
```
- Download Universal Sentence Encoder Lite model (.tflite)
- Integrate @mediapipe/tasks-text into project
- Create embeddings utility class
```

#### Phase 2: Core Features
```
- Generate embeddings for job posting sentences
- Generate embeddings for CV sentences
- Calculate cosine similarity between embeddings
- Identify best matching sections
```

#### Phase 3: Enhanced Analysis
```
- Skill extraction using embeddings clusters
- Missing skills detection via low similarity scores
- Section-by-section comparison (requirements vs experience)
```

### Model Details

| Model | Size | Use Case |
|-------|------|----------|
| Universal Sentence Encoder | ~40MB | General text similarity |
| MobileBERT | ~100MB | Higher accuracy, slower |

### Code Architecture

```
src/utils/
├── textAnalyzer.ts      (current keyword matching)
├── textEmbedder.ts      (new: MediaPipe embeddings)
├── similarityCalculator.ts (new: cosine similarity)
└── pdfText.ts           (existing: PDF extraction)
```

### Sample Usage

```typescript
// Generate embeddings
const jobEmbedding = await embedder.embed(jobPosting);
const cvEmbedding = await embedder.embed(cvText);

// Calculate similarity (0-1)
const similarity = cosineSimilarity(jobEmbedding, cvEmbedding);
const matchScore = Math.round(similarity * 100);
```

### Resources

- [MediaPipe Text Tasks](https://developers.google.com/mediapipe/solutions/text/text_embedder)
- [Universal Sentence Encoder](https://tfhub.dev/google/universal-sentence-encoder-lite/2)
- [@mediapipe/tasks-text npm](https://www.npmjs.com/package/@mediapipe/tasks-text)
