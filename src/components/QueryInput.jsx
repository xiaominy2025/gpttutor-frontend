import { useState } from "react";

// Simple icon components since we don't have lucide-react
const PaperPlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
  </svg>
);

const LoaderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

export default function QueryInput({ onSubmit, value = "", onChange, loading = false, placeholder = "Ask your question..." }) {
  const [internalInput, setInternalInput] = useState("");

  // Use external value if provided, otherwise use internal state
  const inputValue = value !== undefined ? value : internalInput;
  const setInputValue = onChange || setInternalInput;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue);
    }
  };

  const handleKeyDown = (e) => {
    // Allow Enter to submit the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSubmit(inputValue);
      }
    }
  };

  return (
    <form
      className="question-form"
      onSubmit={handleSubmit}
    >
      <textarea
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="question-textarea"
        rows={2}
        aria-label={placeholder}
      />
      <button 
        type="submit" 
        className="ask-button"
        disabled={loading}
        title={loading ? "Processing your question" : "Submit your question"}
        aria-label={loading ? "Processing your question" : "Submit your question"}
      >
        {loading ? <LoaderIcon /> : <PaperPlaneIcon />}
      </button>
    </form>
  );
}

