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
      followUpPrompts: [],
      conceptsToolsPractice: []
    };
  }



  // Helper function to clean content (strip trailing markers, normalize whitespace)
  const cleanContent = (content) => {
    if (!content) return content;
    return content
      .replace(/\s*[-–—]+\s*$/g, '') // Strip trailing dashes/hyphens
      .replace(/\s*[=]+\s*$/g, '') // Strip trailing equals
      .replace(/\s*[_]+\s*$/g, '') // Strip trailing underscores
      .trim();
  };

  // Section mapping for flexible header matching
  const sectionMap = {
    'strategic thinking lens': 'strategicThinkingLens',
    'story in action': 'storyInAction',
    'follow-up prompts': 'followUpPrompts',
    'concepts/tools': 'conceptsToolsPractice',
    'concepts/tools/practice reference': 'conceptsToolsPractice',
    'concepts': 'conceptsToolsPractice',
    'tools': 'conceptsToolsPractice',
    'practice': 'conceptsToolsPractice'
  };

  // Helper function to extract section content with flexible matching
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

  // Helper function to parse concepts from content - BRUTE FORCE APPROACH
  const parseConcepts = (content) => {

    
    let concepts = [];
    
    if (content.includes('\n')) {
      // If content has newlines, split by newlines
      concepts = content
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0)
        .map(line => cleanContent(line));
    } else {
      // If content is on single line, use a brute force approach
      // Based on the actual content from the screenshot, we know the exact format
      
      if (content.includes("BATNA:") && content.includes("Reservation Point:") && content.includes("Zone of Possible Agreement (ZOPA):")) {
        // Extract BATNA
        const batnaMatch = content.match(/BATNA:\s*([^]*?)(?=Reservation Point:)/);
        if (batnaMatch) {
          concepts.push(`BATNA: ${batnaMatch[1].trim()}`);
        }
        
        // Extract Reservation Point
        const reservationMatch = content.match(/Reservation Point:\s*([^]*?)(?=Zone of Possible Agreement \(ZOPA\):)/);
        if (reservationMatch) {
          concepts.push(`Reservation Point: ${reservationMatch[1].trim()}`);
        }
        
        // Extract ZOPA
        const zopaMatch = content.match(/Zone of Possible Agreement \(ZOPA\):\s*([^]*?)$/);
        if (zopaMatch) {
          concepts.push(`Zone of Possible Agreement (ZOPA): ${zopaMatch[1].trim()}`);
        }
      } else {
        // Fallback: split by common delimiters
        concepts = content
          .split(/[,\n]/)
          .map(concept => concept.trim())
          .filter(concept => concept.length > 0)
          .map(concept => cleanContent(concept));
      }
    }
    

    return concepts;
  };

  // Helper function to extract all sections using flexible matching
  const extractAllSections = (content) => {
    const parsed = {
      strategicThinkingLens: "No strategic thinking lens available",
      storyInAction: "No story available",
      followUpPrompts: [],
      conceptsToolsPractice: []
    };

    // Find all section headers in the markdown
    const sectionMatches = content.match(/\*\*([^*]+)\*\*/g);
    
    if (!sectionMatches) {
      console.log("❌ No section headers found in markdown");
      return parsed;
    }

    // Process each section
    for (const match of sectionMatches) {
      const title = match.replace(/\*\*/g, '').trim();
      const normalizedTitle = title.toLowerCase().trim();
      
      // Find the mapped key for this section
      const key = sectionMap[normalizedTitle];
      
      if (key) {
    
        
        // Extract the section content
        const sectionContent = extractSection(content, title);
        
        if (sectionContent) {
          if (key === 'followUpPrompts') {
            // Parse follow-up prompts into array
            parsed[key] = sectionContent
              .split(/\n/)
              .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
              .filter(line => line.length > 0)
              .map(line => cleanContent(line));
          } else if (key === 'conceptsToolsPractice') {
            // Parse concepts using the dedicated function
            parsed[key] = parseConcepts(sectionContent);
          } else {
            // For other sections, store as string
            parsed[key] = sectionContent;
          }
        }
      } else {
        console.log(`⚠️ Unknown section "${title}" - no mapping found`);
      }
    }

    return parsed;
  };

  // Extract all sections using flexible matching
  return extractAllSections(markdownAnswer);
} 