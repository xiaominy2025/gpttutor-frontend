export type QualityStatus = 'loading' | 'low' | 'high' | 'consistent';

export interface QueryResponse {
  data: {
    answer: string;
    strategicThinkingLens: string;
    followUpPrompts: string[];
    conceptsToolsPractice: string;
  };
  status: string;
  version: string;
  timestamp: string;
}

export interface QualityMetrics {
  answerLength: number;
  strategicLength: number;
  promptCount: number;
  qualityScore: number;
  status: QualityStatus;
}
