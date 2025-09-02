import React from 'react';
import { QueryResponse, QualityStatus } from '../types/QualityTypes';
import { getQualityScore } from '../utils/qualityAnalyzer';

interface ResponseDisplayProps {
  response: QueryResponse;
  quality: QualityStatus;
  retryCount: number;
  onRetry: () => void;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ 
  response, 
  quality, 
  retryCount, 
  onRetry 
}) => {
  const qualityScore = getQualityScore(response);
  const showRetryOption = quality === 'low' && retryCount < 2;

  return (
    <div className="response-container">
      {/* Quality warning for low-quality responses */}
      {showRetryOption && (
        <div className="quality-warning-banner">
          <div className="warning-header">
            <span className="icon">⚠️</span>
            <span className="title">Response Quality Notice</span>
          </div>
          <div className="warning-body">
            <p>This response was generated while the AI model was warming up.</p>
            <p><strong>Quality Score:</strong> {qualityScore}/100</p>
            <p><strong>Tip:</strong> Subsequent queries will provide more detailed and consistent answers.</p>
            <button 
              className="retry-button primary"
              onClick={onRetry}
              disabled={retryCount >= 2}
            >
              🔄 Retry Query for Better Quality
            </button>
            {retryCount >= 1 && (
              <p className="retry-note">
                <small>Retry attempts: {retryCount}/2</small>
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Quality score indicator */}
      <div className="quality-score">
        <div className="score-bar">
          <div 
            className="score-fill" 
            style={{ width: `${qualityScore}%` }}
          ></div>
        </div>
        <span className="score-text">Quality: {qualityScore}/100</span>
      </div>
      
      {/* Response content */}
      <div className="response-content">
        <div className="strategic-lens">
          <h3>Strategic Thinking Lens</h3>
          <div 
            className="content-text"
            dangerouslySetInnerHTML={{ __html: response.data.strategicThinkingLens }} 
          />
        </div>
        
        <div className="follow-up-prompts">
          <h3>Follow-up Prompts</h3>
          <ul className="prompts-list">
            {response.data.followUpPrompts.map((prompt, index) => (
              <li key={index} className="prompt-item">
                {prompt}
              </li>
            ))}
          </ul>
        </div>

        {response.data.conceptsToolsPractice && (
          <div className="concepts-tools">
            <h3>Concepts & Tools</h3>
            <div 
              className="content-text"
              dangerouslySetInnerHTML={{ __html: response.data.conceptsToolsPractice }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseDisplay;
