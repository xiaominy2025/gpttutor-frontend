import React from 'react';
import { QualityStatus } from '../types/QualityTypes';

interface QualityIndicatorProps {
  status: QualityStatus;
  retryCount: number;
  qualityScore?: number;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ status, retryCount, qualityScore }) => {
  const getQualityMessage = () => {
    switch (status) {
      case 'loading':
        return { 
          text: 'Analyzing your query...', 
          color: 'blue', 
          icon: '🔄',
          className: 'quality-loading'
        };
      case 'low':
        return { 
          text: retryCount === 0 ? 'First response - warming up AI model' : 'Response quality improving...', 
          color: 'yellow', 
          icon: '⚠️',
          tip: retryCount === 0 ? 'Subsequent queries will be more detailed' : 'Keep trying for better quality',
          className: 'quality-warning'
        };
      case 'high':
        return { 
          text: 'High quality response', 
          color: 'green', 
          icon: '✅',
          className: 'quality-success'
        };
      case 'consistent':
        return { 
          text: 'Consistent quality achieved', 
          color: 'green', 
          icon: '🎯',
          className: 'quality-consistent'
        };
    }
  };

  const { text, color, icon, tip, className } = getQualityMessage();

  return (
    <div className={`quality-indicator ${className}`}>
      <div className="quality-header">
        <span className="icon">{icon}</span>
        <span className="text">{text}</span>
        {qualityScore !== undefined && (
          <span className="quality-score-badge">
            {qualityScore}/100
          </span>
        )}
      </div>
      {tip && (
        <div className="quality-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">{tip}</span>
        </div>
      )}
      {status === 'low' && retryCount === 0 && (
        <div className="quality-explanation">
          <p><strong>Why this happens:</strong> The AI model needs to warm up its concept understanding on first queries.</p>
          <p><strong>What to expect:</strong> Subsequent queries will provide much more detailed and comprehensive answers.</p>
        </div>
      )}
    </div>
  );
};

export default QualityIndicator;
