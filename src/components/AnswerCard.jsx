import Tooltip from "./Tooltip";
import "../App.css";

function renderWithTooltips(text, tooltipMap) {
  if (!tooltipMap || Object.keys(tooltipMap).length === 0) return text;
  
  // First, convert markdown bold formatting to HTML
  const processMarkdown = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  // Replace each term in tooltipMap with a Tooltip component
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(Object.keys(tooltipMap).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textSlice = text.slice(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processMarkdown(textSlice) }} />);
    }
    const term = match[0];
    parts.push(<Tooltip key={match.index} term={term} definition={tooltipMap[term]} />);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    const textSlice = text.slice(lastIndex);
    parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: processMarkdown(textSlice) }} />);
  }
  return parts;
}

function renderHTMLWithTooltips(htmlContent, tooltipMap) {
  if (!htmlContent) return null;
  
  // Parse HTML content and convert tooltip spans to Tooltip components
  const tooltipRegex = /<span class="tooltip" data-tooltip="([^"]+)">([^<]+)<\/span>/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = tooltipRegex.exec(htmlContent)) !== null) {
    // Add text before the tooltip
    if (match.index > lastIndex) {
      const textBefore = htmlContent.slice(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textBefore }} />);
    }
    
    // Add the tooltip component
    const definition = match[1];
    const term = match[2];
    parts.push(<Tooltip key={match.index} term={term} definition={definition} />);
    
    lastIndex = tooltipRegex.lastIndex;
  }
  
  // Add remaining text after last tooltip
  if (lastIndex < htmlContent.length) {
    const textAfter = htmlContent.slice(lastIndex);
    parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textAfter }} />);
  }
  
  return parts.length > 0 ? parts : <span dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

function renderContentWithTooltips(content, tooltipMap) {
  if (!content) return null;
  
  // Check if content contains HTML tooltip spans
  if (content.includes('<span class="tooltip"')) {
    return renderHTMLWithTooltips(content, tooltipMap);
  }
  
  // Check if content contains tooltip terms from tooltipMap
  if (tooltipMap && Object.keys(tooltipMap).length > 0) {
    const hasTooltipTerms = Object.keys(tooltipMap).some(term => content.includes(term));
    if (hasTooltipTerms) {
      return renderWithTooltips(content, tooltipMap);
    }
  }
  
  // If no tooltips found, just render with markdown processing
  const processMarkdown = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };
  
  return <span dangerouslySetInnerHTML={{ __html: processMarkdown(content) }} />;
}

export default function AnswerCard({
  strategicThinkingLens = "No strategic thinking lens available",
  storyInAction = "No story available",
  reflectionPrompts = [],
  conceptsToolsPractice = [],
  tooltips = {},
}) {
  return (
    <div data-testid="response">
      <div className="answer-section">
        <h3>Strategic Thinking Lens</h3>
        <div>{renderContentWithTooltips(strategicThinkingLens, tooltips)}</div>
      </div>
      
      <div className="answer-section">
        <h3>Story in Action</h3>
        <div>{renderContentWithTooltips(storyInAction, tooltips)}</div>
      </div>
      
      <div className="answer-section">
        <h3>Reflection Prompts</h3>
        {reflectionPrompts.length > 0 ? (
          <ul>
            {reflectionPrompts.map((prompt, i) => (
              <li key={i}>{renderContentWithTooltips(prompt, tooltips)}</li>
            ))}
          </ul>
        ) : (
          <p>No reflection prompts available</p>
        )}
      </div>
      
      {conceptsToolsPractice.length > 0 && (
        <div className="answer-section">
          <h3>Concepts/Tools/Practice Reference</h3>
          <ul>
            {conceptsToolsPractice.map((concept, i) => (
              <li key={i}>{renderContentWithTooltips(concept, tooltips)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
