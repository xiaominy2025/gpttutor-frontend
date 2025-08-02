import { useState, useEffect, useCallback } from "react";
import QueryInput from "./components/QueryInput";
import AnswerCard from "./components/AnswerCard";
import SkeletonSection from "./components/SkeletonSection";
import CourseSelector from "./components/CourseSelector";
import QuestionHistory from "./components/QuestionHistory";
import { askGPTutor } from "./api/queryEngine";
import { parseMarkdownAnswer } from "./utils/markdownParser";
import { extractConcepts } from "./utils/extractConcepts";
import splashLogo from "./assets/LogoSplash.png";

// V1.6.5: Utility function to sanitize bullet points
const sanitizeBullets = (lines) => {
  if (!lines) return [];
  
  // Handle both array and string inputs
  const lineArray = Array.isArray(lines) ? lines : lines.split('\n');
  
  return lineArray
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
};

function App() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [metadataError, setMetadataError] = useState(false);
  
  // Question history state - stores last 5 question-answer pairs
  const [questionHistory, setQuestionHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1); // -1 means current question
  
  // Define backend base URL with fallback
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  // Debug: Log the API base URL
  console.log("🔧 API_BASE:", API_BASE);
  console.log("🔧 VITE_BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);

  // Function to add question to history
  const addToHistory = useCallback((question, answerData) => {
    const historyItem = {
      id: Date.now(),
      question,
      answer: answerData,
      timestamp: new Date().toLocaleTimeString()
    };

    setQuestionHistory(prevHistory => {
      const newHistory = [historyItem, ...prevHistory.slice(0, 4)]; // Keep only last 5
      return newHistory;
    });
    
    // Reset to current question
    setCurrentHistoryIndex(-1);
  }, []);

  // Function to load a question from history
  const loadFromHistory = useCallback((index) => {
    if (index >= 0 && index < questionHistory.length) {
      const historyItem = questionHistory[index];
      setAnswer(historyItem.answer);
      setQueryInput(historyItem.question);
      setCurrentHistoryIndex(index);
    }
  }, [questionHistory]);

  // Function to return to current question
  const returnToCurrent = useCallback(() => {
    setCurrentHistoryIndex(-1);
    setAnswer(null);
    setQueryInput("");
    console.log("📚 Returned to current question");
  }, []);

  // Function to fetch course metadata from backend
  const fetchCourseMetadata = useCallback(async (courseId) => {
    try {
      console.log("🔧 fetchCourseMetadata called with courseId:", courseId);
      setMetadataError(false);
      const url = `${API_BASE}/api/course/${courseId}`;
      console.log("Fetching course metadata from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("🔧 Raw metadata response:", data);
      // V1.6.5 backend wraps metadata inside "metadata"
      setMetadata(data.metadata);
      console.log("🔧 Set metadata to:", data.metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      setMetadataError(true);
      setMetadata(null);
    }
  }, [API_BASE]);

  // Get course from URL parameter and fetch metadata
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    if (courseParam) {
      setSelectedCourseId(courseParam);
      fetchCourseMetadata(courseParam);
    }
  }, [fetchCourseMetadata]);

  // Update splash transition
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Health check to confirm backend is running
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => console.log("✅ Backend health:", data))
      .catch(err => console.error("❌ Backend not reachable:", err));
      
    // Test course metadata fetch
    fetch(`${API_BASE}/api/course/decision`)
      .then(res => {
        console.log("🔧 Course metadata response status:", res.status);
        return res.json();
      })
      .then(data => console.log("✅ Course metadata test:", data.metadata ? "SUCCESS" : "FAILED"))
      .catch(err => console.error("❌ Course metadata test failed:", err));
  }, [API_BASE]);

  const handleSplashClick = () => {
    setShowSplash(false);
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    fetchCourseMetadata(courseId); // ensures metadata loads immediately
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('course', courseId);
    window.history.pushState({}, '', url);
  };

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError(false);
      
      // Ensure we have a course selected
      if (!selectedCourseId) {
        setError(true);
        setAnswer(null);
        return;
      }
      
      // Traditional approach - include course_id in the request
      const requestData = {
        query: query,
        course_id: selectedCourseId
      };
      
      const response = await askGPTutor(requestData);
      console.log("Full backend response:", response);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      const responseData = response.data;
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

      // V1.6.5: Ensure follow-up prompts and concepts are sanitized
      const finalData = {
        ...parsedSections,
        followUpPrompts: parsedSections.followUpPrompts
          ? sanitizeBullets(parsedSections.followUpPrompts)
          : [],
        conceptsToolsPractice: finalConcepts
          ? sanitizeBullets(finalConcepts)
          : []
      };

      console.log("📋 Final parsed data:", finalData);
      console.log("🔍 Concepts being passed to AnswerCard:", finalData.conceptsToolsPractice);
      setAnswer(finalData);
      addToHistory(query, finalData); // Add to history after successful query
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
    // Auto-submit follow-up questions for consistent UX with history
    handleQuery(prompt);
  };

  // Show error message if metadata fetch failed
  if (metadataError) {
    return (
      <div className="app-shell">
        <nav className="navbar">
          <div className="navbar-content">
            <div className="title-badge">
              <span className="desktop-title">Engent Labs: Practice Labs</span>
              <span className="mobile-title">Engent Labs</span>
            </div>
          </div>
        </nav>
        
        <div className="content-area">
          <div className="main-wrapper">
            <div className="error-message">
              ⚠️ Unable to load course data. Please try refreshing the page.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {console.log("🔍 Render Debug:", { 
        showSplash, 
        selectedCourseId, 
        metadata: metadata ? "LOADED" : "NULL", 
        metadataError,
        renderCondition: !selectedCourseId || !metadata ? "SHOW_COURSE_SELECTOR" : "SHOW_MAIN_APP"
      })}
      {showSplash ? (
        // Splash Screen
        <div className="splash-screen" onClick={handleSplashClick}>
          <div className="splash-content">
            <div className="splash-logo">
              <img src={splashLogo} alt="Engent Labs Splash Logo" />
            </div>
            <h2 className="splash-subtitle">AI‑Powered Active Learning</h2>
            <p className="splash-tagline">
              <span className="splash-blue">Ask Smarter.</span>{" "}
              <span className="splash-white">Think Deeper.</span>{" "}
              <span className="splash-yellow">Apply Sharper.</span>
            </p>
          </div>
        </div>
      ) : !selectedCourseId || !metadata ? (
        // Course Selector (when no course is selected OR metadata is missing)
        <div className="content-area">
          <div className="main-wrapper">
            <CourseSelector 
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId}
            />
          </div>
        </div>
      ) : (
        // Main Application (only when course + metadata ready)
        <>
          <nav className="navbar">
            <div className="navbar-content">
              <div className="title-badge">
                <span className="desktop-title">{metadata.title}</span>
                <span className="mobile-title">{metadata.mobile_title || metadata.short_name || "Engent Labs"}</span>
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
                  placeholder={metadata.placeholder 
                    ? `Ask your ${selectedCourseId} question… e.g., "${metadata.placeholder}"` 
                    : "Ask your question..."}
                />
              </div>
              {error && <div className="error-message">⚠️ Something went wrong. Try again.</div>}
              
              {/* Loading Mode */}
              {loading && (
                <div className="answer-body">
                  {(metadata.sections_titles || []).map((title, index) => (
                    <SkeletonSection key={index} title={title} />
                  ))}
                </div>
              )}
              
              {/* Answer Display */}
              {answer && !loading && (
                <div className="answer-body">
                  {/* Question History - positioned above Strategic Thinking Lens */}
                  <QuestionHistory
                    history={questionHistory}
                    currentIndex={currentHistoryIndex}
                    onLoadHistory={loadFromHistory}
                    onReturnToCurrent={returnToCurrent}
                    visible={questionHistory.length > 0}
                  />
                  
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
