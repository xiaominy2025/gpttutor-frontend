import { useState } from "react";
import { COURSE } from "./config/courseData";
import QueryInput from "./components/QueryInput";
import AnswerCard from "./components/AnswerCard";
import { askGPTutor } from "./api/queryEngine";
import { parseMarkdownAnswer } from "./utils/markdownParser";
import thinkpalLogo from "./assets/Logo.png";

function App() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queryInput, setQueryInput] = useState("");

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError("");
      const response = await askGPTutor(query);
      console.log("Full backend response:", response);
      const responseData = response.data;
      
      if (!responseData || !responseData.answer || !Array.isArray(responseData.conceptsToolsPractice)) {
        setError("Backend response missing required fields. Please check backend logs or try a different query.");
        setAnswer(null);
        return;
      }

      // Log the raw answer for debugging
      console.log("🔍 Raw backend answer:", responseData.answer);
      console.log("🔍 Backend concepts:", responseData.conceptsToolsPractice);

      // Parse the markdown answer to extract sections
      const parsedSections = parseMarkdownAnswer(responseData.answer);
      
      // Log parsed sections for debugging
      console.log("📋 Parsed sections:", {
        strategicThinkingLens: parsedSections.strategicThinkingLens?.substring(0, 100) + "...",
        storyInAction: parsedSections.storyInAction?.substring(0, 100) + "...",
        reflectionPromptsCount: parsedSections.reflectionPrompts.length,
        conceptsCount: responseData.conceptsToolsPractice.length
      });
      
      // Combine parsed sections with concepts from backend
      const finalData = {
        ...parsedSections,
        conceptsToolsPractice: responseData.conceptsToolsPractice // Use backend's parsed concepts
      };

      console.log("📋 Final parsed data:", finalData);
      setAnswer(finalData);
    } catch (error) {
      console.error("❌ Backend error for query:", query, error);
      setError("Error fetching response. Is the backend running? Check the console for details.");
      setAnswer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReflectionPromptClick = (prompt) => {
    setQueryInput(prompt);
    // Optionally auto-submit - uncomment the line below if you want this behavior
    // handleQuery(prompt);
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-content header-row">
          <img src={thinkpalLogo} alt="ThinkPal Logo" className="navbar-logo header-logo" />
          <span className="header-title">Decision Coach</span>
        </div>
      </nav>
      <div className="content-area">
        <div className="main-wrapper">
          <h1 className="text-2xl font-bold mb-4" style={{textAlign: 'center'}}>{COURSE.name}</h1>
          <div className="heading-padding" />
          <div className="question-bar">
            <QueryInput 
              onSubmit={handleQuery} 
              value={queryInput}
              onChange={setQueryInput}
            />
          </div>
          {loading && <p style={{textAlign: 'center', marginTop: '2rem'}}>🔄 Thinking...</p>}
          {error && <p style={{color: 'red', textAlign: 'center', marginTop: '2rem'}}>{error}</p>}
          {answer && (
            <div className="answer-body">
              <AnswerCard 
                {...answer} 
                key={JSON.stringify(answer)}
                onReflectionPromptClick={handleReflectionPromptClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
