/*
 * Licensed under the Apache License, Version 2.0
 */

export interface AnalysisResult {
  jobSkills: string[];
  cvSkills: string[];
  matchingSkills: string[];
  missingSkills: string[];
  matchScore: number;
  recommendations: string[];
}

// Comprehensive skill keywords list
const SKILL_KEYWORDS = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust', 'go', 'ruby', 'php', 'swift', 'kotlin',
  // Frontend
  'react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'tailwind', 'bootstrap',
  // Backend
  'node', 'nodejs', 'express', 'django', 'flask', 'spring', 'fastapi', 'rails',
  // Databases
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'dynamodb',
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform',
  // Tools
  'git', 'github', 'gitlab', 'jira', 'figma', 'vscode',
  // Soft Skills
  'leadership', 'communication', 'teamwork', 'problem-solving', 'analytical', 'creative',
  'organized', 'motivated', 'detail-oriented', 'self-starter', 'collaborative',
  // Experience keywords
  'senior', 'junior', 'lead', 'manager', 'architect', 'full-stack', 'frontend', 'backend',
  // Qualifications
  'degree', 'bachelor', 'master', 'phd', 'certified', 'certification',
  // Other tech
  'api', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'testing', 'tdd'
];

class TextAnalyzer {
  extractSkills(text: string): string[] {
    const normalizedText = text.toLowerCase();
    const foundSkills: string[] = [];

    for (const skill of SKILL_KEYWORDS) {
      // Create regex that matches whole words
      const regex = new RegExp(`\\b${skill.replace(/[+#]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        foundSkills.push(skill);
      }
    }

    // Remove duplicates and sort
    return [...new Set(foundSkills)].sort();
  }

  analyze(jobPosting: string, cv: string): AnalysisResult {
    const jobSkills = this.extractSkills(jobPosting);
    const cvSkills = this.extractSkills(cv);

    // Find matching skills (case-insensitive)
    const matchingSkills = jobSkills.filter((skill) =>
      cvSkills.some((cvSkill) => cvSkill.toLowerCase() === skill.toLowerCase())
    );

    // Find missing skills (in job but not in CV)
    const missingSkills = jobSkills.filter(
      (skill) => !matchingSkills.includes(skill)
    );

    // Calculate match score
    const matchScore =
      jobSkills.length > 0
        ? Math.round((matchingSkills.length / jobSkills.length) * 100)
        : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      matchScore,
      matchingSkills,
      missingSkills,
      cv
    );

    return {
      jobSkills,
      cvSkills,
      matchingSkills,
      missingSkills,
      matchScore,
      recommendations,
    };
  }

  private generateRecommendations(
    matchScore: number,
    matchingSkills: string[],
    missingSkills: string[],
    cv: string
  ): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (matchScore >= 80) {
      recommendations.push(
        '🎉 Excellent match! Your CV aligns very well with this job posting.'
      );
      recommendations.push(
        '📝 Consider tailoring your cover letter to highlight your matching skills.'
      );
    } else if (matchScore >= 60) {
      recommendations.push(
        '👍 Good match! You have many of the required skills.'
      );
      recommendations.push(
        '📚 Consider gaining experience in the missing skills to improve your chances.'
      );
    } else if (matchScore >= 40) {
      recommendations.push(
        '🤔 Partial match. You have some relevant skills but are missing key requirements.'
      );
      recommendations.push(
        '💡 Focus on acquiring the missing technical skills through courses or projects.'
      );
    } else {
      recommendations.push(
        '⚠️ Low match. This position may require significant skill development.'
      );
      recommendations.push(
        '🎯 Consider roles that better match your current skill set, or invest time in learning the required skills.'
      );
    }

    // Missing skills recommendation
    if (missingSkills.length > 0 && missingSkills.length <= 5) {
      recommendations.push(
        `📚 Priority skills to learn: ${missingSkills.join(', ')}`
      );
    } else if (missingSkills.length > 5) {
      recommendations.push(
        `📚 Top skills to focus on: ${missingSkills.slice(0, 5).join(', ')}`
      );
    }

    // CV length recommendation
    const wordCount = cv.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      recommendations.push(
        '✍️ Your CV seems short. Add more details about your experience and accomplishments.'
      );
    } else if (wordCount > 1000) {
      recommendations.push(
        '📄 Your CV is quite detailed. Consider condensing it for better readability.'
      );
    }

    // Matching skills encouragement
    if (matchingSkills.length > 0) {
      recommendations.push(
        `✅ Highlight these matching skills prominently: ${matchingSkills.slice(0, 5).join(', ')}`
      );
    }

    return recommendations;
  }
}

export const textAnalyzer = new TextAnalyzer();
