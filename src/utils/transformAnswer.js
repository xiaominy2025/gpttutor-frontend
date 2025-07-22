export function transformAnswer(rawAnswer = "", tooltips = {}) {
  // Helper to extract a section using string splitting
  const extractSection = (labels, fallback) => {
    if (!Array.isArray(labels)) labels = [labels];
    for (const label of labels) {
      const header = `**${label}**`;
      const headerWithColon = `**${label}:**`;
      
      // Try both formats
      let startIndex = rawAnswer.indexOf(headerWithColon);
      if (startIndex === -1) {
        startIndex = rawAnswer.indexOf(header);
      }
      
      if (startIndex !== -1) {
        // Find the start of content (after the header)
        const contentStart = startIndex + (rawAnswer.indexOf(headerWithColon) !== -1 ? headerWithColon.length : header.length);
        
        // Find the next header or end of string
        // Look for the next ** that starts a new line (actual header), not bold text within content
        const remainingText = rawAnswer.substring(contentStart);
        const nextHeaderMatch = remainingText.match(/\n\*\*/);
        const contentEnd = nextHeaderMatch ? contentStart + nextHeaderMatch.index : rawAnswer.length;
        
        const content = rawAnswer.substring(contentStart, contentEnd).trim();
        return content;
      }
    }
    return fallback;
  };

  // Extract strategy from "How to Strategize Your Decision"
  const strategy = extractSection(
    ["How to Strategize Your Decision"],
    "No strategy available"
  );

  // Extract story from "Story in Action"
  const story = extractSection(
    ["Story in Action"],
    "No story available"
  );

  // Extract follow-up questions from "Reflection Prompts"
  const followUps = (() => {
    const reflectionContent = extractSection(["Reflection Prompts"], "");
    if (reflectionContent && reflectionContent !== "No reflection prompts available") {
      return reflectionContent
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return ["No follow-up questions available"];
  })();

  // Extract concepts from "Concepts/Tools/Practice Reference"
  const conceptsHeader = "**Concepts/Tools/Practice Reference**";
  const conceptsIndex = rawAnswer.indexOf(conceptsHeader);
  let concepts = [];
  
  if (conceptsIndex !== -1) {
    // Find the start of the content (after the header and double newline)
    const doubleNewlineIndex = rawAnswer.indexOf('\n\n', conceptsIndex);
    const contentStart = doubleNewlineIndex + 2;
    
    // Find the end (next header or end of string)
    // Look for the next ** that starts a new line
    const remainingText = rawAnswer.substring(contentStart);
    const nextHeaderMatch = remainingText.match(/\n\*\*/);
    const contentEnd = nextHeaderMatch ? contentStart + nextHeaderMatch.index : rawAnswer.length;
    
    const conceptsText = rawAnswer.substring(contentStart, contentEnd).trim();
    
    concepts = conceptsText
      .split(/\n/)
      .map(line => {
        // Match format: - **Term**: Definition
        const match = line.match(/^\s*-\s*\*\*(.+?)\*\*:\s*(.+)$/);
        if (match) {
          return { term: match[1].trim(), definition: match[2].trim() };
        }
        // Also try format: - Term: Definition (without bold)
        const match2 = line.match(/^\s*-\s*(.+?):\s*(.+)$/);
        if (match2) {
          return { term: match2[1].trim(), definition: match2[2].trim() };
        }
        return null;
      })
      .filter(Boolean);
  }
  
  // Fallback to tooltips if no concepts found in the answer
  if (concepts.length === 0 && tooltips && typeof tooltips === 'object') {
    concepts = Object.entries(tooltips).map(([term, definition]) => ({
      term: term.trim(),
      definition: definition.trim()
    }));
  }

  const result = { strategy, story, followUps, concepts };
  console.log("🧠 Transformed Answer:", result);
  return result;
}
