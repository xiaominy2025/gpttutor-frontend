// utils/extractConcepts.js

/**
 * Keyword map to match common synonyms or indirect mentions of concepts
 * Using precise terms to avoid false positives
 */
const keywordMap = {
  "Decision Tree": ["decision tree", "branching decision", "decision branches", "tree diagram", "branching paths", "decision tree analysis"],
  "Strategic Framing": ["strategic frame", "reframe", "structure decision", "define options", "clarify goals", "frame your decision"],
  "Risk Assessment": ["risk assessment", "assess risk", "risk evaluation", "risk analysis", "assess the risks"],
  "Stakeholder Alignment": ["stakeholder alignment", "align stakeholders", "stakeholder engagement"],
  "Risk Tolerance Assessment": ["risk tolerance", "tolerance assessment", "risk profile assessment"],
  "SWOT Analysis": ["swot analysis", "strengths weaknesses opportunities threats"],
  "Cost-Benefit Analysis": ["cost-benefit analysis", "cost benefit analysis", "financial impact analysis"],
  "BATNA": ["batna", "best alternative to negotiated agreement", "best alternative"],
  "ZOPA": ["zopa", "zone of possible agreement", "negotiation zone"],
  "Market Research": ["market research", "market analysis", "customer research", "research the market"],
  "Competitive Analysis": ["competitive analysis", "competitor analysis", "competitive assessment"],
  "Financial Modeling": ["financial modeling", "financial model", "financial projection"],
  "Scenario Planning": ["scenario planning", "scenario analysis", "what-if analysis"],
  "Stakeholder Analysis": ["stakeholder analysis", "stakeholder mapping", "key players analysis"]
};

/**
 * Contextual map to define required nearby context terms for sensitive concepts
 * These concepts require additional context to avoid false positives
 */
const contextualMap = {
  "Decision Tree": ["map", "options", "scenario", "outcomes", "analyze", "framework", "branches", "visual", "path", "choice", "alternative"],
};

/**
 * Strict filter function to check if concept is contextually relevant
 * Uses word boundaries to avoid false positives and contextual filtering for sensitive concepts
 * @param {string} concept - The concept to check
 * @param {string} text - The full answer text to search in
 * @returns {boolean} - Whether the concept is contextually relevant
 */
const strictFilter = (concept, text) => {
  if (!text || !concept) return false;
  
  // Ensure concept is a string
  if (typeof concept !== 'string') {
    console.warn('strictFilter received non-string concept:', concept);
    return false;
  }
  
  const lowerText = text.toLowerCase();
  const lowerConcept = concept.toLowerCase();
  
  // Basic match or keyword alias match
  let matches = false;
  
  // Direct match with word boundaries
  const directMatch = new RegExp(`\\b${lowerConcept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lowerText);
  if (directMatch) {
    matches = true;
  }
  
  // Check keyword map for synonyms/related terms with word boundaries
  if (!matches) {
    const keywords = keywordMap[concept];
    if (keywords) {
      matches = keywords.some(keyword => {
        const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escapedKeyword}\\b`).test(lowerText);
      });
    }
  }
  
  // Check if concept name appears in keyword map for other concepts
  if (!matches) {
    for (const [mapConcept, mapKeywords] of Object.entries(keywordMap)) {
      if (mapKeywords.some(keyword => lowerConcept.includes(keyword.toLowerCase()))) {
        const escapedMapConcept = mapConcept.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        matches = new RegExp(`\\b${escapedMapConcept}\\b`).test(lowerText) || 
               mapKeywords.some(keyword => {
                 const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 return new RegExp(`\\b${escapedKeyword}\\b`).test(lowerText);
               });
        if (matches) break;
      }
    }
  }
  
  // Apply contextual filtering for sensitive concepts
  if (matches && contextualMap[concept]) {
    const contextWords = contextualMap[concept];
    const contextMatch = contextWords.some(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escapedWord}\\b`).test(lowerText);
    });
    return contextMatch; // only return true if context also matches
  }
  
  return matches;
};

/**
 * Extracts a clean, deduplicated list of concepts/tools from possible backend fields.
 * Handles arrays, strings, objects. Prepares for glossary injection in future versions.
 * 
 * @param {Object} responseData - raw backend response
 * @param {number} threshold - relevance threshold (0.0 to 1.0, default: 0.3)
 * @param {string} answerText - full answer text for strict relevance filtering (optional)
 * @returns {Array} concepts/tools in consistent format
 */
export function extractConcepts(responseData, threshold = 0.3, answerText = null) {
  const possibleFields = [
    'conceptsToolsPractice',
    'concepts',
    'tools',
    'practice',
  ];

  let rawList = [];

  for (const field of possibleFields) {
    const value = responseData[field];

    if (Array.isArray(value) && value.length > 0) {
      rawList = value;
      break;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      // Handle both newline and comma-separated strings
      rawList = value
        .split(/\\n|,|\n/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      break;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const extracted = Object.values(value).filter(
        (c) => typeof c === 'string' && c.trim().length > 0
      );
      if (extracted.length > 0) {
        rawList = extracted;
        break;
      }
    }
  }

  // Apply threshold filtering if concepts have relevance scores
  let filteredList = rawList;
  if (threshold > 0 && Array.isArray(responseData.conceptScores)) {
    const conceptScores = responseData.conceptScores;
    filteredList = rawList.filter((concept, index) => {
      const score = conceptScores[index] || 0;
      return score >= threshold;
    });
  }

  // Apply strict relevance filter if answer text is provided
  if (answerText && typeof answerText === 'string') {
    filteredList = filteredList.filter(concept => {
      // Ensure concept is a string before passing to strictFilter
      if (typeof concept !== 'string') {
        console.warn('Non-string concept found in filteredList:', concept);
        return false;
      }
      return strictFilter(concept, answerText);
    });
  }

  // Deduplicate (case-insensitive)
  const seen = new Set();
  const deduped = [];

  for (const c of filteredList) {
    const key = typeof c === 'string' ? c.toLowerCase().trim() : JSON.stringify(c).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  // Limit to maximum 5 concepts
  return deduped.slice(0, 5);
} 