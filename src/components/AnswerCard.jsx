import "../App.css";
import ReactMarkdown from 'react-markdown';

export default function AnswerCard({ 
  answer, 
  sectionTitles = [], 
  onReflectionPromptClick,
  onAnswer
}) {
  // ✅ Handle rejected query from backend
  if (answer && answer.status === "rejected") {
    return (
      <div className="rejection-panel">
        <h3>⚠️ Off-topic Question</h3>
        <p>{answer.message || "This question appears to be outside the scope of strategic thinking and business analysis."}</p>
      </div>
    );
  }

  // ✅ Handle simple string responses from backend
  if (typeof answer === 'string') {
    return (
      <div className="answer-container">
        <div className="answer-section">
          <h3 className="section-title">Response</h3>
          <div className="section-content">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Use provided section titles or fallback to 3-section defaults
  const defaultTitles = ["Strategic Thinking Lens", "Follow-up Prompts", "Concepts/Tools"];
  const titles = sectionTitles && sectionTitles.length > 0 ? sectionTitles : defaultTitles;
  
  // Debug logging
  console.log("🔧 AnswerCard Debug:", {
    sectionTitles,
    titles,
    titlesLength: titles.length,
    is3SectionMode: titles.length === 3
  });
  
  // Extract answer properties with fallbacks (no storyInAction)
  const {
    strategicThinkingLens = "No strategic thinking lens available",
    followUpPrompts = [],
    conceptsToolsPractice = []
  } = answer || {};

  // Helper function to check if content is meaningful (not just fallback message)
  const hasMeaningfulContent = (content) => {
    if (!content) return false;
    const fallbackMessages = [
      "No strategic thinking lens available",
      "No follow-up prompts available",
      "No relevant concepts/tools for this query."
    ];
    return !fallbackMessages.includes(content.trim());
  };

  // Helper function to render markdown content
  const renderMarkdownContent = (content) => {
    if (!content || !hasMeaningfulContent(content)) {
      return null;
    }
    return <ReactMarkdown>{content}</ReactMarkdown>;
  };

  // Helper function to clean and render follow-up prompts
  const renderFollowUpPrompts = (prompts) => {
    if (!prompts || prompts.length === 0) {
      return null;
    }

    // Clean prompts: trim whitespace, remove leading dashes, and filter out empty strings
    const cleanPrompts = prompts
      .map(p => (typeof p === 'string' ? p : String(p || '')).trim())
      .map(p => p.replace(/^[-*•]\s*/, '')) // Remove leading dash, asterisk, or bullet
      .filter(p => p.length > 0 && hasMeaningfulContent(p));

    // If a single item contains multiple questions, split them into separate prompts
    const splitIntoQuestions = (text) => {
      if (!text || typeof text !== 'string') return [];
      // First, normalize common separators like " - " that appear between questions
      const normalized = text.replace(/\s*-\s*/g, ' ').trim();
      // Split by question marks and re-attach the delimiter
      const parts = normalized.split('?')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.endsWith('?') ? s : s + '?');
      // If no question marks were found, return the original text
      return parts.length > 0 ? parts : [text];
    };

    const expandedPrompts = cleanPrompts.flatMap(splitIntoQuestions)
      .map(p => p.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    if (expandedPrompts.length === 0) {
      return <p className="text-gray-500 italic">No follow-up prompts available</p>;
    }

    // Render as a clickable numbered list
    return (
      <ol className="list-decimal ml-6 space-y-2">
        {expandedPrompts.map((prompt, i) => (
          <li
            key={i}
            data-testid={`followup-prompt-${i}`}
            onClick={() => {
              if (onReflectionPromptClick) {
                onReflectionPromptClick(prompt);
              }
            }}
            className="cursor-pointer hover:text-blue-700"
            style={{ cursor: 'pointer' }}
            title="Click to ask this question"
          >
            {prompt}
          </li>
        ))}
      </ol>
    );
  };

  // Helper function to render concept in "Term: Definition" format
  const renderConcept = (concept) => {
    if (typeof concept === 'string') {
      // Handle string format (from markdown parser)
      const colonIndex = concept.indexOf(':');
      if (colonIndex !== -1) {
        const term = concept.substring(0, colonIndex).trim();
        const definition = concept.substring(colonIndex + 1).trim();
        return (
          <div className="concept-item mb-2">
            <strong>{term}:</strong> {definition}
          </div>
        );
      }
      return <div className="concept-item mb-2">{concept}</div>;
    } else if (concept && concept.term && concept.definition) {
      // Handle object format (from backend)
      return (
        <div className="concept-item mb-2">
          <strong>{concept.term}:</strong> {concept.definition}
        </div>
      );
    } else if (concept && typeof concept === 'object') {
      // Handle other object formats
      return <div className="concept-item mb-2">{JSON.stringify(concept)}</div>;
    }
    
    return null;
  };

  // Helper function to deduplicate concepts
  const deduplicateConcepts = (concepts) => {
    if (!Array.isArray(concepts)) return [];
    
    console.log('🔍 Original concepts array:', concepts);
    
    const seen = new Set();
    const uniqueConcepts = [];
    
    concepts.forEach((concept, index) => {
      let conceptKey;
      
      // Normalize the concept for comparison
      if (typeof concept === 'string') {
        // Remove leading/trailing whitespace and normalize
        conceptKey = concept.trim().toLowerCase();
        // Remove common prefixes like "- " or "* "
        conceptKey = conceptKey.replace(/^[-*•]\s*/, '');
      } else if (concept && concept.term) {
        conceptKey = concept.term.trim().toLowerCase();
      } else if (concept && concept.definition) {
        // If only definition exists, use first part as key
        conceptKey = concept.definition.trim().toLowerCase().split(':')[0];
      } else {
        conceptKey = JSON.stringify(concept).toLowerCase();
      }
      
      console.log(`🔍 Concept ${index}:`, concept, 'Normalized Key:', conceptKey);
      
      if (!seen.has(conceptKey) && conceptKey.length > 0) {
        seen.add(conceptKey);
        uniqueConcepts.push(concept);
        console.log(`✅ Added unique concept: ${conceptKey}`);
      } else {
        console.log(`❌ Skipped duplicate concept: ${conceptKey}`);
      }
    });
    
    console.log('🔍 Deduplicated concepts:', uniqueConcepts);
    return uniqueConcepts;
  };

  // Follow-up click handling now delegated to parent via onReflectionPromptClick

  return (
    <div data-testid="response">
      <div className="answer-section" data-testid="strategic-thinking-lens">
        <h3>{titles[0]}</h3>
        <div>
          {hasMeaningfulContent(strategicThinkingLens) ? (
            renderMarkdownContent(strategicThinkingLens)
          ) : (
            <span className="text-gray-500 italic">No strategic thinking lens available</span>
          )}
        </div>
      </div>
      
      <div id="followUpContainer" className="answer-section" data-testid="followup-prompts">
        <h3>{titles[1]}</h3>
        <div id="followUpPrompts">
          {renderFollowUpPrompts(followUpPrompts)}
        </div>
      </div>
      
      <div className="answer-section" data-testid="concepts-section">
        <h3>{titles[2]}</h3>
        <div className="concepts-section">
          {conceptsToolsPractice && conceptsToolsPractice.length > 0 ? (
            deduplicateConcepts(conceptsToolsPractice).map((concept, idx) => (
              <div key={idx} data-testid={`concept-${idx}`}>
                {renderConcept(concept)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No relevant concepts/tools for this query.</p>
          )}
        </div>
      </div>
    </div>
  );
}
