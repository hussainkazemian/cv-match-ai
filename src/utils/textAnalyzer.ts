import { textEmbedder } from './textEmbedder';
import { sectionParser } from './sectionParser';

export interface JobRequirements {
  title: string;
  experience: string;
  education: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  techStack: string[];
  responsibilities: string[];
  softSkills: string[];
}

export interface AnalysisResult {
  jobRequirements: JobRequirements;
  cvSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  matchScore: number;
  recommendations: string[];
  overallSimilarity: number;
}

class TextAnalyzer {
  /**
   * Extract skills from text using section-based parsing
   * Much cleaner than pure semantic extraction
   */
  async extractSkills(text: string): Promise<string[]> {
    try {
      console.log('[TextAnalyzer] Extracting skills from CV...');
      
      // Use section parser to extract skills
      const sections = sectionParser.parseSections(text);
      const allSkills = sectionParser.getAllSkills(sections);
      
      const skillMap = new Map<string, string>();
      for (const skill of allSkills) {
        const normalized = this.normalizeSkill(skill);
        if (!normalized) continue;
        const key = normalized.toLowerCase();
        if (!skillMap.has(key)) {
          skillMap.set(key, normalized);
        }
      }

      const sectionSkillCount = skillMap.size;
      console.log(`[TextAnalyzer] Section-based skills detected: ${sectionSkillCount}`);

      // Hybrid fallback: if CV lacks explicit skill sections, use semantic extractor
      if (sectionSkillCount < 5) {
        console.log('[TextAnalyzer] Limited section-based skills found, running hybrid fallback...');
        const fallbackSkills = await textEmbedder.extractSkillPhrases(text);
        for (const skill of fallbackSkills) {
          const normalized = this.normalizeSkill(skill);
          if (!normalized) continue;
          const key = normalized.toLowerCase();
          if (!skillMap.has(key)) {
            skillMap.set(key, normalized);
          }
        }
        console.log(
          `[TextAnalyzer] Hybrid fallback added ${skillMap.size - sectionSkillCount} additional skills`
        );
      }
      
      return Array.from(skillMap.values()).sort((a, b) => a.localeCompare(b));
    } catch (error) {
      console.error('Skill extraction failed:', error);
      return [];
    }
  }

