import "../App.css";
import ReactMarkdown from 'react-markdown';

export default function AnswerCard({
  strategicThinkingLens = "No strategic thinking lens available",
  storyInAction = "No story available",
  followUpPrompts = [],
  conceptsToolsPractice = [],
  onReflectionPromptClick,
}) {

  // Helper function to check if content is meaningful (not just fallback message)
  const hasMeaningfulContent = (content) => {
    if (!content) return false;
    const fallbackMessages = [
      "No strategic thinking lens available",
      "No story available", 
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
        <h3>Strategic Thinking Lens</h3>
        <div>
          {hasMeaningfulContent(strategicThinkingLens) ? (
            renderMarkdownContent(strategicThinkingLens)
          ) : (
            <span className="text-gray-500 italic">No strategic thinking lens available</span>
          )}
        </div>
      </div>
      
      <div className="answer-section" data-testid="story-in-action">
        <h3>Story in Action</h3>
        <div>
          {hasMeaningfulContent(storyInAction) ? (
            renderMarkdownContent(storyInAction)
          ) : (
            <span className="text-gray-500 italic">No story available</span>
          )}
        </div>
      </div>
      
      <div className="answer-section" data-testid="reflection-prompts">
        <h3>Follow-up Prompts</h3>
        {followUpPrompts.length > 0 && followUpPrompts.some(prompt => hasMeaningfulContent(prompt)) ? (
          <ul>
            {followUpPrompts.map((prompt, i) => (
              <li 
                key={i} 
                data-testid={`followup-prompt-${i}`}
                onClick={() => handlePromptClick(prompt)}
                className="reflection-prompt-item cursor-pointer hover:bg-blue-50 hover:text-blue-700 p-2 rounded transition-colors duration-200 border-l-4 border-transparent hover:border-blue-300"
                title="Click to load this question into the input box"
              >
                {renderMarkdownContent(prompt) || prompt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No follow-up prompts available</p>
        )}
      </div>
      
      <div className="answer-section" data-testid="concepts-section">
        <h3>Concepts & Tools</h3>
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
