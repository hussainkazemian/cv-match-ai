import { TextEmbedder, FilesetResolver } from '@mediapipe/tasks-text';

class TextEmbedderService {
  private embedder: TextEmbedder | null = null;
  private initialized = false;
  private initializing = false;

  async initialize(): Promise<void> {
    if (this.initialized || this.initializing) return;

    this.initializing = true;
    try {
      const textFiles = await FilesetResolver.forTextTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm'
      );

      this.embedder = await TextEmbedder.createFromOptions(textFiles, {
        baseOptions: {
          // Use local model from public folder
          modelAssetPath: '/models/universal_sentence_encoder.tflite',
        },
        quantize: true,
      });

      this.initialized = true;
      console.log('✅ TextEmbedder initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TextEmbedder:', error);
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.initialize();
    }
    const result = this.embedder!.embed(text);
    return Array.from(result.embeddings[0].floatEmbedding ?? []);
  }

  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    const [emb1, emb2] = await Promise.all([this.embed(text1), this.embed(text2)]);
    return this.cosineSimilarity(emb1, emb2);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Extract phrases from text that are semantically similar to skill-related concepts.
   * No hardcoded keywords - uses embeddings to find skill-like phrases.
   */
  async extractSkillPhrases(text: string): Promise<string[]> {
    const sentences = this.splitIntoChunks(text);
    const skills: string[] = [];

    // Skill category prompts - the model finds similar phrases
    const skillPrompts = [
      'programming language or technology skill',
      'software development framework or tool',
      'professional work experience',
      'soft skill or interpersonal ability',
      'education or certification',
      'technical competency',
    ];

    // Pre-compute prompt embeddings
    const promptEmbeddings = await Promise.all(
      skillPrompts.map((p) => this.embed(p))
    );

    for (const sentence of sentences) {
      if (sentence.length < 3) continue;

      const sentenceEmb = await this.embed(sentence);

      // Check similarity against each skill category
      for (const promptEmb of promptEmbeddings) {
        const sim = this.cosineSimilarity(sentenceEmb, promptEmb);
        if (sim > 0.35) {
          // Threshold for "skill-like" content
          const cleaned = this.cleanPhrase(sentence);
          if (cleaned && !skills.includes(cleaned)) {
            skills.push(cleaned);
          }
          break;
        }
      }
    }

    return skills;
  }

  /**
   * Compare job requirements against CV and find matches/gaps
   */
  async compareTexts(
    jobPosting: string,
    cv: string
  ): Promise<{
    overallSimilarity: number;
    jobPhrases: string[];
    cvPhrases: string[];
    matches: Array<{ job: string; cv: string; similarity: number }>;
    gaps: string[];
  }> {
    // Get overall similarity
    const overallSimilarity = await this.calculateSimilarity(jobPosting, cv);

    // Extract skill phrases from both
    const jobPhrases = await this.extractSkillPhrases(jobPosting);
    const cvPhrases = await this.extractSkillPhrases(cv);

    // Find matches - job phrases that have similar CV phrases
    const matches: Array<{ job: string; cv: string; similarity: number }> = [];
    const matchedJobPhrases = new Set<string>();

    for (const jobPhrase of jobPhrases) {
      const jobEmb = await this.embed(jobPhrase);

      let bestMatch = { cv: '', similarity: 0 };
      for (const cvPhrase of cvPhrases) {
        const cvEmb = await this.embed(cvPhrase);
        const sim = this.cosineSimilarity(jobEmb, cvEmb);
        if (sim > bestMatch.similarity) {
          bestMatch = { cv: cvPhrase, similarity: sim };
        }
      }

      if (bestMatch.similarity > 0.5) {
        matches.push({ job: jobPhrase, cv: bestMatch.cv, similarity: bestMatch.similarity });
        matchedJobPhrases.add(jobPhrase);
      }
    }

    // Gaps are job phrases without good CV matches
    const gaps = jobPhrases.filter((jp) => !matchedJobPhrases.has(jp));

    return {
      overallSimilarity,
      jobPhrases,
      cvPhrases,
      matches,
      gaps,
    };
  }

  private splitIntoChunks(text: string): string[] {
    // Split by common delimiters
    return text
      .split(/[.•\-\n,;:]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length < 100);
  }

  private cleanPhrase(phrase: string): string {
    return phrase
      .replace(/^[\s\-•*]+/, '')
      .replace(/[\s\-•*]+$/, '')
      .trim()
      .toLowerCase();
  }

  isReady(): boolean {
    return this.initialized;
  }
}

export const textEmbedder = new TextEmbedderService();
