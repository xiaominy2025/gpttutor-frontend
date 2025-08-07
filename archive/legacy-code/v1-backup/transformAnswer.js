export function transformAnswer(rawAnswer = "", tooltips = {}) {
  // Helper to extract a section, tolerant to optional colon, emoji, and whitespace
  const extractSection = (labels, fallback) => {
    if (!Array.isArray(labels)) labels = [labels];
    for (const label of labels) {
      // Accept **Header**, emoji Header:, or emoji Header
      const regex = new RegExp(
        `(?:\\*\\*${label}\\*\\*|[\\u{1F300}-\\u{1FAFF}]\\s*${label}:?)\\s*\\n([\\s\\S]*?)(?=(?:\\*\\*|[\\u{1F300}-\\u{1FAFF}])|$)`,
        'iu'
      );
      const match = rawAnswer.match(regex);
      if (match) return match[1].trim();
    }
    return fallback;
  };

  const strategy = extractSection(
    ["How to Strategize Your Decision", "Strategic Thinking Lens"],
    "No strategy available"
  );
  const story = extractSection(
    ["Story in Action"],
    "No story available"
  );
  const followUps = (() => {
    // Accept both Reflection Prompts and Want to Go Deeper?
    const match = rawAnswer.match(
      /(?:\*\*Reflection Prompts\*\*|[\u{1F300}-\u{1FAFF}]\s*Want to Go Deeper\??:?)\s*\n([\s\S]*?)(?=(?:\*\*|[\u{1F300}-\u{1FAFF}])|$)/iu
    );
    if (match) {
      // Accept both - and numbered lists
      return match[1]
        .split(/\n/)
        .map(line => line.replace(/^[-*\d.]+\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return ["No follow-up questions available"];
  })();

  // Concepts as before
  const conceptsSectionMatch = rawAnswer.match(/\*\*Concepts\/Tools\/Practice Reference\*\*:?(?:\s*)\n([\s\S]*?)(?=\*\*|$)/i);
  let concepts = [];
  if (conceptsSectionMatch) {
    concepts = conceptsSectionMatch[1]
      .split(/\n/)
      .map(line => {
        const match = line.match(/^\s*-\s*\*\*(.+?)\*\*:\s*(.+)$/);
        if (match) {
          return { term: match[1].trim(), definition: match[2].trim() };
        }
        return null;
      })
      .filter(Boolean);
  }
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
