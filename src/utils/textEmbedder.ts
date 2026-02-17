// ============================================
// File: src/utils/textEmbedder.ts
// ============================================
import { TextEmbedder, FilesetResolver } from '@mediapipe/tasks-text';

class TextEmbedderService {
  private embedder: TextEmbedder | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private embeddingDebugLogged = false;

  // Hybrid: Pattern hints for quick pre-filtering (not strict matching)
  private readonly patterns = {
    // Technical skills - common across languages
    tech: /\b(python|java|javascript|typescript|react|angular|vue|node|sql|nosql|mongodb|postgres|postgresql|mysql|docker|kubernetes|git|aws|azure|gcp|cloud|linux|windows|api|rest|graphql|html|css|sass|less|webpack|babel|ci\/cd|devops|agile|scrum|kanban|jira|jenkins|gitlab|github|bitbucket|microservices|redis|elasticsearch|kafka|spark|hadoop|tensorflow|pytorch|scikit|pandas|numpy|matplotlib|opencv|nlp|ml|ai|deep.learning|neural|cnn|rnn|lstm|bert|gpt|transformer|flutter|swift|kotlin|android|ios|mobile|unity|unreal|game|c\+\+|c#|csharp|ruby|php|go|golang|rust|scala|perl|shell|bash|powershell|matlab|r\b)\b/gi,
    
    // Soft skills - multilingual patterns
    soft: /\b(communication|kommunikation|viestintä|teamwork|yhteistyö|zusammenarbeit|leadership|johtajuus|führung|collaboration|problem[\s\-]?solving|analytical|creative|innovation|adaptability|flexibility|time[\s\-]?management|organization|critical[\s\-]?thinking|decision[\s\-]?making|conflict[\s\-]?resolution|negotiation|presentation|interpersonal|emotional[\s\-]?intelligence|self[\s\-]?motivated|proactive|detail[\s\-]?oriented|multitasking|strategic|planning)\b/gi,
    
    // Education keywords - multilingual
    education: /\b(bachelor|master|phd|doctorate|diploma|degree|university|college|certification|certificate|certified|licensed|accredited|bsc|msc|mba|ba|ma|beng|meng|associate|undergraduate|graduate|postgraduate|tutkinto|kandidaatti|maisteri|tohtorintutkinto|tohtori|diplomi|yliopisto|korkeakoulu|ammattikorkeakoulu|sertifikaatti|hochschule|universität|abschluss|studium)\b/gi,
    
    // Experience indicators
    experience: /\b(\d+[\+]?\s*(year|years|yr|yrs|vuotta|vuosi|år|jahre|ans)|senior|junior|lead|principal|staff|mid[\s\-]?level|entry[\s\-]?level|experienced|veteran|architect|expert|specialist|beginner|intermediate|advanced|professional)\b/gi,
    
    // Job titles/roles
    title: /\b(developer|engineer|architect|designer|manager|analyst|consultant|administrator|specialist|coordinator|director|officer|representative|technician|scientist|researcher|intern|trainee|assistant|associate|lead|senior|junior|principal|staff|full[\s\-]?stack|front[\s\-]?end|back[\s\-]?end|devops|data|machine[\s\-]?learning|software|web|mobile|cloud|security|network|system|database|qa|quality|test|scrum[\s\-]?master|product[\s\-]?owner|kehittäjä|insinööri|arkkitehti|suunnittelija|päällikkö|johtaja|analyytikko|konsultti)\b/gi,
    
    // Frameworks & tools
    frameworks: /\b(react|angular|vue|svelte|next\.js|nextjs|nuxt|gatsby|remix|express|fastapi|django|flask|spring|springboot|hibernate|laravel|symfony|rails|ruby.on.rails|asp\.net|blazor|electron|capacitor|cordova|ionic|xamarin|flutter|bootstrap|tailwind|material|antd|chakra|redux|mobx|zustand|graphql|apollo|prisma|typeorm|sequelize|mongoose|jest|mocha|cypress|playwright|selenium|webpack|vite|rollup|parcel|grunt|gulp)\b/gi,
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const textFiles = await FilesetResolver.forTextTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-text@latest/wasm'
        );

        this.embedder = await TextEmbedder.createFromOptions(textFiles, {
          baseOptions: {
            modelAssetPath: '/models/universal_sentence_encoder.tflite',
          },
          quantize: true,
        });

        console.log('✅ Language model loaded and ready.');
        this.initialized = true;
        console.log('✅ TextEmbedder initialized (Hybrid Mode: Patterns + Embeddings)');
      } catch (error) {
        console.error('❌ Failed to initialize TextEmbedder:', error);
        this.initialized = false;
        throw error;
      }
    })();
    
    return this.initializationPromise;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      try {
        await this.initialize();
      } catch (error) {
        console.error('Failed to initialize embedder in embed():', error);
        throw error;
      }
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
    try {
      const result = this.embedder.embed(text);
      
      if (!this.embeddingDebugLogged) {
        console.log('[Embedding Debug] result type:', typeof result);
        console.log('[Embedding Debug] result constructor:', result?.constructor?.name);
        
        if (result.embeddings && result.embeddings[0]) {
          const firstEmb = result.embeddings[0];
          console.log('[Embedding Debug] firstEmb type:', typeof firstEmb);
          console.log('[Embedding Debug] firstEmb constructor:', firstEmb?.constructor?.name);
          console.log('[Embedding Debug] firstEmb keys:', Object.keys(firstEmb));
          console.log('[Embedding Debug] firstEmb full object:', firstEmb);
          
          const keys = Object.keys(firstEmb);
          keys.forEach(key => {
            console.log(`[Embedding Debug] Property "${key}":`, typeof (firstEmb as any)[key]);
          });
        }
        this.embeddingDebugLogged = true;
      }
      
      let embedding: number[] = [];
      
      if (result.embeddings && result.embeddings[0]) {
        const firstEmb = result.embeddings[0] as any;
        
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
      }
      
      return embedding;
    } catch (error) {
      console.error('[Embedding] Error during embed():', error);
      throw error;
    }
  }

  async calculateSimilarity(text1: string, text2: string): Promise<number> {
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
   * HYBRID: Extract skills using pattern hints + semantic embeddings
   * Pattern matching provides quick boost, embeddings ensure language-agnostic coverage
   */
  async extractSkillPhrases(text: string): Promise<string[]> {
    if (!this.embedder) {
      await this.initialize();
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
    const sentences = this.splitIntoChunks(text);
    const skills: string[] = [];

    // Few-shot examples instead of single prompts (better accuracy)
    const skillExamples = [
      // Technical skills examples
      'Python programming language',
      'JavaScript and TypeScript',
      'React framework experience',
      'SQL database management',
      'Docker containerization',
      // Soft skills examples
      'strong communication skills',
      'team leadership and collaboration',
      'problem solving ability',
      // Experience examples
      '5 years of software development',
      'senior level position',
      'project management experience',
      // Tools examples
      'Git version control',
      'AWS cloud platform',
      'Agile methodology',
    ];

    // Pre-compute example embeddings
    const exampleEmbeddings = await Promise.all(
      skillExamples.map((ex) => this.embed(ex))
    );

    console.log(`[TextEmbedder Hybrid] Extracting skills from ${sentences.length} phrases`);
    
    let sampleCount = 0;
    for (const sentence of sentences) {
      if (sentence.length < 3) continue;

      // HYBRID SCORING: Pattern match + Semantic similarity
      let patternBoost = 0;
      let semanticScore = 0;

      // Check pattern matches for quick boost
      if (this.patterns.tech.test(sentence)) patternBoost += 0.3;
      if (this.patterns.soft.test(sentence)) patternBoost += 0.25;
      if (this.patterns.frameworks.test(sentence)) patternBoost += 0.3;
      if (this.patterns.experience.test(sentence)) patternBoost += 0.2;
      if (this.patterns.education.test(sentence)) patternBoost += 0.15;

      // Reset regex lastIndex (important for global regex)
      Object.values(this.patterns).forEach(p => p.lastIndex = 0);

      // Calculate semantic similarity against examples
      const sentenceEmb = await this.embed(sentence);
      let maxSim = 0;
      
      for (const exampleEmb of exampleEmbeddings) {
        const sim = this.cosineSimilarity(sentenceEmb, exampleEmb);
        if (sim > maxSim) {
          maxSim = sim;
        }
      }
      
      semanticScore = maxSim;

      // Combined score: Pattern + Semantic
      const combinedScore = Math.min(1.0, patternBoost + semanticScore);

      // Log first 10 samples
      if (sampleCount < 10) {
        console.log(
          `  [${sampleCount}] "${sentence.substring(0, 50)}..." → ` +
          `pattern: ${patternBoost.toFixed(2)}, semantic: ${semanticScore.toFixed(3)}, ` +
          `combined: ${combinedScore.toFixed(3)}`
        );
        sampleCount++;
      }

      // Stricter threshold: 0.40 - filters out irrelevant phrases
      if (combinedScore > 0.40) {
        const cleaned = this.cleanPhrase(sentence);
        // More strict filtering: minimum 5 chars, not just numbers/dates
        if (cleaned && cleaned.length >= 5 && !/^\d+[\s\-\/]*\d*$/.test(cleaned) && !skills.includes(cleaned)) {
          skills.push(cleaned);
          console.log(
            `  ✓✓ DETECTED SKILL (pattern: ${patternBoost.toFixed(2)}, ` +
            `semantic: ${semanticScore.toFixed(3)}): "${cleaned}"`
          );
        }
      }
    }

    console.log(`[TextEmbedder Hybrid] Found ${skills.length} skills total`);
    return skills;
  }

  /**
   * HYBRID: Check if phrase matches a category using patterns + embeddings
   */
  async matchesCategory(
    phrase: string, 
    categoryExamples: string[], 
    patternRegex?: RegExp,
    threshold: number = 0.5
  ): Promise<{ matches: boolean; score: number }> {
    if (!this.embedder) {
      await this.initialize();
    }

    let patternBoost = 0;
    if (patternRegex && patternRegex.test(phrase)) {
      patternBoost = 0.35;
      patternRegex.lastIndex = 0; // Reset
    }

    // Semantic similarity against examples
    const phraseEmb = await this.embed(phrase);
    const exampleEmbeddings = await Promise.all(
      categoryExamples.map(ex => this.embed(ex))
    );

    let maxSim = 0;
    for (const exampleEmb of exampleEmbeddings) {
      const sim = this.cosineSimilarity(phraseEmb, exampleEmb);
      if (sim > maxSim) maxSim = sim;
    }

    const combinedScore = Math.min(1.0, patternBoost + maxSim);
    return {
      matches: combinedScore > threshold,
      score: combinedScore
    };
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
    if (!this.embedder) {
      await this.initialize();
    }
    
    if (!this.embedder) {
      throw new Error('TextEmbedder failed to initialize');
    }
    
    const overallSimilarity = await this.calculateSimilarity(jobPosting, cv);

    const jobPhrases = await this.extractSkillPhrases(jobPosting);
    const cvPhrases = await this.extractSkillPhrases(cv);

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
    // Split by sentence-ending punctuation and line breaks, but NOT hyphens (preserve "full-stack", "problem-solving")
    return text
      .split(/[.•\n;:]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 5 && s.length < 150); // Minimum 5 chars to avoid single words
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