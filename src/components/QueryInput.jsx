import { useState } from "react";

export default function QueryInput({ onSubmit }) {
  const [input, setInput] = useState("");

  return (
    <form
      className="query-form"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(input);
      }}
    >
      <textarea
        rows={3}
        className="query-textarea"
        placeholder="Ask me anything about decision-making..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div className="query-btn-wrapper">
        <button
          className="query-submit-btn"
          type="submit"
        >
          Ask
        </button>
      </div>
    </form>
  );
}

