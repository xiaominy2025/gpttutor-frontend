import Tooltip from "./Tooltip";
import "../App.css";

function renderWithTooltips(text, tooltipMap) {
  if (!tooltipMap || Object.keys(tooltipMap).length === 0) return text;
  // Replace each term in tooltipMap with a Tooltip component
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(Object.keys(tooltipMap).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const term = match[0];
    parts.push(<Tooltip key={match.index} term={term} definition={tooltipMap[term]} />);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export default function AnswerCard({
  strategy = "No strategy available",
  story = "No story available",
  concepts = [],
  followUps = [],
}) {
  // Build tooltip map for all concepts
  const tooltipMap = {};
  concepts.forEach(c => { tooltipMap[c.term] = c.definition; });

  return (
    <>
      <div className="answer-section">
        <h3>Strategic Thinking Lens</h3>
        <p>{renderWithTooltips(strategy, tooltipMap)}</p>
      </div>
      <div className="answer-section">
        <h3>Story in Action</h3>
        <p>{renderWithTooltips(story, tooltipMap)}</p>
      </div>
      <div className="answer-section">
        <h3>Follow-up Questions</h3>
        {followUps.length > 0 ? (
          <ul>
            {followUps.map((q, i) => (
              <li key={i}>{renderWithTooltips(q, tooltipMap)}</li>
            ))}
          </ul>
        ) : (
          <p>No follow-up questions available</p>
        )}
      </div>
      {concepts.length > 0 && (
        <div className="answer-section">
          <h3>Key Concepts</h3>
          <ul>
            {concepts.map((c, i) => (
              <li key={i}>
                <Tooltip term={c.term} definition={c.definition} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
