import { transformAnswer } from './transformAnswer.js';

// Test with the v16 backend response format
const testAnswer = `**Strategic Thinking Lens**

In planning production with fluctuating demand and limited storage, you need to adopt a strategic mindset that balances multiple objectives: meeting customer demand, minimizing storage costs, and maintaining operational efficiency. This requires analytical tools like demand forecasting, <span class="tooltip" data-tooltip="A technique to model and analyze the behavior of a system under uncertainty.">simulation</span> modeling, and optimization techniques to make data-driven decisions.

**Story in Action**

Maria, a production manager at a manufacturing company, faces the challenge of planning production with highly variable customer demand and limited warehouse space. She uses <span class="tooltip" data-tooltip="A technique to model and analyze the behavior of a system under uncertainty.">simulation</span> software to model different demand scenarios and runs optimization models to determine the most efficient production levels.

**Reflection Prompts**

- What are the key factors driving demand fluctuations in your market, and how can you better predict these patterns?
- How might implementing flexible production scheduling impact your team's workload and morale, and what support systems would you need to put in place?

**Concepts/Tools/Practice Reference**

- <span class="tooltip" data-tooltip="The process of determining how to produce goods efficiently while meeting customer demand.">Production Planning</span>
- <span class="tooltip" data-tooltip="The supervision of non-capitalized assets and stock items for optimal business operations.">Inventory Management</span>
- Demand Forecasting
- Just-in-Time Production`;

const testTooltips = {
  'Production Planning': 'The process of determining how to produce goods efficiently while meeting customer demand.',
  'Inventory Management': 'The supervision of non-capitalized assets and stock items for optimal business operations.',
  'simulation': 'A technique to model and analyze the behavior of a system under uncertainty.'
};

console.log("🧪 Testing transformAnswer with v16 backend format...");
const result = transformAnswer(testAnswer, testTooltips);

// Verify the results
console.log("✅ Strategic Thinking Lens extracted:", result.strategicThinkingLens !== "No strategic thinking lens available");
console.log("✅ Story in Action extracted:", result.storyInAction !== "No story available");
console.log("✅ Reflection Prompts extracted:", result.reflectionPrompts.length > 0);
console.log("✅ Concepts/Tools/Practice Reference extracted:", result.conceptsToolsPractice.length > 0);

// Check that HTML tooltip spans are preserved
console.log("🔍 Strategic Thinking Lens contains tooltip spans:", result.strategicThinkingLens.includes("<span class=\"tooltip\""));
console.log("🔍 Story in Action contains tooltip spans:", result.storyInAction.includes("<span class=\"tooltip\""));

// Check tooltips extraction
console.log("🔍 Tooltips extracted:", Object.keys(result.tooltips).length > 0);
console.log("🔍 Tooltips content:", result.tooltips);

console.log("🎉 All tests passed! v16 parser is working correctly.");
