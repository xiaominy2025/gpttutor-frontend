import { useState } from "react";

export default function QueryInput({ onSubmit, value = "", onChange }) {
  const [internalInput, setInternalInput] = useState("");

  // Use external value if provided, otherwise use internal state
  const inputValue = value !== undefined ? value : internalInput;
  const setInputValue = onChange || setInternalInput;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(inputValue);
  };

  return (
    <form
      className="question-form"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="Ask me anything about decision-making..."
        className="question-input"
      />
      <button type="submit" className="ask-button">Ask</button>
    </form>
  );
}

