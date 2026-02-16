import { pipeline, env } from '@xenova/transformers';

// Configure to use local models (avoid downloading repeatedly)
env.allowLocalModels = true;
env.allowRemoteModels = true;

let translatorPipeline: any = null;

// Initialize translator (lazy load)
async function getTranslator() {
  if (!translatorPipeline) {
    console.log('Loading translation model...');
    translatorPipeline = await pipeline('translation', 'Xenova/nllb-200-distilled-600M');
  }
  return translatorPipeline;
}

// Detect language using simple heuristics
// For production, you could use a proper language detection model
export function detectLanguage(text: string): string {
  // Finnish-specific patterns
  const finnishPatterns = /\b(ja|että|ne|hän|vaan|kuin|koska|jos|kun|niiden|mutta)\b/gi;
  const finnishMatches = (text.match(finnishPatterns) || []).length;

  // Common Finnish words
  if (finnishMatches > text.split(/\s+/).length * 0.02) {
    return 'fin_Latn';
  }

  // Default to English
  return 'eng_Latn';
}

// Translate text from source language to English
export async function translateToEnglish(text: string, sourceLang?: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const detectedLang = sourceLang || detectLanguage(text);

    // If already English, skip translation
    if (detectedLang === 'eng_Latn') {
      console.log('Text is already in English, skipping translation');
      return text;
    }

    console.log(`Translating from ${detectedLang} to English...`);
    const translator = await getTranslator();

    // Split into chunks to avoid timeout (limit ~500 chars per chunk)
    const chunks = text.match(/[^.!?]*[.!?]+|[^.!?]*$/g) || [text];
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      if (chunk.trim().length === 0) continue;

      try {
        const result = await translator(chunk.trim(), {
          src_lang: detectedLang,
          tgt_lang: 'eng_Latn',
        });

        translatedChunks.push(result[0].translation_text);
      } catch (error) {
        console.warn('Failed to translate chunk, using original:', error);
        translatedChunks.push(chunk);
      }
    }

    const translatedText = translatedChunks.join(' ').trim();
    console.log('Translation complete');
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // If translation fails, return original text
    return text;
  }
}

// Get language info for UI display
export function getLanguageName(langCode: string): string {
  const languages: Record<string, string> = {
    fin_Latn: 'Finnish',
    eng_Latn: 'English',
    deu_Latn: 'German',
    fra_Latn: 'French',
    spa_Latn: 'Spanish',
    ita_Latn: 'Italian',
    swe_Latn: 'Swedish',
    // Add more as needed
  };
  return languages[langCode] || 'Unknown';
}
