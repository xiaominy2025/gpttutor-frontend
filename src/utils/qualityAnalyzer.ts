import { QueryResponse, QualityStatus, QualityMetrics } from '../types/QualityTypes';

export const analyzeResponseQuality = (response: QueryResponse): QualityStatus => {
  const { answer, strategicThinkingLens, followUpPrompts } = response.data;
  
  // Calculate quality score based on multiple factors
  const answerLength = answer.length;
  const strategicLength = strategicThinkingLens.length;
  const promptCount = followUpPrompts.length;
  
  // Quality thresholds based on observed behavior from your examples
  // First run: ~1500 chars, Subsequent runs: ~4000+ chars
  const isHighQuality = answerLength > 2000 && strategicLength > 1000 && promptCount >= 3;
  const isLowQuality = answerLength < 1500 || strategicLength < 500;
  
  if (isHighQuality) return 'high';
  if (isLowQuality) return 'low';
  return 'consistent';
};

export const getQualityScore = (response: QueryResponse): number => {
  const { answer, strategicThinkingLens, followUpPrompts } = response.data;
  
  // Normalize scores to 0-100 based on your observed quality differences
  const answerScore = Math.min((answer.length / 4000) * 100, 100); // 4000+ chars = 100%
  const strategicScore = Math.min((strategicThinkingLens.length / 1500) * 100, 100); // 1500+ chars = 100%
  const promptScore = Math.min((followUpPrompts.length / 5) * 100, 100); // 5+ prompts = 100%
  
  // Weighted average (answer and strategic lens are most important)
  return Math.round((answerScore * 0.4) + (strategicScore * 0.4) + (promptScore * 0.2));
};

export const getQualityMetrics = (response: QueryResponse): QualityMetrics => {
  const { answer, strategicThinkingLens, followUpPrompts } = response.data;
  
  const answerLength = answer.length;
  const strategicLength = strategicThinkingLens.length;
  const promptCount = followUpPrompts.length;
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
