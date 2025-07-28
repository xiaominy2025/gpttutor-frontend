import { describe, it, expect } from 'vitest';
import { parseMarkdownAnswer } from './markdownParser.js';

describe('parseMarkdownAnswer', () => {
  it('correctly parses Concepts/Tools section into conceptsToolsPractice field', () => {
    const markdown = `
**Strategic Thinking Lens**
Some strategic thinking content.

**Story in Action**
Some story content.

**Follow-up Prompts**
- Question 1
- Question 2

**Concepts/Tools**
Collaboration: Working together effectively.
Psychological Safety: A shared belief that the team is safe for interpersonal risk-taking.
`;

    const result = parseMarkdownAnswer(markdown);
    expect(result.conceptsToolsPractice).toContain('Collaboration: Working together effectively.');
    expect(result.conceptsToolsPractice).toContain('Psychological Safety: A shared belief that the team is safe for interpersonal risk-taking.');
  });

  it('handles different Concepts/Tools section variations', () => {
    const markdown = `
**Concepts/Tools/Practice Reference**
BATNA: Best Alternative to a Negotiated Agreement.
ZOPA: Zone of Possible Agreement.
`;

    const result = parseMarkdownAnswer(markdown);
    expect(result.conceptsToolsPractice).toContain('BATNA: Best Alternative to a Negotiated Agreement.');
    expect(result.conceptsToolsPractice).toContain('ZOPA: Zone of Possible Agreement.');
  });

  it('handles Concepts section without Tools', () => {
    const markdown = `
**Concepts**
SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats.
Decision Tree: A tree-like model for decision making.
`;

    const result = parseMarkdownAnswer(markdown);
    expect(result.conceptsToolsPractice).toContain('SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats.');
    expect(result.conceptsToolsPractice).toContain('Decision Tree: A tree-like model for decision making.');
  });

  it('parses all sections correctly', () => {
    const markdown = `
**Strategic Thinking Lens**
Strategic thinking content here.

**Story in Action**
Story content here.

**Follow-up Prompts**
- First follow-up question
- Second follow-up question

**Concepts/Tools**
Concept 1: Definition 1
Concept 2: Definition 2
`;

    const result = parseMarkdownAnswer(markdown);
    
    expect(result.strategicThinkingLens).toContain('Strategic thinking content here');
    expect(result.storyInAction).toContain('Story content here');
    expect(result.followUpPrompts).toContain('First follow-up question');
    expect(result.followUpPrompts).toContain('Second follow-up question');
    expect(result.conceptsToolsPractice).toContain('Concept 1: Definition 1');
    expect(result.conceptsToolsPractice).toContain('Concept 2: Definition 2');
  });

  it('handles missing sections gracefully', () => {
    const markdown = `
**Strategic Thinking Lens**
Only strategic thinking content.
`;

    const result = parseMarkdownAnswer(markdown);
    
    expect(result.strategicThinkingLens).toContain('Only strategic thinking content');
    expect(result.storyInAction).toBe('No story available');
    expect(result.followUpPrompts).toEqual([]);
    expect(result.conceptsToolsPractice).toEqual([]);
  });

  it('handles empty or null input', () => {
    const result = parseMarkdownAnswer(null);
    
    expect(result.strategicThinkingLens).toBe('No strategic thinking lens available');
    expect(result.storyInAction).toBe('No story available');
    expect(result.followUpPrompts).toEqual([]);
    expect(result.conceptsToolsPractice).toEqual([]);
  });

  it('handles concepts with bullet points', () => {
    const markdown = `
**Concepts/Tools**
- BATNA: Best Alternative to a Negotiated Agreement
- ZOPA: Zone of Possible Agreement
- Reservation Price: The minimum acceptable outcome
`;

    const result = parseMarkdownAnswer(markdown);
    expect(result.conceptsToolsPractice).toContain('BATNA: Best Alternative to a Negotiated Agreement');
    expect(result.conceptsToolsPractice).toContain('ZOPA: Zone of Possible Agreement');
    expect(result.conceptsToolsPractice).toContain('Reservation Price: The minimum acceptable outcome');
  });

  it('handles concepts on single line with spaces', () => {
    const markdown = `
**Concepts/Tools**
BATNA: Best Alternative to a Negotiated Agreement Reservation Point: The least favorable point at which one would accept a negotiated agreement in a distributive negotiation auction Zone of Possible Agreement (ZOPA): The range where a deal that benefits both parties overlaps which defines the zone where an agreement can be made
`;

    const result = parseMarkdownAnswer(markdown);
    expect(result.conceptsToolsPractice).toContain('BATNA: Best Alternative to a Negotiated Agreement');
    expect(result.conceptsToolsPractice).toContain('Reservation Point: The least favorable point at which one would accept a negotiated agreement in a distributive negotiation auction');
    expect(result.conceptsToolsPractice).toContain('Zone of Possible Agreement (ZOPA): The range where a deal that benefits both parties overlaps which defines the zone where an agreement can be made');
  });
}); 