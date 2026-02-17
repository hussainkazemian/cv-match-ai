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
      let filteredCount = 0;
      
      for (const skill of allSkills) {
        const normalized = this.normalizeSkill(skill);
        if (!normalized) continue;
        
        // FILTER: Only keep items that look like actual skills
        if (!this.isValidSkill(normalized)) {
          filteredCount++;
          continue;
        }
        
        const key = normalized.toLowerCase();
        if (!skillMap.has(key)) {
          skillMap.set(key, normalized);
        }
      }

      const sectionSkillCount = skillMap.size;
      console.log(
        `[TextAnalyzer] Section-based skills: ${sectionSkillCount} valid, ${filteredCount} filtered out`
      );

      // Hybrid fallback: if CV lacks explicit skill sections, use semantic extractor
      if (sectionSkillCount < 5) {
        console.log('[TextAnalyzer] Limited section-based skills found, running hybrid fallback...');
        const fallbackSkills = await textEmbedder.extractSkillPhrases(text);
        let fallbackFilteredCount = 0;
        
        for (const skill of fallbackSkills) {
          const normalized = this.normalizeSkill(skill);
          if (!normalized) continue;
          
          // FILTER: Validate fallback skills too
          if (!this.isValidSkill(normalized)) {
            fallbackFilteredCount++;
            continue;
          }
          
          const key = normalized.toLowerCase();
          if (!skillMap.has(key)) {
            skillMap.set(key, normalized);
          }
        }
        console.log(
          `[TextAnalyzer] Hybrid fallback: ${skillMap.size - sectionSkillCount} valid skills added, ` +
          `${fallbackFilteredCount} filtered out`
        );
      }
      
      const finalSkills = Array.from(skillMap.values()).sort((a, b) => a.localeCompare(b));
      console.log(`[TextAnalyzer] ✓ Total CV skills extracted: ${finalSkills.length}`);
      
      return finalSkills;
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
    
    // Title/Position: Smart extraction
    let title = 'Not specified';
    if (sections.title.length > 0) {
      title = sections.title[0];
      console.log(`[TextAnalyzer] Title (from section): "${title}"`);
    } else {
      // Fallback: Look for job titles in first few lines
      const lines = jobPosting.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        const line = lines[i];
        // Skip lines that are clearly not titles
        if (line.length < 5 || line.length > 100) continue;
        if (/^(about|description|overview|summary|we are|we're|we're looking|company|location|salary|compensation|type:|posted|deadline|application|apply|benefits|perks|responsibilities|requirements|qualifications|what you|who you|what we|who we)/i.test(line)) continue;
        
        // Check if line contains job title keywords
        const hasJobKeywords = /\b(developer|engineer|architect|designer|manager|analyst|specialist|consultant|coordinator|administrator|director|officer|lead|head|chief|senior|junior|intern|trainee|assistant|associate|principal|staff|full[\s\-]?stack|front[\s\-]?end|back[\s\-]?end|data|software|web|mobile|cloud|devops|devsecops|sre|product|project|program|scrum|agile|qa|quality|test|security|network|system|database|ml|ai|machine[\s\-]?learning|data[\s\-]?scientist|kehittäjä|insinööri|arkkitehti|suunnittelija|päällikkö|johtaja|analyytikko|asiantuntija|konsultti)\b/i.test(line);
        
        if (hasJobKeywords) {
          title = line;
          console.log(`[TextAnalyzer] Title (auto-detected): "${title}"`);
          break;
        }
      }
      
      // Still not found? Try looking for "position:" or "job title:" patterns
      if (title === 'Not specified') {
        const titleMatch = jobPosting.match(/(?:position|job title|role|title|vacancy|opening|hiring for|looking for|seeking)[\s:]+([^\n\.]{5,100})/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          console.log(`[TextAnalyzer] Title (pattern match): "${title}"`);
        }
      }
      
      // Last resort: use first substantial line
      if (title === 'Not specified') {
        const firstLine = lines.find(l => l.length >= 5 && l.length <= 100);
        if (firstLine) {
          title = firstLine;
          console.log(`[TextAnalyzer] Title (first line): "${title}"`);
        }
      }
    }
    
    // Experience: Smart extraction with better context
    let experience = 'Not specified';
    if (sections.experience.length > 0) {
      // Find the most descriptive experience requirement (prefer ones with numbers)
      const expWithYears = sections.experience.find(exp => /\d+/.test(exp));
      experience = expWithYears || sections.experience[0];
      console.log(`[TextAnalyzer] Experience (from section): "${experience}"`);
    } else {
      // Fallback: Search entire text for experience patterns with context
      const expPatterns = [
        // Detailed patterns with full context - order matters (most specific first)
        // "5+ years of experience in software development" (English/Finnish only)
        /(\d+[\+]?\s*(?:to|till|\-|tai)?\s*\d*[\+]?\s*(?:years?|yrs?|vuotta|vuoden)(?:\s+of)?\s+(?:experience|work experience|professional experience|relevant experience|kokemus|työkokemus)(?:\s+in|\s+with|\s+as)?[^\n\.]{0,50})/i,
        // "Minimum 3 years" or "At least 5 years" (English/Finnish)
        /((?:minimum|at least|min|atleast|minimum of|vähintään)\s+\d+[\+]?\s*(?:years?|yrs?|vuotta)(?:\s+of)?\s*(?:experience|kokemus)?)/i,
        // Seniority with optional years: "Senior level (5+ years)"
        /((?:senior|junior|mid[\s\-]?level|entry[\s\-]?level|lead|principal|staff)(?:\s+level)?(?:\s*[\(\[]?\s*\d+[\+]?\s*(?:years?|yrs?|vuotta)?\s*[\)\]]?)?)/i,
        // Just years with context (English/Finnish)
        /(\d+[\+]?\s*(?:to|till|\-|tai)?\s*\d*[\+]?\s*(?:years?|yrs?|vuotta)(?:\s+(?:of\s+)?(?:experience|kokemus))?)/i,
      ];
      
      for (const pattern of expPatterns) {
        const match = jobPosting.match(pattern);
        if (match && match[1]) {
          experience = match[1].trim();
          // Clean up the extracted text
          experience = experience
            .replace(/\s+/g, ' ') // Normalize spaces
            .replace(/[\(\)\[\]]/g, '') // Remove parentheses/brackets
            .trim();
          console.log(`[TextAnalyzer] Experience (auto-detected): "${experience}"`);
          break;
        }
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
    
    // FILTER: Apply skill validation
    let filteredRequiredCount = 0;
    let filteredNiceToHaveCount = 0;
    
    requiredSkills = requiredSkills.filter(skill => {
      const normalized = this.normalizeSkill(skill);
      if (!normalized || !this.isValidSkill(normalized)) {
        filteredRequiredCount++;
        return false;
      }
      return true;
    });
    
    niceToHaveSkills = niceToHaveSkills.filter(skill => {
      const normalized = this.normalizeSkill(skill);
      if (!normalized || !this.isValidSkill(normalized)) {
        filteredNiceToHaveCount++;
        return false;
      }
      return true;
    });
    
    const sectionSkillCount = requiredSkills.length + niceToHaveSkills.length;
    console.log(`[TextAnalyzer] Section-based skills extracted:`, {
      required: requiredSkills.length,
      niceToHave: niceToHaveSkills.length,
      total: sectionSkillCount,
      filtered: filteredRequiredCount + filteredNiceToHaveCount
    });
    
    // HYBRID FALLBACK: If section parsing yields too few skills, use semantic extraction
    if (sectionSkillCount < 5) {
      console.log('[TextAnalyzer] Limited skills from sections, running hybrid semantic fallback...');
      const fallbackSkills = await textEmbedder.extractSkillPhrases(jobPosting);
      
      // Deduplicate and merge with validation
      const skillMap = new Map<string, string>();
      let fallbackFilteredCount = 0;
      
      // Add existing section-based skills
      for (const skill of [...requiredSkills, ...niceToHaveSkills]) {
        const normalized = this.normalizeSkill(skill);
        if (normalized && this.isValidSkill(normalized)) {
          skillMap.set(normalized.toLowerCase(), normalized);
        }
      }
      
      // Add fallback semantic skills with validation
      for (const skill of fallbackSkills) {
        const subSkills = skill.split(/,|\band\b|\//i).map(s => s.trim());
        for (const subSkill of subSkills) {
          const normalized = this.normalizeSkill(subSkill);
          if (!normalized || !this.isValidSkill(normalized)) {
            fallbackFilteredCount++;
            continue;
          }
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
        `[TextAnalyzer] Hybrid fallback: ${mergedSkills.length - sectionSkillCount} valid skills added, ` +
        `${fallbackFilteredCount} filtered out (total now: ${mergedSkills.length})`
      );
    }
    
    if (requiredSkills.length > 0) {
      console.log(`[TextAnalyzer] ✓ Final Required skills:`, requiredSkills);
    }
     if (niceToHaveSkills.length > 0) {
      console.log(`[TextAnalyzer] ✓ Final Nice-to-have skills:`, niceToHaveSkills);
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
      if (/\b(python|java|javascript|typescript|react|angular|vue|node|sql|mongodb|docker|kubernetes|aws|azure|git|api|html|css|framework|library|database|nestjs|prisma)\b/i.test(item) && !techStack.includes(item)) {
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
    console.log('%c[TextAnalyzer] Starting analysis...', 'color: blue; font-weight: bold;');
    
    // Parse both job posting and CV using section-based approach
    const jobRequirements = await this.parseJobPosting(jobPosting);
    const cvSkills = await this.extractSkills(cv);
    
    // All job skills to check, ensuring no duplicates from different categories
    const allJobSkillsRaw = [
      ...jobRequirements.requiredSkills,
      ...jobRequirements.niceToHaveSkills,
      ...jobRequirements.techStack,
      ...jobRequirements.softSkills,
    ];
    const allJobSkills = [...new Set(allJobSkillsRaw.map(s => this.normalizeSkill(s)).filter(Boolean) as string[])];

    console.log(`[TextAnalyzer] Comparing ${allJobSkills.length} unique job skills with ${cvSkills.length} CV skills`);
    console.log(`[TextAnalyzer] Job skills to check:`, allJobSkills);

    // Match skills using a more robust algorithm
    const matchingSkills = new Set<string>();
    const matchedCvSkills = new Set<string>();

    for (const jobSkill of allJobSkills) {
      const jobLower = jobSkill.toLowerCase();
      let bestMatch = { score: 0, cvSkill: '' };

      for (const cvSkill of cvSkills) {
        // Don't re-match a CV skill that's already taken by a better match
        if (matchedCvSkills.has(cvSkill)) continue;

        const cvLower = cvSkill.toLowerCase();

        // 1. Direct/Substring Match (high confidence)
        if (jobLower.includes(cvLower) || cvLower.includes(jobLower)) {
          // Prioritize the job skill's original casing
          bestMatch = { score: 1, cvSkill: cvSkill };
          // Break from inner loop once a direct match is found for this job skill
          break; 
        }
        
        // 2. Semantic Match (lower confidence, find the best one)
        const similarity = await textEmbedder.calculateSimilarity(jobSkill, cvSkill);
        if (similarity > bestMatch.score) {
          bestMatch = { score: similarity, cvSkill: cvSkill };
        }
      }

      // Evaluate the best match found for the jobSkill
      if (bestMatch.score >= 0.9) { // Stricter threshold for any match
        matchingSkills.add(jobSkill);
        matchedCvSkills.add(bestMatch.cvSkill); // Reserve this CV skill
        if (bestMatch.score === 1) {
          console.log(`  ✓ Direct match: "${jobSkill}" ↔ "${bestMatch.cvSkill}"`);
        } else {
          console.log(`  ✓ Semantic match (${(bestMatch.score * 100).toFixed(0)}%): "${jobSkill}" ↔ "${bestMatch.cvSkill}"`);
        }
      } else {
         console.log(`  ✗ No strong match for: "${jobSkill}" (Best semantic: ${(bestMatch.score * 100).toFixed(0)}% with "${bestMatch.cvSkill}")`);
      }
    }

    const uniqueMatchingSkills = [...matchingSkills];
    
    // CORRECTED LOGIC: Missing skills = ALL job skills that were NOT found in the matching set.
    const missingSkills = allJobSkills.filter(skill => !matchingSkills.has(skill));
    
    console.log(`[TextAnalyzer] Match results:`, {
      totalJobSkills: allJobSkills.length,
      matched: uniqueMatchingSkills.length,
      missing: missingSkills.length
    });
    
    if (uniqueMatchingSkills.length > 0) {
      console.log(`[TextAnalyzer] ✅ Matching skills:`, uniqueMatchingSkills);
    }
    if (missingSkills.length > 0) {
      console.log(`[TextAnalyzer] ❌ Missing skills:`, missingSkills);
    }

    // Calculate match score with better logic
    let matchScore = 0;
    
    // Split into required vs nice-to-have for weighted scoring
    const requiredMatchCount = jobRequirements.requiredSkills.filter(skill => 
      uniqueMatchingSkills.includes(skill)
    ).length;
    
    const techStackMatchCount = jobRequirements.techStack.filter(skill =>
      uniqueMatchingSkills.includes(skill)
    ).length;
    
    const niceToHaveMatchCount = jobRequirements.niceToHaveSkills.filter(skill =>
      uniqueMatchingSkills.includes(skill)
    ).length;
    
    const softSkillsMatchCount = jobRequirements.softSkills.filter(skill =>
      uniqueMatchingSkills.includes(skill)
    ).length;
    
    const totalRequired = jobRequirements.requiredSkills.length + jobRequirements.techStack.length;
    const totalNiceToHave = jobRequirements.niceToHaveSkills.length + jobRequirements.softSkills.length;
    const totalJobSkills = totalRequired + totalNiceToHave;
    
    console.log(`[TextAnalyzer] Match breakdown:`, {
      required: `${requiredMatchCount}/${jobRequirements.requiredSkills.length}`,
      techStack: `${techStackMatchCount}/${jobRequirements.techStack.length}`,
      niceToHave: `${niceToHaveMatchCount}/${jobRequirements.niceToHaveSkills.length}`,
      softSkills: `${softSkillsMatchCount}/${jobRequirements.softSkills.length}`,
      totalMatches: uniqueMatchingSkills.length,
      totalJobSkills
    });
    
    // Weighted scoring: Required skills + tech stack are critical (70%), nice-to-have is bonus (30%)
    if (totalRequired > 0) {
      const criticalMatchRate = (requiredMatchCount + techStackMatchCount) / totalRequired;
      const niceToHaveMatchRate = totalNiceToHave > 0 
        ? (niceToHaveMatchCount + softSkillsMatchCount) / totalNiceToHave 
        : 0;
      
      // 70% weight on critical skills, 30% weight on nice-to-have
      matchScore = Math.round(
        (criticalMatchRate * 0.70 + niceToHaveMatchRate * 0.30) * 100
      );
    } else if (totalJobSkills > 0) {
      // Fallback: if no clear required/nice-to-have split, use simple percentage
      matchScore = Math.round((uniqueMatchingSkills.length / totalJobSkills) * 100);
    } else {
      matchScore = 0;
    }
    
    // Apply penalty if very few skills detected from job posting (likely poor parsing)
    if (totalJobSkills < 3 && totalJobSkills > 0) {
      matchScore = Math.round(matchScore * 0.5); // 50% penalty for unclear job requirements
      console.log(`  ⚠ Applied penalty: Very few job skills detected (${totalJobSkills}), score reduced`);
    }

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
      missingSkills: missingSkills,
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

    // Missing critical skills (required + tech stack)
    const missingCritical = [
      ...jobRequirements.requiredSkills,
      ...jobRequirements.techStack
    ].filter(skill => missingSkills.includes(skill));
    
    if (missingCritical.length > 0 && missingCritical.length <= 5) {
      recommendations.push(
        `📚 ${translations.prioritySkills}: ${missingCritical.join(', ')}`
      );
    } else if (missingCritical.length > 5) {
      recommendations.push(
        `📚 ${translations.topSkills}: ${missingCritical.slice(0, 5).join(', ')} (+${missingCritical.length - 5} more)`
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

  /**
   * Validate if a string is actually a skill (not job responsibilities, sentences, etc.)
   */
  private isValidSkill(skill: string): boolean {
    const lower = skill.toLowerCase();
    
    // Length constraints: skills should be 2-40 characters (tightened from 50)
    if (skill.length < 2 || skill.length > 40) {
      return false;
    }
    
    // Exclude sentences with punctuation
    if (/[.!?]/.test(skill)) {
      return false;
    }
    
    // Exclude common non-skill words or phrases
    const nonSkillPatterns = [
      /^experience with/i,
      /^strong (knowledge|understanding|experience)/i,
      /^familiarity with/i,
      /^knowledge of/i,
      /^ability to/i,
      /^excellent/i,
      /^good/i,
      /^proficient in/i,
      /^skills in/i,
      /^required/i,
      /^responsibilities/i,
      /^nice to have/i,
      /^plus if/i,
      /^bonus points/i,
      /years of experience/i,
      /degree in/i,
      /bachelor's/i,
      /master's/i,
      /communication skills/i,
      /team player/i,
      /problem solving/i,
      /work ethic/i,
      // Finnish
      /vuoden kokemus/i,
      /osaaminen/i,
      /kokemusta/i,
      /taito/i,
      /kyky/i,
      /hyvä/i,
      /erinomainen/i,
      /koulutus/i,
      /vastuut/i,
      /tehtävät/i,
      /eduksi/i,
      /plussaa/i,
      // Generic business terms & specific examples from user
      /ikea/i, 
      /vantaa/i,
      /oy/i,
      /mobile application/i,
      /web application/i,
    ];

    if (nonSkillPatterns.some(pattern => pattern.test(lower))) {
      return false;
    }
    
    // Exclude if it looks like a sentence (more than 4 words, tightened from 5)
    if (skill.split(/\s+/).length > 4) {
      return false;
    }
    
    // Exclude if it's just a number or a year
    if (/^\d+$/.test(skill) || /^(19|20)\d{2}$/.test(skill)) {
      return false;
    }

    return true;
  }
  
  /**
   * Normalize skill string
   */
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