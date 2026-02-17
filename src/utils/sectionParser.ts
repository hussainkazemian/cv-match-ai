/**
 * Section-based text parser for job postings and CVs
 * Detects section headers and extracts content under each section
 * Supports English, Finnish, Swedish, German, and other European languages
 */

interface ParsedSections {
  title: string[];
  experience: string[];
  education: string[];
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
}

class SectionParser {
  // Multilingual section header patterns
  private readonly sectionHeaders = {
    // Job Title/Position
    title: /\b(position|role|title|vacancy|opening|job title|we are looking for|we're hiring|hiring for|etsimme|haluamme|rekrytointi|tjänst|stilling|stelle|poste)\b/gi,
    
    // Experience
    experience: /\b(experience|work experience|employment history|professional experience|work history|background|kokemus|työkokemus|työkokemuksesi|erfarenhet|erfaring|erfahrung|expérience)\b/gi,
    
    // Education
    education: /\b(education|qualification|degree|academic|studies|training|certification|koulutus|tutkinto|opinnot|utbildning|ausbildung|studium|formation|éducation)\b/gi,
    
    // Skills (Technical + Soft)
    skills: /\b(skills|competencies|expertise|technical skills|technologies|tech stack|tools|abilities|taidot|osaaminen|kompetenssi|kompetens|färdigheter|fähigkeiten|kompetenzen|compétences)\b/gi,
    
    // Requirements (Must-have)
    requirements: /\b(requirements|required|must have|mandatory|essential|prerequisite|necessary|qualifications needed|vaatimukset|vaatimuksia|vaaditaan|pakollinen|krav|nödvändig|erforderlich|obligatorisch|requis|obligatoire)\b/gi,
    
    // Nice-to-have
    niceToHave: /\b(nice to have|preferred|bonus|plus|advantage|optional|nice if|would be great|desirable|lisäksi|plussaa|eduksi|önskvärt|bonus|vorteilhaft|wünschenswert|souhaitable|un plus)\b/gi,
    
    // Responsibilities
    responsibilities: /\b(responsibilities|duties|tasks|you will|what you'll do|your role|job description|tehtävät|vastuut|työtehtävät|arbetsuppgifter|aufgaben|verantwortlichkeiten|responsabilités|tâches)\b/gi,
  };

  /**
   * Parse text into structured sections
   */
  parseSections(text: string): ParsedSections {
    const lines = this.splitIntoLines(text);
    
    const sections: ParsedSections = {
      title: [],
      experience: [],
      education: [],
      skills: [],
      responsibilities: [],
      requirements: [],
      niceToHave: [],
    };

    let currentSection: keyof ParsedSections | null = null;
    let sectionContent: string[] = [];

    console.log(`[SectionParser] Parsing ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 2) continue;

      // Check if this line is a section header
      const detectedSection = this.detectSectionHeader(line);
      
      if (detectedSection) {
        // Save previous section content
        if (currentSection && sectionContent.length > 0) {
          sections[currentSection].push(...sectionContent);
          console.log(`  ✓ Found section [${currentSection}]: ${sectionContent.length} items`);
        }
        
        // Start new section
        currentSection = detectedSection;
        sectionContent = [];
        console.log(`  → Detected section header: [${currentSection}] in line "${line.substring(0, 50)}..."`);
        continue;
      }

      // If we're in a section, collect content
      if (currentSection) {
        const items = this.extractItemsFromLine(line);
        if (items.length > 0) {
          sectionContent.push(...items);
        }
      } else {
        // No section detected yet - check if line looks like a job title
        if (i < 5 && this.looksLikeJobTitle(line)) {
          sections.title.push(line);
          console.log(`  ✓ Auto-detected title: "${line}"`);
        }
      }
    }

    // Save last section
    if (currentSection && sectionContent.length > 0) {
      sections[currentSection].push(...sectionContent);
      console.log(`  ✓ Found section [${currentSection}]: ${sectionContent.length} items`);
    }

    // If no explicit sections found, try fallback extraction
    if (this.isEmpty(sections)) {
      console.log('  ⚠ No sections detected, using fallback extraction');
      return this.fallbackExtraction(text);
    }

    return sections;
  }

  /**
   * Detect which section this line belongs to
   * Section headers must be:
   * - Short (< 100 chars)
   * - Not starting with bullets
   * - Not too detailed (contains keyword but not excessive content)
   */
  private detectSectionHeader(line: string): keyof ParsedSections | null {
    // Must be reasonably short to be a header
    if (line.length > 100) return null;
    
    // Must not start with bullet points (those are content items)
    if (/^[\s\-•●○◦▪▫★✓✔→➤➢⋅⁃]/.test(line)) return null;
    
    // Check if line is MOSTLY just the header keyword (not detailed content)
    // Header examples: "Skills:", "Experience", "Requirements:"
    // NOT headers: "Experience with React and Node.js in production environments"
    
    const cleanLine = line.replace(/[:\-\s]+$/, '').trim().toLowerCase();
    
    // Check against each section pattern  
    // For each, verify the line is SHORT or ends with colon (typical header format)
    const hasColon = /:\s*$/.test(line);
    const isShort = cleanLine.length < 40; // Reduced from 50 for stricter matching
    
    if (this.sectionHeaders.title.test(line) && (hasColon || isShort || /^(position|role|title|vacancy|job title|we are looking for)/i.test(cleanLine))) {
      this.sectionHeaders.title.lastIndex = 0;
      return 'title';
    }
    if (this.sectionHeaders.experience.test(line) && (hasColon || (isShort && /^(experience|work experience|employment|professional experience|background)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.experience.lastIndex = 0;
      return 'experience';
    }
    if (this.sectionHeaders.education.test(line) && (hasColon || (isShort && /^(education|qualification|degree|academic|studies|training|certification)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.education.lastIndex = 0;
      return 'education';
    }
    if (this.sectionHeaders.skills.test(line) && (hasColon || (isShort && /^(skills|competencies|expertise|technical skills|technologies|tech stack|tools|abilities)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.skills.lastIndex = 0;
      return 'skills';
    }
    if (this.sectionHeaders.requirements.test(line) && (hasColon || (isShort && /^(requirements|required|qualifications|must have|prerequisites)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.requirements.lastIndex = 0;
      return 'requirements';
    }
    if (this.sectionHeaders.niceToHave.test(line) && (hasColon || (isShort && /^(nice to have|preferred|bonus|plus|optional)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.niceToHave.lastIndex = 0;
      return 'niceToHave';
    }
    if (this.sectionHeaders.responsibilities.test(line) && (hasColon || (isShort && /^(responsibilities|duties|tasks|what you'll do|your role)s?$/i.test(cleanLine)))) {
      this.sectionHeaders.responsibilities.lastIndex = 0;
      return 'responsibilities';
    }

    return null;
  }

  /**
   * Extract individual items from a line (handles bullets, commas, etc.)
   */
  private extractItemsFromLine(line: string): string[] {
    const items: string[] = [];
    
    // Remove bullet points and clean
    const cleaned = line
      .replace(/^[\s\-•●○◦▪▫★✓✔→➤➢⋅⁃]*/, '') // Remove leading bullets
      .replace(/^[\d]+[\.)]\s*/, '') // Remove numbered lists (1. 2.)
      .trim();

    if (cleaned.length < 3) return items;

    // Check if line contains comma-separated items
    if (cleaned.includes(',') && cleaned.length < 200) {
      // Split by commas
      const parts = cleaned.split(/,\s*(?:and\s+)?|,\s*(?:ja\s+)?/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.length >= 3 && trimmed.length < 100) {
          items.push(trimmed);
        }
      }
    } else {
      // Single item
      if (cleaned.length >= 3 && cleaned.length < 200) {
        items.push(cleaned);
      }
    }

    return items;
  }

  /**
   * Check if a line looks like a job title (used for first few lines)
   */
  private looksLikeJobTitle(line: string): boolean {
    // Job titles are usually:
    // - Short (10-80 chars)
    // - Contain job-related words
    // - Not bullet points
    
    if (line.length < 10 || line.length > 80) return false;
    if (line.startsWith('-') || line.startsWith('•')) return false;
    
    const jobTitleWords = /\b(developer|engineer|architect|designer|manager|analyst|specialist|consultant|coordinator|administrator|director|lead|senior|junior|full[\s\-]?stack|front[\s\-]?end|back[\s\-]?end|data|software|web|mobile|cloud|devops|kehittäjä|insinööri|arkkitehti|päällikkö|asiantuntija)\b/gi;
    
    return jobTitleWords.test(line);
  }

  /**
   * Fallback: If no sections detected, try intelligent extraction
   */
  private fallbackExtraction(text: string): ParsedSections {
    console.log('  [Fallback] Attempting inline keyword extraction...');
    
    const sections: ParsedSections = {
      title: [],
      experience: [],
      education: [],
      skills: [],
      responsibilities: [],
      requirements: [],
      niceToHave: [],
    };

    const lines = this.splitIntoLines(text);
    
    // First line often contains title
    if (lines.length > 0 && this.looksLikeJobTitle(lines[0])) {
      sections.title.push(lines[0].trim());
      console.log(`  [Fallback] Title: "${lines[0].trim()}"`);
    }

    // Extract items from remaining text using inline keyword detection
    for (const line of lines.slice(1)) {
      const items = this.extractItemsFromLine(line);
      
      for (const item of items) {
        if (item.length < 5) continue; // Skip very short items
        
        // Check inline keywords (experience indicators)
        if (/\b(\d+[\+]?\s*(year|vuotta|år)|years of|kokemus|experience|erfahrung)\b/i.test(item)) {
          sections.experience.push(item);
          console.log(`  [Fallback] Experience: "${item.substring(0, 60)}..."`);
        }
        // Education indicators
        else if (/\b(bachelor|master|degree|university|college|bsc|msc|phd|tutkinto|yliopisto|diploma)\b/i.test(item)) {
          sections.education.push(item);
          console.log(`  [Fallback] Education: "${item.substring(0, 60)}..."`);
        }
        // Nice-to-have indicators
        else if (/\b(nice.to.have|preferred|bonus|optional|plus|advantage|plussaa|eduksi)\b/i.test(item)) {
          sections.niceToHave.push(item);
          console.log(`  [Fallback] Nice-to-have: "${item.substring(0, 60)}..."`);
        }
        // Required/Must-have indicators
        else if (/\b(required|must.have|mandatory|essential|necessary|vaaditaan|pakollinen)\b/i.test(item)) {
          sections.requirements.push(item);
          console.log(`  [Fallback] Required: "${item.substring(0, 60)}..."`);
        }
        // Responsibilities (action verbs)
        else if (/\b(develop|design|implement|maintain|manage|lead|build|create|work with|collaborate|testaa|kehittää)\b/i.test(item)) {
          sections.responsibilities.push(item);
          console.log(`  [Fallback] Responsibility: "${item.substring(0, 60)}..."`);
        }
        // Default to skills if it looks skill-like (tech terms, not sentences)
        else if (item.length >= 5 && item.length < 100) {
          sections.skills.push(item);
          console.log(`  [Fallback] Skill: "${item.substring(0, 60)}..."`);
        }
      }
    }

    console.log('  ✓ Fallback extraction completed:', {
      title: sections.title.length,
      experience: sections.experience.length,
      education: sections.education.length,
      skills: sections.skills.length,
      requirements: sections.requirements.length,
      niceToHave: sections.niceToHave.length,
      responsibilities: sections.responsibilities.length
    });
    
    return sections;
  }

  /**
   * Split text into lines, preserving structure
   */
  private splitIntoLines(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Check if parsed sections are empty
   */
  private isEmpty(sections: ParsedSections): boolean {
    return Object.values(sections).every(arr => arr.length === 0);
  }

  /**
   * Get all skills from multiple sections
   */
  getAllSkills(sections: ParsedSections): string[] {
    return [
      ...sections.skills,
      ...sections.requirements,
      ...sections.niceToHave,
    ];
  }
}

export const sectionParser = new SectionParser();
export type { ParsedSections };