  /**
   * CLEAN APPROACH: Parse job posting using section detection
   * Looks for explicit section headers, then extracts content
   * Much more reliable than pure semantic guessing
   */
  async parseJobPosting(jobPosting: string): Promise<JobRequirements> {
    console.log('[TextAnalyzer] Parsing job posting with section-based approach...');
    
    // Step 1: Parse sections from job posting
    const sections = sectionParser.parseSections(jobPosting);
    
    console.log('[TextAnalyzer] Extracted sections:', {
      title: sections.title.length,
      experience: sections.experience.length,
      education: sections.education.length,
      skills: sections.skills.length,
      requirements: sections.requirements.length,
      niceToHave: sections.niceToHave.length,
      responsibilities: sections.responsibilities.length,
    });
    
    // Step 2: Extract and organize data
    const title = sections.title.length > 0 ? sections.title[0] : 'Position';
    
    // Experience: look for years, seniority level
    let experience = 'Not specified';
    if (sections.experience.length > 0) {
      // Find the most descriptive experience requirement
      const expWithYears = sections.experience.find(exp => /\d+/.test(exp));
      experience = expWithYears || sections.experience[0];
      console.log(`[TextAnalyzer] Experience: "${experience}"`);
    } else {
      // Fallback: check all text for experience mentions
      const expMatch = jobPosting.match(/\b(\d+[\+]?\s*(years?|yrs?|vuotta|vuosi)|senior|junior|mid[\s\-]?level|experienced)\b/i);
      if (expMatch) {
        experience = expMatch[0];
        console.log(`[TextAnalyzer] Experience (fallback): "${experience}"`);
      }
    }
    
    // Education: directly from sections  
    const education = [...new Set(sections.education)];
    if (education.length > 0) {
      console.log(`[TextAnalyzer] Education (${education.length}):`, education);
    }
    
    // Skills: from requirements, nice-to-have, and skills sections
    let requiredSkills = [...new Set([...sections.requirements, ...sections.skills])];
    let niceToHaveSkills = [...new Set(sections.niceToHave)];
    
    const sectionSkillCount = requiredSkills.length + niceToHaveSkills.length;
    console.log(`[TextAnalyzer] Section-based skills extracted:`, {
      required: requiredSkills.length,
      niceToHave: niceToHaveSkills.length,
      total: sectionSkillCount
    });
    
    // HYBRID FALLBACK: If section parsing yields too few skills, use semantic extraction
    if (sectionSkillCount < 5) {
      console.log('[TextAnalyzer] Limited skills from sections, running hybrid semantic fallback...');
      const fallbackSkills = await textEmbedder.extractSkillPhrases(jobPosting);
      
      // Deduplicate and merge
      const skillMap = new Map<string, string>();
      
      // Add existing section-based skills
      for (const skill of [...requiredSkills, ...niceToHaveSkills]) {
        const normalized = this.normalizeSkill(skill);
        if (normalized) {
          skillMap.set(normalized.toLowerCase(), normalized);
        }
      }
      
      // Add fallback semantic skills
      for (const skill of fallbackSkills) {
        const normalized = this.normalizeSkill(skill);
        if (normalized) {
          const key = normalized.toLowerCase();
          if (!skillMap.has(key)) {
            skillMap.set(key, normalized);
          }
        }
      }
      
      const mergedSkills = Array.from(skillMap.values());
      requiredSkills = mergedSkills; // Treat all as required if sections were unclear
      niceToHaveSkills = [];
      
      console.log(
        `[TextAnalyzer] Hybrid fallback added ${mergedSkills.length - sectionSkillCount} skills ` +
        `(total now: ${mergedSkills.length})`
      );
    }
    
    if (requiredSkills.length > 0) {
      console.log(`[TextAnalyzer] Required skills sample:`, requiredSkills.slice(0, 5));
    }
    
    // Responsibilities
    const responsibilities = [...new Set(sections.responsibilities)].slice(0, 5);
    
    // Validate and categorize skills using hybrid approach (optional quality check)
    const techStack: string[] = [];
    const softSkills: string[] = [];
    
    // Quick categorization based on patterns
    const allSkillItems = [...requiredSkills, ...niceToHaveSkills];
    for (const item of allSkillItems) {
      // Check if it's a tech skill (pattern matching)
      if (/\b(python|java|javascript|typescript|react|angular|vue|node|sql|mongodb|docker|kubernetes|aws|azure|git|api|html|css|framework|library|database)\b/i.test(item) && !techStack.includes(item)) {
        techStack.push(item);
      }
      // Check if it's a soft skill
      else if (/\b(communication|teamwork|leadership|collaboration|problem[\s\-]?solving|analytical|creative|flexible|organized)\b/i.test(item) && !softSkills.includes(item)) {
        softSkills.push(item);
      }
    }
    
    console.log('[TextAnalyzer] Parsing complete:', {
      title,
      experience,
      educationCount: education.length,
      requiredSkillsCount: requiredSkills.length,
      niceToHaveCount: niceToHaveSkills.length,
      techStackCount: techStack.length,
      softSkillsCount: softSkills.length,
      responsibilitiesCount: responsibilities.length,
    });

    return {
      title,
      experience,
      education,
      requiredSkills,
      niceToHaveSkills,
      techStack,
      responsibilities,
      softSkills,
    };
  }

