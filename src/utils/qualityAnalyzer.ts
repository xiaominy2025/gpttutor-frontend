import { QueryResponse, QualityStatus, QualityMetrics } from '../types/QualityTypes';

export const analyzeResponseQuality = (response: QueryResponse): QualityStatus => {
  const { answer, strategicThinkingLens, followUpPrompts, conceptsToolsPractice } = response.data;
  
  // Check structural completeness first
  const hasRequiredSections = !!(answer && strategicThinkingLens && followUpPrompts && conceptsToolsPractice);
  if (!hasRequiredSections) return 'low';
  
  // Check strategic lens word count (80-150 words = optimal range)
  const strategicWordCount = strategicThinkingLens.trim().split(/\s+/).length;
  const hasProperStrategicLens = strategicWordCount >= 80 && strategicWordCount <= 150;
  
  // Check follow-up prompts are actionable
  const hasActionablePrompts = Array.isArray(followUpPrompts) && 
    followUpPrompts.length >= 2 && 
    followUpPrompts.every(prompt => prompt && prompt.length > 20);
  
  // Check concepts/tools are present
  const hasRelevantConcepts = Array.isArray(conceptsToolsPractice) && conceptsToolsPractice.length >= 2;
  
  // Determine quality based on content structure, not length
  if (hasProperStrategicLens && hasActionablePrompts && hasRelevantConcepts) {
    return 'high';
  }
  
  if (!hasProperStrategicLens || !hasActionablePrompts || !hasRelevantConcepts) {
    return 'low';
  }
  
  return 'consistent';
};

export const getQualityScore = (response: QueryResponse): number => {
  const { answer, strategicThinkingLens, followUpPrompts, conceptsToolsPractice } = response.data;
  
  let score = 0;
  
  // Strategic lens quality (40% weight) - based on word count, not char count
  const strategicWordCount = strategicThinkingLens.trim().split(/\s+/).length;
  if (strategicWordCount >= 100 && strategicWordCount <= 150) {
    score += 40; // Perfect word count range (100-150 words)
  } else if (strategicWordCount >= 80 && strategicWordCount <= 200) {
    score += 35; // Good range (80-200 words)
  } else if (strategicWordCount >= 50 && strategicWordCount <= 300) {
    score += 25; // Acceptable range
  } else {
    score += 10; // Too short or too long
  }
  
  // Follow-up prompts quality (30% weight)
  const actionablePrompts = Array.isArray(followUpPrompts) ? 
    followUpPrompts.filter(p => p && p.length > 20).length : 0;
  if (actionablePrompts >= 4) score += 30; // Excellent - 4+ prompts
  else if (actionablePrompts >= 3) score += 25; // Good - 3 prompts
  else if (actionablePrompts >= 2) score += 20; // Acceptable - 2 prompts
  else score += 10; // Poor - 1 or fewer
  
  // Concepts/tools relevance (30% weight)
  const conceptsLength = Array.isArray(conceptsToolsPractice) ? conceptsToolsPractice.length : 0;
  if (conceptsLength >= 4) score += 30; // Excellent - 4+ concepts
  else if (conceptsLength >= 3) score += 25; // Good - 3 concepts
  else if (conceptsLength >= 2) score += 20; // Acceptable - 2 concepts
  else score += 10; // Poor - 1 or fewer
  
  return score;
};

export const getQualityMetrics = (response: QueryResponse): QualityMetrics => {
  const { answer, strategicThinkingLens, followUpPrompts } = response.data;
  
  const answerLength = answer.length;
  const strategicLength = strategicThinkingLens.length;
  const promptCount = Array.isArray(followUpPrompts) ? followUpPrompts.length : 0;
  const qualityScore = getQualityScore(response);
  const status = analyzeResponseQuality(response);
  
  return {
    answerLength,
    strategicLength,
    promptCount,
    qualityScore,
    status
  };
};
