import "../App.css";

export default function QuestionHistory({ 
  history, 
  currentIndex, 
  onLoadHistory, 
  onReturnToCurrent,
  visible = true 
}) {
  if (!visible || history.length === 0) {
    return null;
  }

  return (
    <div className="question-history-dropdown">
      <div className="history-dropdown-header">
        <span className="history-label">📚 History</span>
        <span className="history-label-mobile">📚</span>
      </div>
      
      <select 
        className="history-select"
        value={currentIndex}
        onChange={(e) => {
          const index = parseInt(e.target.value);
          if (index === -1) {
            onReturnToCurrent();
          } else {
            onLoadHistory(index);
          }
        }}
      >
        <option value={-1}>Current Question</option>
        {history.map((item, index) => (
          <option key={item.id} value={index}>
            {item.question.length > 100 
              ? `${item.question.substring(0, 100)}...` 
              : item.question
            }
          </option>
        ))}
      </select>
    </div>
  );
} 