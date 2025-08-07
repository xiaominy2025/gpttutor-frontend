import "../App.css";
import ReactMarkdown from 'react-markdown';

export default function AnswerCard({ 
  answer, 
  sectionTitles = [], 
  onReflectionPromptClick 
}) {
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
      .map(p => p.trim())
      .map(p => p.replace(/^[-*•]\s*/, '')) // Remove leading dash, asterisk, or bullet
      .filter(p => p.length > 0 && hasMeaningfulContent(p));

    if (cleanPrompts.length === 0) {
      return <p className="text-gray-500 italic">No follow-up prompts available</p>;
    }

    return (
      <ul>
        {cleanPrompts.map((prompt, i) => (
          <li 
            key={i} 
            data-testid={`followup-prompt-${i}`}
            onClick={() => handlePromptClick(prompt)}
            className="reflection-prompt-item cursor-pointer hover:bg-blue-50 hover:text-blue-700 p-2 rounded transition-colors duration-200 border-l-4 border-transparent hover:border-blue-300"
            title="Click to load this question into the input box"
          >
            {prompt}
          </li>
        ))}
      </ul>
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

  // Helper function to handle reflection prompt click
  const handlePromptClick = (prompt) => {
    if (onReflectionPromptClick) {
      onReflectionPromptClick(prompt);
      // Scroll to the input box for better UX
      const textarea = document.querySelector('.question-textarea');
      if (textarea) {
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
      }
    }
  };

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
      
      <div className="answer-section" data-testid="followup-prompts">
        <h3>{titles[1]}</h3>
        {renderFollowUpPrompts(followUpPrompts)}
      </div>
      
      <div className="answer-section" data-testid="concepts-section">
        <h3>{titles[2]}</h3>
        <div className="concepts-section">
          {conceptsToolsPractice && conceptsToolsPractice.length > 0 ? (
            conceptsToolsPractice.map((concept, idx) => (
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
