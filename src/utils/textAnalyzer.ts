/*
 * Licensed under the Apache License, Version 2.0
 */

import { textEmbedder } from './textEmbedder';

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
   * Extract skills using semantic embeddings (language-agnostic)
   * No hardcoded keywords - pure semantic extraction using MediaPipe embeddings
   * Works for all languages: Finnish, English, Swedish, German, French, Spanish, Italian, Norwegian, Danish, etc.
   */
  async extractSkills(text: string): Promise<string[]> {
    try {
      // Use embeddings for semantic extraction
      const semanticSkills = await textEmbedder.extractSkillPhrases(text);
      
      // Remove duplicates and sort
      return [...new Set(semanticSkills)].sort();
    } catch (error) {
      console.error('Skill extraction failed:', error);
      // If extraction fails completely, return empty array
      // No fallback to hardcoded keywords - let embeddings handle all languages
      return [];
    }
  }

  /**
   * Parse job posting into structured requirements
   * Categorizes extracted phrases using ONLY semantic embeddings - no hardcoded patterns
   * Language-agnostic: Works for Finnish, English, Swedish, and any language MediaPipe supports
   */
  async parseJobPosting(jobPosting: string): Promise<JobRequirements> {
    const allSkills = await this.extractSkills(jobPosting);
    
    // Categorize skills using semantic similarity
    const requiredSkills: string[] = [];
    const niceToHaveSkills: string[] = [];
    const techStack: string[] = [];
    const softSkills: string[] = [];
    const responsibilities: string[] = [];
    const education: string[] = [];
    let experience = '';
    let title = '';

    // Split job posting into sentences/phrases for analysis
    const phrases = jobPosting
      .split(/[.\n;:,]/)
      .map(p => p.trim())
      .filter(p => p.length > 5 && p.length < 150);

    // Use embeddings to detect: experience level, education, title, context
    for (const phrase of phrases) {
      try {
        // Detect experience level using semantic similarity
        // Works for: "5+ years", "senior", "veteran", "experienced", "junior", etc. in ANY language
        const experienceSim = await textEmbedder.calculateSimilarity(
          phrase,
          'years of experience senior level junior mid-level lead'
        );
        if (experienceSim > 0.65 && !experience) {
          experience = phrase;
          continue;
        }

        // Detect education using semantic similarity
        // Works for: "degree", "bachelor", "master", "phd", "certification", etc. in ANY language
        const educationSim = await textEmbedder.calculateSimilarity(
          phrase,
          'education degree bachelor master phd certification diploma university'
        );
        if (educationSim > 0.70) {
          if (!education.includes(phrase)) {
            education.push(phrase);
          }
          continue;
        }

        // Detect job title using semantic similarity
        // Works for: phrases that describe a job role/title in ANY language
        const titleSim = await textEmbedder.calculateSimilarity(
          phrase,
          'position role title job seeking looking for hiring'
        );
        if (titleSim > 0.75 && !title && phrase.length < 100) {
          title = phrase;
          continue;
        }

        // Detect nice-to-have vs required
        // No lookups previous position - use embeddings instead
        const niceToHaveSim = await textEmbedder.calculateSimilarity(
          phrase,
          'nice to have optional bonus preferred'
        );
        const requiredSim = await textEmbedder.calculateSimilarity(
          phrase,
          'required must have essential mandatory'
        );

        if (niceToHaveSim > 0.75) {
          // This phrase is in nice-to-have context
          for (const skill of allSkills) {
            if (phrase.includes(skill) && !niceToHaveSkills.includes(skill)) {
              niceToHaveSkills.push(skill);
            }
          }
        } else if (requiredSim > 0.75 || requiredSim > niceToHaveSim) {
          // This phrase is in required context
          for (const skill of allSkills) {
            if (phrase.includes(skill) && !requiredSkills.includes(skill)) {
              requiredSkills.push(skill);
            }
          }
        }
      } catch (error) {
        console.warn('Error processing phrase:', error);
      }
    }

    // Categorize each skill using embeddings
    for (const skill of allSkills) {
      // Skip if already categorized
      if (
        requiredSkills.includes(skill) ||
        niceToHaveSkills.includes(skill) ||
        education.includes(skill)
      ) {
        continue;
      }
      
      // Use semantic similarity to categorize
      try {
        // Check if it's a soft skill
        const softSkillSim = await textEmbedder.calculateSimilarity(skill, 'communication teamwork leadership problem solving analytical');
        if (softSkillSim > 0.65) {
          softSkills.push(skill);
          continue;
        }

        // Check if it's a responsibility/role
        const responsibilitySim = await textEmbedder.calculateSimilarity(skill, 'design develop build create manage maintain support implement');
        if (responsibilitySim > 0.70 && skill.length > 15) {
          responsibilities.push(skill);
          continue;
        }

        // Check if it's a tech framework/library
        const techSim = await textEmbedder.calculateSimilarity(skill, 'framework library platform technology tool');
        if (techSim > 0.60) {
          techStack.push(skill);
          continue;
        }

        // Default to required (most skills are required)
        if (!requiredSkills.includes(skill)) {
          requiredSkills.push(skill);
        }
      } catch (error) {
        console.warn('Error categorizing skill:', error);
        // Default to required
        if (!requiredSkills.includes(skill)) {
          requiredSkills.push(skill);
        }
      }
    }

    return {
      title: title || 'Position',
      experience: experience || 'Not specified',
      education: [...new Set(education)],
      requiredSkills: [...new Set(requiredSkills)],
      niceToHaveSkills: [...new Set(niceToHaveSkills)],
      techStack: [...new Set(techStack)],
      responsibilities: [...new Set(responsibilities)].slice(0, 5),
      softSkills: [...new Set(softSkills)],
    };
  }

  /**
   * Analyze job posting vs CV with language support
   * Uses semantic embeddings for comparison
   * Language parameter reserved for future MediaPipe translation implementation
   */
  async analyze(jobPosting: string, cv: string, _language: string = 'eng_Latn'): Promise<AnalysisResult> {
    // Parse job posting into structured requirements
    const jobRequirements = await this.parseJobPosting(jobPosting);
    
    // Extract all required skills from job requirements
    const allJobSkills = [
      ...jobRequirements.requiredSkills,
      ...jobRequirements.niceToHaveSkills,
      ...jobRequirements.techStack,
      ...jobRequirements.softSkills,
    ];

    // Extract skills from CV
    const cvSkills = await this.extractSkills(cv);

    // Calculate semantic similarity between each job skill and CV
    const matchingSkills: string[] = [];
    const matchedJobSkills = new Set<string>();

    for (const jobSkill of allJobSkills) {
      for (const cvSkill of cvSkills) {
        // Use semantic similarity (not just string matching)
        const similarity = await textEmbedder.calculateSimilarity(jobSkill, cvSkill);
        if (similarity > 0.6) {
          // 0.6 threshold for semantic match
          matchingSkills.push(jobSkill);
          matchedJobSkills.add(jobSkill);
          break; // Found a match, move to next job skill
        }
      }
    }

    // Remove duplicates from matching skills
    const uniqueMatchingSkills = [...new Set(matchingSkills)];

    // Missing skills (in job but not matched to CV)
    const missingSkills = allJobSkills.filter(skill => !matchedJobSkills.has(skill));

    // Calculate match score based on required skills only (stricter)
    const requiredMatchingSkills = jobRequirements.requiredSkills.filter(skill => 
      uniqueMatchingSkills.includes(skill)
    );
    
    const matchScore = jobRequirements.requiredSkills.length > 0
      ? Math.round((requiredMatchingSkills.length / jobRequirements.requiredSkills.length) * 100)
      : 0;

    // Calculate overall semantic similarity
    let overallSimilarity = 0;
    try {
      overallSimilarity = await textEmbedder.calculateSimilarity(jobPosting, cv);
    } catch (error) {
      console.warn('Overall similarity calculation failed:', error);
    }

    // Generate recommendations in the detected language
    const recommendations = this.generateRecommendations(
      matchScore,
      uniqueMatchingSkills,
      missingSkills,
      cv,
      jobRequirements
    );

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

    // Score-based recommendations
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

    // Missing required skills recommendation
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

    // CV length recommendation
    const wordCount = cv.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      recommendations.push(translations.cvTooShort);
    } else if (wordCount > 1000) {
      recommendations.push(translations.cvTooLong);
    }

    // Matching skills encouragement
    if (matchingSkills.length > 0) {
      recommendations.push(
        `✅ ${translations.highlightSkills}: ${matchingSkills.slice(0, 5).join(', ')}`
      );
    }

    // Education recommendation
    if (jobRequirements.education.length > 0) {
      recommendations.push(
        `🎓 ${translations.educationRequired}: ${jobRequirements.education[0]}`
      );
    }

    // Education recommendation
    if (jobRequirements.education.length > 0) {
      recommendations.push(
        `🎓 ${translations.educationRequired}: ${jobRequirements.education[0]}`
      );
    }

    return recommendations;
  }

  /**
   * Get recommendation text in English
   * Language detection is preserved for future MediaPipe translation
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
}

export const textAnalyzer = new TextAnalyzer();