  /**
   * Analyze job posting vs CV with section-based parsing + semantic matching
   */
  async analyze(jobPosting: string, cv: string, _language: string = 'eng_Latn'): Promise<AnalysisResult> {
    console.log('[TextAnalyzer] Starting analysis...');
    
    // Parse both job posting and CV using section-based approach
    const jobRequirements = await this.parseJobPosting(jobPosting);
    const cvSkills = await this.extractSkills(cv);
    
    // All job skills to check
    const allJobSkills = [
      ...jobRequirements.requiredSkills,
      ...jobRequirements.niceToHaveSkills,
      ...jobRequirements.techStack,
      ...jobRequirements.softSkills,
    ];

    console.log(`[TextAnalyzer] Comparing ${allJobSkills.length} job skills with ${cvSkills.length} CV skills`);

    // Match skills using semantic similarity
    const matchingSkills: string[] = [];
    const matchedJobSkills = new Set<string>();

    for (const jobSkill of allJobSkills) {
      // First try exact/fuzzy string matching (faster)
      const exactMatch = cvSkills.find(cvSkill => 
        cvSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(cvSkill.toLowerCase())
      );
      
      if (exactMatch) {
        matchingSkills.push(jobSkill);
        matchedJobSkills.add(jobSkill);
        console.log(`  ✓ Exact match: "${jobSkill}" ↔ "${exactMatch}"`);
        continue;
      }
      
      // Fallback to semantic similarity for related terms
      for (const cvSkill of cvSkills) {
        const similarity = await textEmbedder.calculateSimilarity(jobSkill, cvSkill);
        if (similarity > 0.65) { // Slightly higher threshold for semantic
          matchingSkills.push(jobSkill);
          matchedJobSkills.add(jobSkill);
          console.log(`  ✓ Semantic match (${(similarity * 100).toFixed(0)}%): "${jobSkill}" ↔ "${cvSkill}"`);
          break;
        }
      }
    }

    const uniqueMatchingSkills = [...new Set(matchingSkills)];
    const missingSkills = allJobSkills.filter(skill => !matchedJobSkills.has(skill));

    // Calculate match score based on required skills only
    const requiredMatchingSkills = jobRequirements.requiredSkills.filter(skill => 
      uniqueMatchingSkills.includes(skill)
    );
    
    const matchScore = jobRequirements.requiredSkills.length > 0
      ? Math.round((requiredMatchingSkills.length / jobRequirements.requiredSkills.length) * 100)
      : 0;

    // Overall document similarity
    let overallSimilarity = 0;
    try {
      overallSimilarity = await textEmbedder.calculateSimilarity(jobPosting, cv);
    } catch (error) {
      console.warn('Overall similarity calculation failed:', error);
    }

    const recommendations = this.generateRecommendations(
      matchScore,
      uniqueMatchingSkills,
      missingSkills,
      cv,
      jobRequirements
    );

    console.log(`[TextAnalyzer] Analysis complete: ${matchScore}% match, ${uniqueMatchingSkills.length} matching skills, ${missingSkills.length} missing`);

    return {
      jobRequirements,
      cvSkills,
      matchingSkills: uniqueMatchingSkills,
      missingSkills,
      matchScore,
      recommendations,
      overallSimilarity: Math.round(overallSimilarity * 100),
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    matchScore: number,
    matchingSkills: string[],
    missingSkills: string[],
    cv: string,
    jobRequirements: JobRequirements
  ): string[] {
    const recommendations: string[] = [];
    const translations = this.getRecommendationTranslations();

    if (matchScore >= 80) {
      recommendations.push(translations.excellent);
      recommendations.push(translations.coverLetter);
    } else if (matchScore >= 60) {
      recommendations.push(translations.good);
      recommendations.push(translations.gainExperience);
    } else if (matchScore >= 40) {
      recommendations.push(translations.partial);
      recommendations.push(translations.focusLearning);
    } else {
      recommendations.push(translations.low);
      recommendations.push(translations.considerOtherRoles);
    }

    const missingRequired = jobRequirements.requiredSkills.filter(skill => 
      missingSkills.includes(skill)
    );
    
    if (missingRequired.length > 0 && missingRequired.length <= 5) {
      recommendations.push(
        `📚 ${translations.prioritySkills}: ${missingRequired.join(', ')}`
      );
    } else if (missingRequired.length > 5) {
      recommendations.push(
        `📚 ${translations.topSkills}: ${missingRequired.slice(0, 5).join(', ')}`
      );
    }

    const wordCount = cv.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      recommendations.push(translations.cvTooShort);
    } else if (wordCount > 1000) {
      recommendations.push(translations.cvTooLong);
    }

    if (matchingSkills.length > 0) {
      recommendations.push(
        `✅ ${translations.highlightSkills}: ${matchingSkills.slice(0, 5).join(', ')}`
      );
    }

    if (jobRequirements.education.length > 0) {
      recommendations.push(
        `🎓 ${translations.educationRequired}: ${jobRequirements.education[0]}`
      );
    }

    return recommendations;
  }

  /**
   * Get recommendation text in English
   */
  private getRecommendationTranslations(): Record<string, string> {
    return {
      excellent: '🎉 Excellent match! Your CV aligns very well with this job posting.',
      coverLetter: '📝 Consider tailoring your cover letter to highlight your matching skills.',
      good: '👍 Good match! You have many of the required skills.',
      gainExperience: '📚 Consider gaining experience in the missing skills to improve your chances.',
      partial: '🤔 Partial match. You have some relevant skills but are missing key requirements.',
      focusLearning: '💡 Focus on acquiring the missing technical skills through courses or projects.',
      low: '⚠️ Low match. This position may require significant skill development.',
      considerOtherRoles: '🎯 Consider roles that better match your current skill set, or invest time in learning the required skills.',
      prioritySkills: 'Priority skills to learn',
      topSkills: 'Top skills to focus on',
      cvTooShort: '✍️ Your CV seems short. Add more details about your experience and accomplishments.',
      cvTooLong: '📄 Your CV is quite detailed. Consider condensing it for better readability.',
      highlightSkills: 'Highlight these matching skills prominently',
      educationRequired: 'Education required',
    };
  }

  private normalizeSkill(skill: string): string {
    return skill
      .replace(/^[\s\-•*]+/, '')
      .replace(/[\s\-•*]+$/, '')
      .replace(/[.,;:]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const textAnalyzer = new TextAnalyzer();