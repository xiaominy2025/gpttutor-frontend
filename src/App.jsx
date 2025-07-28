import { useState, useEffect } from "react";
import { COURSE } from "./config/courseData";
import QueryInput from "./components/QueryInput";
import AnswerCard from "./components/AnswerCard";
import SkeletonSection from "./components/SkeletonSection";
import { askGPTutor } from "./api/queryEngine";
import { parseMarkdownAnswer } from "./utils/markdownParser";
import { extractConcepts } from "./utils/extractConcepts";
import thinkpalLogo from "./assets/Logo.png";

function App() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [showSplash, setShowSplash] = useState(true);

  // Hide splash screen after 5 seconds (for review - will change back to 2.5 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // Updated to 3000ms for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSplashClick = () => {
    setShowSplash(false);
  };

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError(false);
      const response = await askGPTutor(query);
      console.log("Full backend response:", response);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      const responseData = response.data; // This is the axios response.data
      console.log("🔍 Backend response data:", responseData);
      console.log("🔍 Backend response data type:", typeof responseData);
      console.log("🔍 Backend response keys:", Object.keys(responseData || {}));
      
      // Check if the response has the expected structure
      if (!responseData || !responseData.data || !responseData.data.answer) {
        console.error("❌ Invalid response structure:", responseData);
        console.error("❌ responseData exists:", !!responseData);
        console.error("❌ responseData.data exists:", !!(responseData && responseData.data));
        console.error("❌ responseData.data.answer exists:", !!(responseData && responseData.data && responseData.data.answer));
        
        // Try fallback: maybe the response is directly the answer
        if (responseData && typeof responseData === 'string') {
          console.log("🔄 Trying fallback: responseData is a string");
          const parsedSections = parseMarkdownAnswer(responseData);
          setAnswer(parsedSections);
          return;
        }
        
        // Try another fallback: maybe the answer is directly in responseData
        if (responseData && responseData.answer) {
          console.log("🔄 Trying fallback: answer is directly in responseData");
          const parsedSections = parseMarkdownAnswer(responseData.answer);
          setAnswer(parsedSections);
          return;
        }
        
        setError(true);
        setAnswer(null);
        return;
      }

      // Extract the actual answer from the nested structure
      const answerData = responseData.data;
      console.log("🔍 Raw backend answer:", answerData.answer);
      console.log("🔍 Backend response data:", answerData);
      console.log("🔍 Answer type:", typeof answerData.answer);
      console.log("🔍 Answer length:", answerData.answer ? answerData.answer.length : 0);

      // Parse the markdown answer to extract sections
      let parsedSections;
      try {
        parsedSections = parseMarkdownAnswer(answerData.answer);
      } catch (parseError) {
        console.error("❌ Markdown parsing error:", parseError);
        console.error("❌ Parse error stack:", parseError.stack);
        setError(true);
        setAnswer(null);
        return;
      }
      
      // Log parsed sections for debugging
      console.log("📋 Parsed sections:", {
        strategicThinkingLens: parsedSections.strategicThinkingLens?.substring(0, 100) + "...",
        storyInAction: parsedSections.storyInAction?.substring(0, 100) + "...",
        followUpPromptsCount: parsedSections.followUpPrompts ? parsedSections.followUpPrompts.length : 0
      });
      
      // Extract concepts from the parsed markdown sections
      const conceptsFromMarkdown = parsedSections.conceptsToolsPractice || [];
      console.log("🔍 Concepts from markdown parser:", conceptsFromMarkdown);
      
      // Also try to extract from raw backend response as fallback
      const conceptsFromBackend = extractConcepts(answerData, 0.3, answerData.answer);
      console.log("🔍 Concepts from backend response:", conceptsFromBackend);
      
      // Use markdown concepts if available, otherwise fall back to backend concepts
      const finalConcepts = conceptsFromMarkdown.length > 0 ? conceptsFromMarkdown : conceptsFromBackend;
      console.log("🔍 Final concepts to use:", finalConcepts);

      const finalData = {
        ...parsedSections,
        conceptsToolsPractice: finalConcepts
      };

      console.log("📋 Final parsed data:", finalData);
      console.log("🔍 Concepts being passed to AnswerCard:", finalData.conceptsToolsPractice);
      setAnswer(finalData);
    } catch (error) {
      console.error("❌ Backend error for query:", query, error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      setError(true);
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
      {showSplash ? (
        // Splash Screen
        <div className="splash-screen" onClick={handleSplashClick}>
          <div className="splash-content">
            <div className="splash-logo">
              <img src={thinkpalLogo} alt="Engent Labs Logo" />
            </div>
            <h2 className="splash-subtitle">Decision-Making Practice Lab</h2>
            <p className="splash-tagline">A GPT-Powered Active Learning Platform for Deeper Understanding.</p>
          </div>
        </div>
      ) : (
        // Main Application
        <>
          {/* Centered title bar */}
          <nav className="navbar">
            <div className="navbar-content">
              <div className="title-badge">
                <span className="desktop-title">Engent Labs: Decision-Making Practice Lab</span>
                <span className="mobile-title">Decision Lab</span>
              </div>
            </div>
          </nav>
          
          <div className="content-area">
            <div className="main-wrapper">
              <div className="question-wrapper">
                <QueryInput 
                  onSubmit={handleQuery} 
                  value={queryInput}
                  onChange={setQueryInput}
                  loading={loading}
                />
              </div>
              {error && (
                <div className="error-message">
                  ⚠️ Something went wrong. Try again.
                </div>
              )}
              
              {/* Show skeleton sections when loading */}
              {loading && (
                <div className="answer-body">
                  <SkeletonSection title="Strategic Thinking Lens" />
                  <SkeletonSection title="Story in Action" />
                  <SkeletonSection title="Follow-up Prompts" />
                  <SkeletonSection title="Concepts & Tools" />
                </div>
              )}
              
              {/* Show actual answer when loaded */}
              {answer && !loading && (
                <div className="answer-body">
                  <AnswerCard 
                    strategicThinkingLens={answer.strategicThinkingLens}
                    storyInAction={answer.storyInAction}
                    followUpPrompts={answer.followUpPrompts || []}
                    conceptsToolsPractice={answer.conceptsToolsPractice || []}
                    key={JSON.stringify(answer)}
                    onReflectionPromptClick={handleReflectionPromptClick}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
