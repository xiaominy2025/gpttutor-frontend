import React from 'react';
import { QueryResponse, QualityStatus } from '../types/QualityTypes';
import { logFollowupClicked } from '../utils/analytics';

interface ResponseDisplayProps {
  response: QueryResponse;
  quality: QualityStatus;
  retryCount: number;
  onRetry: () => void;
  onPromptClick: (prompt: string) => void; // Add this prop
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ 
  response,
  quality,
  retryCount,
  onRetry,
  onPromptClick
}) => {
  // Helpers to render clean content
  const renderParagraphs = (text?: string) => {
    const safe = (text || '').trim();
    if (!safe) return null;
    return safe
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map((p, i) => <p key={i}>{p}</p>);
  };

  type ConceptItem = { term: string; definition: string };

  const conceptsList: ConceptItem[] = (() => {
    const data: any = (response as any).data?.conceptsToolsPractice;
    if (!data) return [] as ConceptItem[];
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (item && typeof item === 'object') {
          return { term: String(item.term || ''), definition: String(item.definition || '') };
        }
        const s = String(item);
        const idx = s.indexOf(':');
        return idx > -1
          ? { term: s.slice(0, idx).trim(), definition: s.slice(idx + 1).trim() }
          : { term: s.trim(), definition: '' };
      }).filter(ci => ci.term || ci.definition);
    }
    // String: split by newlines
    return String(data)
      .split(/\n+/)
      .map(s => {
        const t = s.trim();
        const idx = t.indexOf(':');
        return idx > -1
          ? { term: t.slice(0, idx).trim(), definition: t.slice(idx + 1).trim() }
          : { term: t, definition: '' };
      })
      .filter(ci => ci.term || ci.definition);
  })();

  return (
    <div className="response-container">
      {/* Response content only */}
      <div className="response-content">
        <div className="strategic-lens">
          <h3>Strategic Thinking Lens</h3>
          <div className="content-text strategic-text">
            {renderParagraphs(response.data.strategicThinkingLens)}
          </div>
        </div>

        <div className="section-separator" />
        
        <div className="follow-up-prompts">
          <h3>Follow-up Prompts</h3>
          <ul className="prompts-list">
            {response.data.followUpPrompts.map((prompt, index) => (
              <li 
                key={index} 
                className="prompt-item"
                onClick={() => {
                  logFollowupClicked(prompt);
                  onPromptClick(prompt);
                }}
                style={{ cursor: 'pointer' }}
              >
                {prompt}
              </li>
            ))}
          </ul>
        </div>

        {conceptsList.length > 0 && (
          <>
            <div className="section-separator" />
            <div className="concepts-tools">
              <h3>Concepts & Tools</h3>
              <ul className="concepts-list">
                {conceptsList.map((c, i) => (
                  <li key={i} className="concepts-item">
                    <span className="concepts-bracket"></span>
                    <span className="concepts-term">{c.term}</span>
                    <span className="concepts-def">{c.definition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResponseDisplay;
