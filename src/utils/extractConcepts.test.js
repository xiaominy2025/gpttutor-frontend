import { describe, it, expect } from 'vitest';
import { extractConcepts } from './extractConcepts.js';

describe('extractConcepts', () => {
  it('uses first non-empty array field only', () => {
    const data = {
      concepts: ['A', 'B'],
      tools: ['C'],
      practice: ['D']
    };
    expect(extractConcepts(data)).toEqual(['A', 'B']);
  });

  it('parses newline-separated string', () => {
    const data = { tools: 'A\nB\nC' };
    expect(extractConcepts(data)).toEqual(['A', 'B', 'C']);
  });

  it('parses comma string if one line', () => {
    const data = { practice: 'A, B, C' };
    expect(extractConcepts(data)).toEqual(['A', 'B', 'C']);
  });

  it('flattens object values', () => {
    const data = { tools: { a: 'A', b: 'B' } };
    expect(extractConcepts(data)).toEqual(['A', 'B']);
  });

  it('deduplicates case-insensitively', () => {
    const data = { concepts: ['A', 'a', 'B'] };
    expect(extractConcepts(data)).toEqual(['A', 'B']);
  });

  it('respects field priority order', () => {
    const data = {
      conceptsToolsPractice: ['Priority1', 'Priority2'],
      concepts: ['ShouldNotSee1', 'ShouldNotSee2'],
      tools: ['ShouldNotSee3']
    };
    expect(extractConcepts(data)).toEqual(['Priority1', 'Priority2']);
  });

  it('skips empty arrays and finds next field', () => {
    const data = {
      conceptsToolsPractice: [],
      concepts: ['Found1', 'Found2'],
      tools: ['ShouldNotSee']
    };
    expect(extractConcepts(data)).toEqual(['Found1', 'Found2']);
  });

  it('returns empty array when no fields have content', () => {
    const data = {
      conceptsToolsPractice: [],
      concepts: '',
      tools: {},
      practice: null
    };
    expect(extractConcepts(data)).toEqual([]);
  });

  it('handles mixed newlines and commas in string', () => {
    const data = { concepts: 'A\nB, C\nD' };
    expect(extractConcepts(data)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('handles empty object values', () => {
    const data = { tools: { a: 'A', b: '', c: 'C', d: null } };
    expect(extractConcepts(data)).toEqual(['A', 'C']);
  });

  it('parses conceptsToolsPractice as a string with newlines', () => {
    const data = {
      conceptsToolsPractice: 'BATNA: fallback offer\\nZOPA: acceptable overlap\\nReservation Point: lowest acceptable deal',
    };

    expect(extractConcepts(data)).toEqual([
      'BATNA: fallback offer',
      'ZOPA: acceptable overlap',
      'Reservation Point: lowest acceptable deal',
    ]);
  });

  it('parses conceptsToolsPractice as a string with commas', () => {
    const data = {
      conceptsToolsPractice: 'BATNA: fallback offer, ZOPA: acceptable overlap, Reservation Point: lowest acceptable deal',
    };

    expect(extractConcepts(data)).toEqual([
      'BATNA: fallback offer',
      'ZOPA: acceptable overlap',
      'Reservation Point: lowest acceptable deal',
    ]);
  });

  it('applies threshold filtering when conceptScores are provided', () => {
    const data = {
      concepts: ['High Relevance', 'Medium Relevance', 'Low Relevance'],
      conceptScores: [0.8, 0.5, 0.2]
    };
    
    // Test with threshold 0.5
    expect(extractConcepts(data, 0.5)).toEqual(['High Relevance', 'Medium Relevance']);
    
    // Test with threshold 0.7
    expect(extractConcepts(data, 0.7)).toEqual(['High Relevance']);
  });

  it('ignores threshold when no conceptScores are provided', () => {
    const data = {
      concepts: ['Concept A', 'Concept B', 'Concept C']
    };
    
    expect(extractConcepts(data, 0.8)).toEqual(['Concept A', 'Concept B', 'Concept C']);
  });

  it('maintains backward compatibility with default threshold', () => {
    const data = {
      concepts: ['A', 'B', 'C'],
      conceptScores: [0.9, 0.2, 0.4]
    };
    
    // Should use default threshold of 0.3
    expect(extractConcepts(data)).toEqual(['A', 'C']);
  });

  it('applies strict relevance filtering when answer text is provided', () => {
    const data = {
      concepts: ['Decision Tree', 'SWOT Analysis', 'Color Theory', 'BATNA']
    };
    
    const answerText = 'You should use a decision tree to map out your options. Consider your BATNA before making the final choice.';
    
    // Should only include concepts mentioned in the answer text
    expect(extractConcepts(data, 0.3, answerText)).toEqual(['Decision Tree', 'BATNA']);
  });

  it('filters concepts using keyword synonyms', () => {
    const data = {
      concepts: ['Risk Assessment', 'Strategic Framing', 'Market Research']
    };
    
    const answerText = 'You need to assess the risks involved and frame your decision strategically. Research the market conditions.';
    
    // Should match concepts through synonyms/related terms
    expect(extractConcepts(data, 0.3, answerText)).toEqual(['Risk Assessment', 'Strategic Framing', 'Market Research']);
  });

  it('ignores strict filtering when answer text is null or empty', () => {
    const data = {
      concepts: ['Decision Tree', 'SWOT Analysis', 'Color Theory']
    };
    
    // Should return all concepts when no answer text provided
    expect(extractConcepts(data, 0.3, null)).toEqual(['Decision Tree', 'SWOT Analysis', 'Color Theory']);
    expect(extractConcepts(data, 0.3, '')).toEqual(['Decision Tree', 'SWOT Analysis', 'Color Theory']);
  });

  it('combines threshold and strict filtering', () => {
    const data = {
      concepts: ['High Relevance', 'Medium Relevance', 'Low Relevance', 'Decision Tree'],
      conceptScores: [0.8, 0.5, 0.2, 0.9]
    };
    
    const answerText = 'Use a decision tree to map your options. Consider the high relevance factors and medium relevance trade-offs.';
    
    // Should apply both threshold (0.3) and strict filtering
    expect(extractConcepts(data, 0.3, answerText)).toEqual(['High Relevance', 'Medium Relevance', 'Decision Tree']);
  });

  it('should exclude Decision Tree when context is unrelated', () => {
    const data = {
      concepts: ['Decision Tree', 'Strategic Framing', 'Risk Assessment'],
      conceptScores: [0.9, 0.9, 0.9]
    };
    
    const answerText = "To decide, you assess values and long-term goals. Frame your decision strategically and assess the risks involved. It's a tough decision but unrelated to trees.";
    
    // Should exclude Decision Tree even though "decision" appears in text
    const result = extractConcepts(data, 0.3, answerText);
    expect(result).not.toContain('Decision Tree');
    expect(result).toContain('Strategic Framing');
    expect(result).toContain('Risk Assessment');
  });

  it('should exclude concepts when only partial words match', () => {
    const data = {
      concepts: ['SWOT Analysis', 'Market Research', 'Financial Modeling'],
      conceptScores: [0.9, 0.9, 0.9]
    };
    
    const answerText = "You need to analyze the situation and research your options. Model your finances carefully.";
    
    // Should exclude concepts even though partial words appear
    const result = extractConcepts(data, 0.3, answerText);
    expect(result).not.toContain('SWOT Analysis'); // "analyze" ≠ "analysis"
    expect(result).not.toContain('Market Research'); // "research" appears but not "market research"
    expect(result).not.toContain('Financial Modeling'); // "model" appears but not "financial modeling"
  });

  it('should include concepts when exact phrases match', () => {
    const data = {
      concepts: ['SWOT Analysis', 'Market Research', 'Financial Modeling'],
      conceptScores: [0.9, 0.9, 0.9]
    };
    
    const answerText = "Conduct a SWOT analysis of your situation. Perform market research to understand customer needs. Use financial modeling to project outcomes.";
    
    // Should include concepts when exact phrases are mentioned
    const result = extractConcepts(data, 0.3, answerText);
    expect(result).toContain('SWOT Analysis');
    expect(result).toContain('Market Research');
    expect(result).toContain('Financial Modeling');
  });

  it('should apply contextual filtering for Decision Tree', () => {
    const data = {
      concepts: ['Decision Tree', 'SWOT Analysis', 'Risk Assessment'],
      conceptScores: [0.9, 0.9, 0.9]
    };
    
    // Text with "decision tree" but no relevant context
    const textWithoutContext = "You need to make a decision tree about your career direction.";
    
    // Text with "decision tree" and relevant context
    const textWithContext = "Create a decision tree to map your options and analyze the different scenarios.";
    
    // Should exclude Decision Tree when no relevant context
    const resultWithoutContext = extractConcepts(data, 0.3, textWithoutContext);
    expect(resultWithoutContext).not.toContain('Decision Tree');
    
    // Should include Decision Tree when relevant context is present
    const resultWithContext = extractConcepts(data, 0.3, textWithContext);
    expect(resultWithContext).toContain('Decision Tree');
  });

  it('should limit results to maximum 5 concepts', () => {
    const data = {
      concepts: ['Concept A', 'Concept B', 'Concept C', 'Concept D', 'Concept E', 'Concept F'],
      conceptScores: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9]
    };
    
    const result = extractConcepts(data, 0.3);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result).toEqual(['Concept A', 'Concept B', 'Concept C', 'Concept D', 'Concept E']);
  });

  it('should match Decision Tree with branching decision alias', () => {
    const data = {
      concepts: ['Decision Tree', 'SWOT Analysis'],
      conceptScores: [0.9, 0.9]
    };
    
    const answerText = "Use a branching decision framework to map your options and analyze outcomes.";
    
    const result = extractConcepts(data, 0.3, answerText);
    expect(result).toContain('Decision Tree');
  });
});

describe('Threshold Evaluation', () => {
  it('testThresholdEvaluation', () => {
    // Sample data with mixed relevance scores (more realistic scenario)
    const testData = {
      concepts: [
        'Strategic Planning: Long-term business strategy development',
        'SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats',
        'Decision Tree: Visual decision-making framework',
        'Cost-Benefit Analysis: Financial impact evaluation',
        'Risk Assessment: Identifying potential threats',
        'Market Research: Understanding customer needs',
        'Competitive Analysis: Evaluating competitors',
        'Financial Modeling: Projecting future performance',
        'Scenario Planning: Preparing for different outcomes',
        'Stakeholder Analysis: Understanding key players',
        'Basic Math: Simple arithmetic operations',
        'Color Theory: Understanding color relationships',
        'Cooking Techniques: Food preparation methods',
        'Gardening Tips: Plant care and maintenance'
      ],
      conceptScores: [0.95, 0.87, 0.82, 0.76, 0.71, 0.65, 0.58, 0.52, 0.45, 0.38, 0.25, 0.18, 0.12, 0.08]
    };

    // Keywords that indicate high relevance to business decision-making
    const relevantKeywords = ['strategic', 'decision', 'analysis', 'planning', 'risk', 'financial', 'market', 'stakeholder'];
    
    const thresholds = [0.0, 0.3, 0.5];
    const results = [];

    for (const threshold of thresholds) {
      const concepts = extractConcepts(testData, threshold);
      const conceptCount = concepts.length;
      
      // Calculate precision proxy: how many concepts contain relevant keywords
      const relevantConcepts = concepts.filter(concept => 
        relevantKeywords.some(keyword => 
          concept.toLowerCase().includes(keyword)
        )
      );
      const precision = relevantConcepts.length / conceptCount;
      
      // Example snippets (first 2 concepts)
      const snippets = concepts.slice(0, 2).map(c => c.substring(0, 30) + '...');
      
      results.push({
        threshold,
        conceptCount,
        precision: precision,
        precisionFormatted: precision.toFixed(3),
        snippets,
        relevantConcepts: relevantConcepts.length
      });
    }

    // Log results for analysis
    console.log('\n=== Threshold Evaluation Results ===');
    results.forEach(result => {
      console.log(`\nThreshold ${result.threshold}:`);
      console.log(`  Concepts: ${result.conceptCount}`);
      console.log(`  Precision: ${result.precisionFormatted} (${result.relevantConcepts}/${result.conceptCount})`);
      console.log(`  Examples: ${result.snippets.join(', ')}`);
    });

    // Determine optimal threshold based on balance of precision and coverage
    const optimalResult = results.reduce((best, current) => {
      // Prefer higher precision while maintaining reasonable coverage (at least 3 concepts)
      if (current.conceptCount >= 3 && current.precision > best.precision) {
        return current;
      }
      return best;
    });

    console.log(`\n=== RECOMMENDATION ===`);
    console.log(`Optimal threshold: ${optimalResult.threshold}`);
    console.log(`Rationale: ${optimalResult.conceptCount} concepts with ${optimalResult.precisionFormatted} precision`);
    console.log(`This provides good coverage while maintaining high relevance.`);

    // Assert that we found a reasonable threshold
    expect(optimalResult.threshold).toBeGreaterThanOrEqual(0.0);
    expect(optimalResult.threshold).toBeLessThanOrEqual(1.0);
    expect(optimalResult.conceptCount).toBeGreaterThan(0);
    expect(optimalResult.precision).toBeGreaterThan(0);
  });
});

describe('Strict Relevance Filtering', () => {
  it('testStrictFilteringEffectiveness', () => {
    const testData = {
      concepts: [
        'Decision Tree',
        'SWOT Analysis', 
        'BATNA',
        'Color Theory',
        'Risk Assessment',
        'Cooking Techniques'
      ]
    };

    const answerText = 'You should create a decision tree to map your options. Consider your BATNA and assess the risks involved. A SWOT analysis would also be helpful.';

    // Test without strict filtering
    const withoutStrict = extractConcepts(testData, 0.3);
    console.log('\n=== Without Strict Filtering ===');
    console.log(`Concepts: ${withoutStrict.length}`);
    console.log(`All concepts: ${withoutStrict.join(', ')}`);

    // Test with strict filtering
    const withStrict = extractConcepts(testData, 0.3, answerText);
    console.log('\n=== With Strict Filtering ===');
    console.log(`Concepts: ${withStrict.length}`);
    console.log(`Filtered concepts: ${withStrict.join(', ')}`);

    // Should filter out irrelevant concepts
    expect(withStrict).toContain('Decision Tree');
    expect(withStrict).toContain('BATNA');
    expect(withStrict).toContain('Risk Assessment');
    expect(withStrict).toContain('SWOT Analysis');
    expect(withStrict).not.toContain('Color Theory');
    expect(withStrict).not.toContain('Cooking Techniques');

    // Should have fewer concepts with strict filtering
    expect(withStrict.length).toBeLessThan(withoutStrict.length);
  });
}); 