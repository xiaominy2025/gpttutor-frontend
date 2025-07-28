import { useState, useEffect } from "react";
import { getCourseById, getAllCourses, DEFAULT_COURSE } from "./config/courseData";
import QueryInput from "./components/QueryInput";
import AnswerCard from "./components/AnswerCard";
import SkeletonSection from "./components/SkeletonSection";
import CourseSelector from "./components/CourseSelector";
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
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  // Get course from URL parameter or default
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    
    if (courseParam && getAllCourses().some(course => course.id === courseParam)) {
      setSelectedCourseId(courseParam);
    } else if (courseParam) {
      // Invalid course parameter, show course selector
      setShowCourseSelector(true);
      setShowSplash(false);
    } else {
      // No course parameter, use default
      setSelectedCourseId(DEFAULT_COURSE);
    }
  }, []);

  // Get current course data
  const currentCourse = selectedCourseId ? getCourseById(selectedCourseId) : null;

  // Hide splash screen after 3 seconds
  useEffect(() => {
    if (selectedCourseId && !showCourseSelector) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [selectedCourseId, showCourseSelector]);

  const handleSplashClick = () => {
    setShowSplash(false);
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    setShowCourseSelector(false);
    setShowSplash(true);
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('course', courseId);
    window.history.pushState({}, '', url);
  };

  const handleQuery = async (query) => {
    try {
      setLoading(true);
      setError(false);
      
      // Include course_id in the request
      const requestData = {
        query: query,
        course_id: selectedCourseId || DEFAULT_COURSE
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

  // Show course selector if no course is selected or if explicitly requested
  if (showCourseSelector) {
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
            <CourseSelector 
              onCourseSelect={handleCourseSelect}
              selectedCourseId={selectedCourseId}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {showSplash && currentCourse ? (
        // Splash Screen
        <div className="splash-screen" onClick={handleSplashClick}>
          <div className="splash-content">
            <div className="splash-logo">
              <img src={thinkpalLogo} alt="Engent Labs Logo" />
            </div>
            <h2 className="splash-subtitle">{currentCourse.splashTitle}</h2>
            <p className="splash-tagline">{currentCourse.splashTagline}</p>
          </div>
        </div>
      ) : (
        // Main Application
        <>
          {/* Centered title bar */}
          <nav className="navbar">
            <div className="navbar-content">
              <div className="title-badge">
                <span className="desktop-title">{currentCourse?.name || "Engent Labs"}</span>
                <span className="mobile-title">{currentCourse?.shortName || "Engent Labs"}</span>
              </div>
              <button 
                className="course-switcher"
                onClick={() => setShowCourseSelector(true)}
                title="Switch Course"
              >
                🔄
              </button>
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
                  placeholder={currentCourse?.samplePrompt ? `Ask your ${currentCourse.id} question… e.g., "${currentCourse.samplePrompt}"` : "Ask your question..."}
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
