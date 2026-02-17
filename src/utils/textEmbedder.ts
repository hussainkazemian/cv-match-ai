import { TextEmbedder, FilesetResolver } from '@mediapipe/tasks-text';

class TextEmbedderService {
  private embedder: TextEmbedder | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private embeddingDebugLogged = false;

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) return;
    
    // If currently initializing, wait for that promise to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Create the initialization promise and store it
    this.initializationPromise = (async () => {
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
        this.initialized = false;
        throw error;
      }
    })();
    
    return this.initializationPromise;
  }

  async embed(text: string): Promise<number[]> {
    // Ensure embedder is initialized and ready
    if (!this.embedder) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize embedder in embed():', error);
        throw error;
      }
    }
    
    // Double-check embedder is ready
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
    try {
      const result = this.embedder.embed(text);
      
      // Debug first embedding result - log the actual structure
    if (!this.embeddingDebugLogged) {
      console.log('[Embedding Debug] result type:', typeof result);
      console.log('[Embedding Debug] result constructor:', result?.constructor?.name);
      
      // Try to get all properties including non-enumerable ones
      if (result.embeddings && result.embeddings[0]) {
        const firstEmb = result.embeddings[0];
        console.log('[Embedding Debug] firstEmb type:', typeof firstEmb);
        console.log('[Embedding Debug] firstEmb constructor:', firstEmb?.constructor?.name);
        console.log('[Embedding Debug] firstEmb keys:', Object.keys(firstEmb));
        console.log('[Embedding Debug] firstEmb full object:', firstEmb);
        
        // Log all property names and types
        const keys = Object.keys(firstEmb);
        keys.forEach(key => {
          console.log(`[Embedding Debug] Property "${key}":`, typeof (firstEmb as any)[key], (firstEmb as any)[key]);
        });
      }
      this.embeddingDebugLogged = true;
    }
      // Extract embedding
      // TO THIS (try multiple property names):
let embedding: number[] = [];
    
    if (result.embeddings && result.embeddings[0]) {
      const firstEmb = result.embeddings[0] as any;
      
      // Try different possible property names based on MediaPipe API
      if (firstEmb.floatEmbedding) {
        embedding = Array.from(firstEmb.floatEmbedding);
      } else if (firstEmb.embedding) {
        embedding = Array.from(firstEmb.embedding);
      } else if (firstEmb.quantizedEmbedding) {
        embedding = Array.from(firstEmb.quantizedEmbedding);
      } else if (Array.isArray(firstEmb)) {
        embedding = firstEmb;
      } else if (firstEmb.value) {
        embedding = Array.from(firstEmb.value);
      } else {
        // Try to find any array-like property
        const keys = Object.keys(firstEmb);
        for (const key of keys) {
          const val = firstEmb[key];
          if (val && (Array.isArray(val) || (val.length !== undefined && typeof val !== 'string'))) {
            console.log(`[Embedding Debug] ✓ Found embedding data in property: "${key}"`);
            embedding = Array.from(val);
            break;
          }
        }
      }
    }
    
    if (embedding.length === 0) {
      console.warn(`[Embedding] ⚠️ EMPTY EMBEDDING for text: "${text.substring(0, 30)}..."`);
    } else {
      console.log(`[Embedding] ✓ Got ${embedding.length}-dim embedding for: "${text.substring(0, 30)}..."`);
    }
      return embedding;
    } catch (error) {
      console.error('[Embedding] Error during embed():', error);
      throw error;
    }
  }

  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    // Ensure embedder is initialized before proceeding
    if (!this.embedder) {
      await this.initialize();
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
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
    // Ensure embedder is initialized before proceeding
    if (!this.embedder) {
      await this.initialize();
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
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

    console.log(`[TextEmbedder] Extracting skills from ${sentences.length} phrases`);
    
    let sampleCount = 0;
    for (const sentence of sentences) {
      if (sentence.length < 3) continue;

      const sentenceEmb = await this.embed(sentence);

      // Check similarity against each skill category
      let maxSim = 0;
      
      for (let i = 0; i < promptEmbeddings.length; i++) {
        const sim = this.cosineSimilarity(sentenceEmb, promptEmbeddings[i]);
        if (sim > maxSim) {
          maxSim = sim;
        }
      }

      // Log first 10 samples to debug
      if (sampleCount < 10) {
        console.log(`  [${sampleCount}] "${sentence.substring(0, 50)}..." → similarity: ${maxSim.toFixed(3)}`);
        sampleCount++;
      }

      // Lowered threshold to 0.15 - much more lenient
      if (maxSim > 0.15) {
        const cleaned = this.cleanPhrase(sentence);
        if (cleaned && !skills.includes(cleaned)) {
          skills.push(cleaned);
          console.log(`  ✓✓ DETECTED SKILL (sim: ${maxSim.toFixed(3)}): "${cleaned}"`);
        }
      }
    }

    console.log(`[TextEmbedder] Found ${skills.length} skills total`);
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
    // Ensure embedder is initialized before proceeding
    if (!this.embedder) {
      await this.initialize();
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
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
