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

  // Extract Strategic Thinking Lens (v16 format)
  const strategicThinkingLens = extractSection(
    ["Strategic Thinking Lens"],
    "No strategic thinking lens available"
  );

  // Extract Story in Action (v16 format)
  const storyInAction = extractSection(
    ["Story in Action"],
    "No story available"
  );

  // Extract Reflection Prompts (v16 format)
  const reflectionPrompts = (() => {
    const reflectionContent = extractSection(["Reflection Prompts"], "");
    if (reflectionContent && reflectionContent !== "No reflection prompts available") {
      return reflectionContent
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return ["No reflection prompts available"];
  })();

  // Extract Concepts/Tools/Practice Reference (v16 format)
  const conceptsToolsPractice = (() => {
    const conceptsContent = extractSection(["Concepts/Tools/Practice Reference"], "");
    if (conceptsContent && conceptsContent !== "No concepts available") {
      return conceptsContent
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return ["No concepts available"];
  })();

  // Extract tooltips from HTML spans in the content
  const extractTooltipsFromContent = (content) => {
    const tooltipRegex = /<span class="tooltip" data-tooltip="([^"]+)">([^<]+)<\/span>/g;
    const tooltips = {};
    let match;
    
    while ((match = tooltipRegex.exec(content)) !== null) {
      const definition = match[1];
      const term = match[2];
      tooltips[term] = definition;
    }
    
    return tooltips;
  };

  // Extract tooltips from markdown bold formatting (**term**)
  const extractTooltipsFromMarkdown = (content, providedTooltips) => {
    const markdownTooltips = {};
    
    // Look for **term** patterns that might be tooltips
    // This is a heuristic - we'll look for bold terms that appear in the tooltips metadata
    if (Object.keys(providedTooltips).length > 0) {
      const markdownBoldRegex = /\*\*([^*]+)\*\*/g;
      let match;
      
      while ((match = markdownBoldRegex.exec(content)) !== null) {
        const term = match[1];
        // Check if this term exists in the provided tooltips metadata
        if (providedTooltips[term]) {
          // Keep the term as is (with ** formatting) for rendering
          markdownTooltips[`**${term}**`] = providedTooltips[term];
        }
      }
    }
    
    return markdownTooltips;
  };

  // Extract tooltips from all sections
  const allContent = [strategicThinkingLens, storyInAction, reflectionPrompts.join('\n'), conceptsToolsPractice.join('\n')].join('\n');
  const extractedTooltips = extractTooltipsFromContent(allContent);
  
  // Also extract from markdown bold formatting
  const markdownTooltips = extractTooltipsFromMarkdown(allContent, tooltips);

  // Merge all tooltips: HTML spans, markdown bold, and provided tooltips metadata
  const mergedTooltips = { ...extractedTooltips, ...markdownTooltips, ...tooltips };

  const result = { 
    strategicThinkingLens, 
    storyInAction, 
    reflectionPrompts, 
    conceptsToolsPractice,
    tooltips: mergedTooltips
  };
  
  console.log("🧠 Transformed Answer (v16):", result);
  return result;
}
