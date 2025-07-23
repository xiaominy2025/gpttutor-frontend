/**
 * Parse markdown answer from backend to extract the four sections
 * @param {string} markdownAnswer - The raw markdown answer from backend
 * @returns {object} Parsed sections
 */
export function parseMarkdownAnswer(markdownAnswer) {
  if (!markdownAnswer || typeof markdownAnswer !== 'string') {
    return {
      strategicThinkingLens: "No strategic thinking lens available",
      storyInAction: "No story available",
      reflectionPrompts: [],
      conceptsToolsPractice: []
    };
  }

  console.log("🔍 Parsing markdown answer:", markdownAnswer);

  // Helper function to clean content (strip trailing markers, normalize whitespace)
  const cleanContent = (content) => {
    if (!content) return content;
    return content
      .replace(/\s*[-–—]+\s*$/g, '') // Strip trailing dashes/hyphens
      .replace(/\s*[=]+\s*$/g, '') // Strip trailing equals
      .replace(/\s*[_]+\s*$/g, '') // Strip trailing underscores
      .trim();
  };

  // Helper function to extract section content
  const extractSection = (content, sectionName) => {
    const patterns = [
      `**${sectionName}**`,
      `**${sectionName}:**`,
      `**${sectionName}**\n`,
      `**${sectionName}:**\n`
    ];

    let startIndex = -1;
    let headerLength = 0;

    // Find the section header
    for (const pattern of patterns) {
      startIndex = content.indexOf(pattern);
      if (startIndex !== -1) {
        headerLength = pattern.length;
        break;
      }
    }

    if (startIndex === -1) {
      console.log(`❌ Section "${sectionName}" not found`);
      return null;
    }

    // Find the start of content (after the header)
    const contentStart = startIndex + headerLength;
    
    // Find the next section or end of string
    const remainingText = content.substring(contentStart);
    const nextHeaderMatch = remainingText.match(/\n\*\*/);
    const contentEnd = nextHeaderMatch ? contentStart + nextHeaderMatch.index : content.length;
    
    const sectionContent = content.substring(contentStart, contentEnd);
    const cleanedContent = cleanContent(sectionContent);
    
    console.log(`✅ Extracted "${sectionName}":`, cleanedContent.substring(0, 100) + "...");
    return cleanedContent;
  };

  // Extract each section
  const strategicThinkingLens = extractSection(markdownAnswer, "Strategic Thinking Lens") || "No strategic thinking lens available";
  const storyInAction = extractSection(markdownAnswer, "Story in Action") || "No story available";
  const reflectionPromptsContent = extractSection(markdownAnswer, "Reflection Prompts") || "";
  const conceptsContent = extractSection(markdownAnswer, "Concepts/Tools/Practice Reference") || "";

  // Parse reflection prompts into array
  const reflectionPrompts = reflectionPromptsContent
    ? reflectionPromptsContent
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(line => cleanContent(line)) // Clean each prompt
    : [];

  // Parse concepts into array (this should already be handled by backend, but just in case)
  const conceptsToolsPractice = conceptsContent
    ? conceptsContent
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(line => cleanContent(line)) // Clean each concept
    : [];

  return {
    strategicThinkingLens,
    storyInAction,
    reflectionPrompts,
    conceptsToolsPractice
  };
} 