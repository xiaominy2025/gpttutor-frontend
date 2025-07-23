import { useState } from "react";

export default function QueryInput({ onSubmit, value = "", onChange }) {
  const [internalInput, setInternalInput] = useState("");

  // Use external value if provided, otherwise use internal state
  const inputValue = value !== undefined ? value : internalInput;
  const setInputValue = onChange || setInternalInput;

  return (
    <form
      className="query-form"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(inputValue);
      }}
    >
      <textarea
        rows={3}
        className="query-textarea"
        placeholder="Ask me anything about decision-making..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
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

