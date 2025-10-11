import React from "react";
import "../App.css";
import { logHistoryCopied } from '../utils/analytics';

export default function QuestionHistory({ 
  history, 
  currentIndex, 
  onLoadHistory, 
  onReturnToCurrent,
  visible = true,
  currentQuestion = ''
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedItems, setExpandedItems] = React.useState(new Set());
  const dropdownRef = React.useRef(null);

  // Click outside to close dropdown
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Close if click is outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      // Close on Escape key
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  if (!visible || history.length === 0) {
    return null;
  }

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleCopyHistory = () => {
    try {
      const lines = [
        currentQuestion && currentQuestion.trim().length > 0 
          ? currentQuestion.trim() 
          : 'Current Question',
        ...history.map(h => h.question)
      ];
      const text = lines.join('\n');
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      
      // Log history copy to GA4
      logHistoryCopied();
    } catch (err) {
      console.warn('Failed to copy history:', err);
    }
  };

  // Render a history item with expand/collapse functionality
  const renderHistoryItem = (question, isCurrent, onClick, itemId) => {
    const isExpanded = expandedItems.has(itemId);
    const needsExpansion = question.length > 180; // ~3 lines at 60 chars/line

    return (
      <div 
        className={`history-item ${isCurrent ? 'current' : ''}`}
        onClick={onClick}
      >
        <div className="history-item-text">
          {isExpanded || !needsExpansion ? question : `${question.substring(0, 180)}...`}
          {needsExpansion && (
            <span 
              className="expand-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(itemId);
              }}
            >
              {isExpanded ? ' less' : ' more'}
            </span>
          )}
        </div>
        {isCurrent && <span className="current-indicator">✓</span>}
      </div>
    );
  };

  return (
    <div className="custom-history-dropdown" ref={dropdownRef}>
      <div 
        className="history-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
            e.preventDefault();
          }
          const isCtrl = e.ctrlKey || e.metaKey;
          if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'c') {
            handleCopyHistory();
          }
        }}
        title="Press Ctrl/Cmd+C to copy all history | Click outside to close"
      >
        <span className="history-label">📚 History</span>
        <span className="history-label-mobile">📚</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="history-dropdown-panel">
          {renderHistoryItem(
            currentQuestion || 'Current Question',
            true,
            () => {
              // Top item shows what's currently being viewed
              // Clicking it should do nothing (already viewing it)
              // No-op to prevent unwanted behavior
            },
            'current'
          )}
          
          {history
            .filter((item, index) => {
              // When viewing current question (currentIndex === -1), skip the first history item
              // since history[0] is the current question and we already show it above
              if (currentIndex === -1) {
                return index > 0; // Skip index 0 (most recent = current)
              }
              // When viewing a past query, filter out that specific item (it's shown at top)
              return index !== currentIndex;
            })
            .map((item, index) => {
              // Calculate the actual index in the original history array
              let actualIndex;
              if (currentIndex === -1) {
                // Viewing current: we skipped index 0, so add 1
                actualIndex = index + 1;
              } else {
                // Viewing past: we filtered out currentIndex, so adjust
                actualIndex = index < currentIndex ? index : index + 1;
              }
              return (
                <React.Fragment key={item.id}>
                  {renderHistoryItem(
                    item.question,
                    false,
                    () => onLoadHistory(actualIndex),
                    item.id
                  )}
                </React.Fragment>
              );
            })}
        </div>
      )}
    </div>
  );
}
