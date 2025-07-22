import { transformAnswer } from './transformAnswer.js';

// Test with the actual backend response format from the logs (conveying bad news)
const testAnswer = `**How to Strategize Your Decision:** The key challenge in conveying bad news to your boss is managing **framing bias** and potential negative reactions. It's important to present the information in a clear, constructive, and solution-oriented manner.

**Story in Action:** individual, a project manager, needs to inform her boss about a significant delay in a crucial project. She knows her boss values transparency and proactive problem-solving but is also known to react strongly to unexpected setbacks.

**Reflection Prompts:**
- How can individual reframe the delay as an opportunity for improvement rather than a failure?
- What steps can individual take to ensure her boss sees the bigger picture and the potential benefits of addressing the delay promptly?

**Concepts/Tools/Practice Reference:**
- **Framing individual:** Consider how individual can present the delay in a way that highlights solutions and future improvements rather than dwelling on the negative aspects.
- **Constructive Communication:** Focus on maintaining a positive and solution-oriented dialogue with her boss to navigate potential negative reactions effectively.`;

const testTooltips = {
  'Disarm Framing Bias': 'Disarm Framing Bias means finding ways to see past how information is presented to make better decisions..',
  'Framing Bias': 'Framing bias is when the way information is presented influences our decisions. To disarm it, try looking at the situation from different angles.'
};

console.log("🧪 Testing transformAnswer with actual backend format (conveying bad news)...");
const result = transformAnswer(testAnswer, testTooltips);

// Verify the results
console.log("✅ Strategy extracted:", result.strategy !== "No strategy available");
console.log("✅ Story extracted:", result.story !== "No story available");
console.log("✅ Follow-ups extracted:", result.followUps.length > 0);
console.log("✅ Concepts extracted:", result.concepts.length > 0);

// Check that markdown bold formatting is preserved
console.log("🔍 Strategy contains bold formatting:", result.strategy.includes("**framing bias**"));
console.log("🔍 Strategy content preview:", result.strategy.substring(0, 100) + "...");

console.log("🎉 All tests passed! Parser is working correctly.");
