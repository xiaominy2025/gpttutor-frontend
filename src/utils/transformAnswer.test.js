import { test, expect } from 'vitest';
import { transformAnswer } from './transformAnswer';

test('correctly extracts story, strategy, concepts, and followUps', () => {
  const answer = `
**How to Strategize Your Decision**
Use your BATNA...

**Story in Action**
Imagine you are buying a car...

**Reflection Prompts**
- What is your BATNA?
- How do you calculate ZOPA?

**Concepts/Tools/Practice Reference**
- **BATNA**: Best alternative to a negotiated agreement.
- **ZOPA**: Zone of possible agreement.

[TOOLTIPS METADATA FOR UI]:
{
  "BATNA": "Best alternative to a negotiated agreement.",
  "ZOPA": "Zone of possible agreement."
}
    `;
  const tooltips = {
    BATNA: "Best alternative to a negotiated agreement.",
    ZOPA: "Zone of possible agreement."
  };

  const result = transformAnswer(answer, tooltips);
  expect(result.story).toMatch(/Imagine you are buying a car/);
  expect(result.strategy).toMatch(/Use your BATNA/);
  expect(result.followUps).toContain("What is your BATNA?");
  expect(result.concepts).toEqual([
    { term: "BATNA", definition: "Best alternative to a negotiated agreement." },
    { term: "ZOPA", definition: "Zone of possible agreement." }
  ]);
  console.log(result);
});
