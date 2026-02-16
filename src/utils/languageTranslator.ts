// Detect language using pattern matching
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) {
    return 'eng_Latn';
  }

  // Finnish-specific patterns
  const finnishPatterns = /\b(ja|että|ne|hän|vaan|kuin|koska|jos|kun|niiden|mutta|on|ei|sen|tämä|siis|niin|vielä|myös)\b/gi;
  const finnishMatches = (text.match(finnishPatterns) || []).length;
  const wordCount = text.split(/\s+/).length;

  // If Finnish pattern matches are more than 2% of words
  if (wordCount > 10 && finnishMatches > wordCount * 0.02) {
    return 'fin_Latn';
  }

  // Swedish patterns
  const swedishPatterns = /\b(och|det|att|en|är|som|på|de|med|han|den|ett|från|var|då|många|några)\b/gi;
  const swedishMatches = (text.match(swedishPatterns) || []).length;
  
  if (wordCount > 10 && swedishMatches > wordCount * 0.02) {
    return 'swe_Latn';
  }

  // Default to English
  return 'eng_Latn';
}

// Get language display name
export function getLanguageName(langCode: string): string {
  const languages: Record<string, string> = {
    fin_Latn: 'Finnish',
    eng_Latn: 'English',
    swe_Latn: 'Swedish',
    deu_Latn: 'German',
    fra_Latn: 'French',
    spa_Latn: 'Spanish',
    ita_Latn: 'Italian',
    nor_Latn: 'Norwegian',
    dan_Latn: 'Danish',
  };
  return languages[langCode] || 'Unknown';
}
