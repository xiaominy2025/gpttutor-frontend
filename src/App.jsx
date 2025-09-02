import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { api } from "./lib/api.js";
import AnswerCard from './components/AnswerCard'
import QueryInput from './components/QueryInput'
import CourseSelector from './components/CourseSelector'
import BackendTest from './components/BackendTest'
import QuestionHistory from './components/QuestionHistory'
import Homepage from './components/Homepage'
import QualityIndicator from './components/QualityIndicator.tsx'
import ResponseDisplay from './components/ResponseDisplay.tsx'
import splashLogo from './assets/LogoSplash.png'
import engentLabsLogo from './assets/logo.png'
import './styles/QualityComponents.css'
import QueryService from './services/QueryService'
import { analyzeResponseQuality, getQualityScore } from './utils/qualityAnalyzer'

// Main App Component for Labs
function LabsApp() {
  const [answer, setAnswer] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [selectedCourseId, setSelectedCourseId] = React.useState(null)
  const [courseMetadata, setCourseMetadata] = React.useState(null)
  const [uiConfig, setUiConfig] = React.useState(null) // New: UI configuration from backend
  const [showSplash, setShowSplash] = React.useState(true)
  const [currentView, setCurrentView] = React.useState('splash') // 'splash', 'courseSelection', 'mainApp'
  const [queryInput, setQueryInput] = React.useState('') // Add query input state
  const [pendingQuestion, setPendingQuestion] = React.useState('') // Track the question being processed
  const [showApiWarning, setShowApiWarning] = React.useState(false)
  
  // Question history state
  const [questionHistory, setQuestionHistory] = React.useState([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = React.useState(-1) // -1 means current question
  
  // Quality management state
  const [qualityStatus, setQualityStatus] = React.useState('loading')
  const [qualityScore, setQualityScore] = React.useState(0)
  const [retryCount, setRetryCount] = React.useState(0)
  const [currentResponse, setCurrentResponse] = React.useState(null)
  
  // Initialize QueryService
  const queryService = QueryService.getInstance()
  
  // Periodic system health check to detect cooling
  React.useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      try {
        await queryService.checkAndWarmUpIfNeeded();
      } catch (error) {
        console.warn('System health check failed:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(healthCheckInterval);
  }, []);
  
  // Set favicon to Engent Labs logo
  React.useEffect(() => {
    try {
      const link = document.querySelector("link[rel='icon']") || document.createElement('link');
      link.setAttribute('rel', 'icon');
      link.setAttribute('type', 'image/png');
      link.setAttribute('href', engentLabsLogo);
      if (!link.parentNode) {
        document.head.appendChild(link);
      }
    } catch (e) {
      // no-op if document is unavailable
    }
  }, []);

  // Check API configuration on mount
  React.useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (!baseUrl) {
      setShowApiWarning(true);
      return;
    }

    try {
      const apiUrl = new URL(baseUrl);
      const apiHost = apiUrl.host;
      const frontendHost = window.location.host;
      
      // Only show warning if API host exactly matches frontend host
      if (apiHost === frontendHost) {
        setShowApiWarning(true);
      }
    } catch (e) {
      // Invalid URL format, show warning
      setShowApiWarning(true);
    }
  }, []);

  // Load course UI configuration on app start (per guides)
  React.useEffect(() => {
    const loadUIConfig = async () => {
      try {
        console.log('Loading course UI configuration...');
        const config = await api.loadCourseUIConfig('decision');
        setUiConfig(config);
        console.log('✅ Course UI config loaded:', config);
      } catch (error) {
        console.error('Failed to load course UI config:', error);
        // No fallback - rely on backend only
        setUiConfig(null);
      }
    };

    loadUIConfig();
  }, []);

  // Handle splash screen transition
  React.useEffect(() => {
    if (showSplash) {
      // Pre-warm Lambda on splash load
      api.health().catch(() => {});
      
      const timer = setTimeout(() => {
        setShowSplash(false)
        setCurrentView('courseSelection')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSplash])

  // Fetch course metadata when course is selected
  React.useEffect(() => {
    if (selectedCourseId) {
      console.log('Course selected, setting up metadata for:', selectedCourseId)
      
      // Pre-warm Lambda on course selection
      api.health().catch(() => {});
      
      // Use the UI config if available, otherwise fetch
      if (uiConfig) {
        setCourseMetadata({
          title: uiConfig.title,
          placeholder: uiConfig.placeholder,
          mobile_title: uiConfig.mobileTitle,
          description: uiConfig.tagline
        });
        setCurrentView('mainApp');
      } else {
        // Fallback to API call
        api.courseMeta(selectedCourseId)
          .then(setCourseMetadata)
          .catch((err) => {
            console.error('Failed to load course metadata:', err);
            // Fallback metadata
            const fallbackMetadata = {
              title: `${selectedCourseId.charAt(0).toUpperCase() + selectedCourseId.slice(1)} Course`,
              placeholder: `Ask your ${selectedCourseId} question...`,
              mobile_title: selectedCourseId.charAt(0).toUpperCase() + selectedCourseId.slice(1),
              description: `Learn about ${selectedCourseId}`
            }
            setCourseMetadata(fallbackMetadata)
          })
          .finally(() => {
            setCurrentView('mainApp')
          })
      }
    }
  }, [selectedCourseId, uiConfig])

  const handleSplashClick = () => {
    setShowSplash(false)
    setCurrentView('courseSelection')
  }

  const handleCourseSelect = (courseId) => {
    console.log('Course selected:', courseId)
    setSelectedCourseId(courseId)
  }

  const handleSubmit = async (query) => {
    if (!selectedCourseId) {
      console.error('No course selected')
      return
    }

    setLoading(true)
    setQualityStatus('loading')
    setRetryCount(0)
    
    try {
      console.log('Submitting query:', query, 'for course:', selectedCourseId)
      setPendingQuestion(query)
      
      // Use QueryService with quality management
      const result = await queryService.query(query, selectedCourseId)
      
      // Analyze response quality
      const quality = analyzeResponseQuality(result)
      const score = getQualityScore(result)
      
      setQualityStatus(quality)
      setQualityScore(score)
      setCurrentResponse(result)
      
      console.log(`📊 Query quality: ${quality} (${score}/100)`)
      
      if (result.status === 'success') {
        console.log('✅ Response processed successfully:', {
          hasStrategicLens: !!result.data?.strategicThinkingLens,
          followUpCount: result.data?.followUpPrompts?.length || 0,
          conceptsCount: result.data?.conceptsToolsPractice?.length || 0
        })

        // Use backend-provided data directly (no fallbacks needed)
        const richAnswer = {
          strategicThinkingLens: result.data?.strategicThinkingLens || 'No strategic thinking lens available',
          followUpPrompts: result.data?.followUpPrompts || [],
          conceptsToolsPractice: result.data?.conceptsToolsPractice || []
        };

        setAnswer(richAnswer)
        addToHistory(query, result.data?.answer || '')
        setQueryInput('')

        // We now render prompts inside AnswerCard as a clickable numbered list
      } else if (result.status === 'rejected') {
        setAnswer(`Query rejected: ${result.message}`)
        setQualityStatus('low')
      } else {
        setAnswer('Error: Unknown response format')
        setQualityStatus('low')
      }
    } catch (error) {
      console.error('❌ Error submitting query:', error)
      setAnswer('Error: ' + error.message)
      setQualityStatus('low')
    } finally {
      setLoading(false)
    }
  }

  // Function to extract follow-up prompts from answer text (per guides)
  const extractFollowUpPrompts = (answerText) => {
    const followUpMatch = answerText.match(/\*\*Follow-up Prompts\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*Concepts\/Tools\*\*|$)/);
    if (followUpMatch) {
      const promptsText = followUpMatch[1];
      const prompts = promptsText.split('\n').filter(line => line.trim().match(/^\d+\./));
      return prompts.map(prompt => prompt.replace(/^\d+\.\s*/, '').trim());
    }
    return [];
  };

  // Extract Strategic Thinking Lens section from combined markdown answer
  const extractStrategicThinkingLens = (answerText) => {
    if (!answerText || typeof answerText !== 'string') return '';
    const lensMatch = answerText.match(/\*\*Strategic Thinking Lens\*\*[\r\n]+([\s\S]*?)(?=\n\n\*\*Follow-up Prompts\*\*|$)/);
    return lensMatch ? lensMatch[1].trim() : answerText.trim();
  };

  // Function to handle follow-up prompt clicks (per guides)
  const handleFollowUpClick = (prompt) => {
    const queryInput = document.getElementById('queryInput');
    if (queryInput) {
      queryInput.value = prompt;
      // Trigger form submission
      const form = document.getElementById('queryForm');
      if (form) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  };

  // Expose follow-up handler globally (legacy; not used by current UI rendering)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.handleFollowUpClick = handleFollowUpClick;
    }
  }, []);

  // Handle retry for better quality
  const handleRetry = async () => {
    if (retryCount >= 2) return; // Max 2 retries
    
    setRetryCount(prev => prev + 1);
    setQualityStatus('loading');
    
    try {
      // Retry the same query
      const result = await queryService.query(pendingQuestion, selectedCourseId);
      
      // Re-analyze quality
      const quality = analyzeResponseQuality(result);
      const score = getQualityScore(result);
      
      setQualityStatus(quality);
      setQualityScore(score);
      setCurrentResponse(result);
      
      console.log(`🔄 Retry ${retryCount + 1} quality: ${quality} (${score}/100)`);
      
      if (result.status === 'success') {
        const richAnswer = {
          strategicThinkingLens: result.data?.strategicThinkingLens || 'No strategic thinking lens available',
          followUpPrompts: result.data?.followUpPrompts || [],
          conceptsToolsPractice: result.data?.conceptsToolsPractice || []
        };
        
        setAnswer(richAnswer);
        addToHistory(pendingQuestion, result.data?.answer || '');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setQualityStatus('low');
    }
  };

  // Function to add question to history
  const addToHistory = (question, answerData) => {
    const historyItem = {
      id: Date.now(),
      question,
      answer: answerData,
      timestamp: new Date().toLocaleTimeString()
    }

    setQuestionHistory(prevHistory => {
      const newHistory = [historyItem, ...prevHistory.slice(0, 4)] // Keep only last 5
      return newHistory
    })
    
    // Reset to current question
    setCurrentHistoryIndex(-1)
  }

  // Function to load a question from history
  const loadFromHistory = (index) => {
    if (index >= 0 && index < questionHistory.length) {
      const historyItem = questionHistory[index]
      setAnswer(historyItem.answer)
      setQueryInput(historyItem.question)
      setCurrentHistoryIndex(index)
    }
  }

  // Function to return to current question
  const returnToCurrent = () => {
    setCurrentHistoryIndex(-1)
    setAnswer('')
    setQueryInput('')
    console.log('📚 Returned to current question')
  }

  const goBackToCourseSelection = () => {
    setCurrentView('courseSelection')
    setSelectedCourseId(null)
    setCourseMetadata(null)
    setAnswer('')
    setQueryInput('') // Clear query input when going back
    setQuestionHistory([]) // Clear history when going back
    setCurrentHistoryIndex(-1)
  }

  // API Warning Banner
  const ApiWarningBanner = () => {
    if (!showApiWarning) return null;
    
    return (
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        color: '#92400e',
        padding: '0.75rem 1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        position: 'relative'
      }}>
        <span style={{ marginRight: '1rem' }}>
          ⚠️ Frontend is pointing to itself. Set VITE_API_URL to the Lambda Function URL.
        </span>
        <button
          onClick={() => setShowApiWarning(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#92400e',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // CORS Error Banner
  const CorsErrorBanner = () => {
    const [showCorsError, setShowCorsError] = React.useState(false);
    
    React.useEffect(() => {
      // Check for CORS errors in console
      const originalError = console.error;
      console.error = (...args) => {
        const errorText = args.join(' ');
        if (errorText.includes('CORS') || errorText.includes('Access-Control-Allow-Origin')) {
          setShowCorsError(true);
        }
        originalError.apply(console, args);
      };
      
      return () => {
        console.error = originalError;
      };
    }, []);

    if (!showCorsError) return null;
    
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        color: '#991b1b',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        position: 'relative',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🚨 CORS Configuration Issue Detected
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          The backend Lambda function needs CORS configuration for <strong>https://www.engentlabs.com</strong>
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
          Backend team needs to add: Access-Control-Allow-Origin: https://www.engentlabs.com
        </div>
        <button
          onClick={() => setShowCorsError(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#991b1b',
            cursor: 'pointer',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem'
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // Splash Screen
  if (currentView === 'splash') {
    return (
        <div className="splash-screen" onClick={handleSplashClick}>
          <div className="splash-content">
            <div className="splash-logo">
            <img src={splashLogo} alt="GPTTutor Splash Logo" />
            </div>
            <h2 className="splash-subtitle">AI‑Powered Active Learning</h2>
            <p className="splash-tagline">
              <span className="splash-blue">Ask Smarter.</span>{" "}
              <span className="splash-white">Think Deeper.</span>{" "}
              <span className="splash-yellow">Apply Sharper.</span>
            </p>
        </div>
      </div>
    )
  }

  // Course Selection Screen
  if (currentView === 'courseSelection') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <ApiWarningBanner />
        <CorsErrorBanner />
        
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingTop: '3rem', 
          paddingBottom: '2rem', 
          paddingLeft: '1rem', 
          paddingRight: '1rem', 
          backgroundColor: 'white', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <img 
              src={engentLabsLogo} 
              alt="Engent Labs Logo" 
              style={{ 
                width: '3rem', 
                height: '3rem' 
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#111827',
                margin: 0
              }}>
                Engent Labs: Interactive Learning Platform
              </h1>

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '2rem 1rem' 
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '32rem' 
          }}>
                          <p style={{ 
                color: '#4b5563', 
                textAlign: 'center', 
                marginBottom: '2rem', 
                fontSize: '1rem', 
                fontWeight: '500', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
              }}>
                Select a practice lab
              </p>
            
            {/* Course Card */}
            <div 
              style={{
                backgroundColor: 'transparent',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e5e7eb',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = 'rgba(239, 246, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = 'transparent';
              }}
              onClick={() => handleCourseSelect('decision')}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '1rem' 
              }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#111827',
                  margin: 0
                }}>
                  {uiConfig?.title || "Loading..."}
                </h2>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ 
                    color: '#2563eb', 
                    fontSize: '1rem', 
                    fontWeight: 'bold' 
                  }}>→</span>
                </div>
              </div>
              <p style={{ 
                color: '#4b5563', 
                fontSize: '1rem', 
                lineHeight: '1.6', 
                margin: 0
              }}>
                A systematic process to integrate strategy, data analytics, and human judgment to make consistent, executable decisions.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '2rem 1rem', 
          backgroundColor: 'white', 
          borderTop: '1px solid #f3f4f6' 
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            margin: 0
          }}>
            Engent Labs © 2025 — Ask Smarter. Think Deeper. Apply Sharper.
          </p>
        </footer>

        {/* Debug component - only show in development */}
        {import.meta.env.DEV && <BackendTest />}
      </div>
    )
  }

  // Main Application Screen
  if (currentView === 'mainApp' && selectedCourseId && courseMetadata) {
    return (
      <div className="app-shell">
          <CorsErrorBanner />
          <nav className="navbar">
            <div className="navbar-content">
            <button 
              onClick={goBackToCourseSelection}
              className="back-button"
              aria-label="Back to courses"
              title="Back to courses"
            >
              ←
            </button>
              <div className="title-badge">
              <span className="desktop-title">{`Engent Labs: ${courseMetadata.title}`}</span>
              <span className="mobile-title">{`Engent Labs: ${courseMetadata.mobile_title || courseMetadata.title}`}</span>
              </div>
              
              {/* Cache Management Button */}
              <button
                onClick={() => {
                  queryService.clearCache();
                  setQualityStatus('loading');
                  setQualityScore(0);
                  setRetryCount(0);
                  setCurrentResponse(null);
                }}
                className="cache-clear-button"
                title="Clear cache and warm up Lambda"
              >
                🧹 Clear Cache
              </button>
            </div>
          </nav>
          
          <div className="content-area">
            <div className="main-wrapper">
              <div className="question-wrapper">
                <QueryInput 
                onSubmit={handleSubmit} 
                  value={queryInput}
                  onChange={setQueryInput}
                  loading={loading}
                placeholder={courseMetadata.placeholder || `Ask your ${selectedCourseId} question...`}
                />
              </div>
              
              {loading && (
                <div>
                  <div className="loading-message">
                    <p className="text-base text-gray-700 text-center">
                      {qualityStatus === 'loading' && retryCount === 0 
                        ? (
                          <>
                            {!queryService.isWarmedUp ? "🚀 Starting Server..." : "Processing your question…"}
                            <span className="timing-info"> (usually takes {queryService.getEstimatedProcessingTime()})</span>
                          </>
                        )
                        : retryCount > 0 
                        ? (
                          <>
                            🔄 Activating Server... 
                            <span className="timing-info"> (usually takes 15–20 seconds)</span>
                          </>
                        )
                        : (
                          <>
                            Processing your question… 
                            <span className="timing-info"> (usually takes 10–15 seconds)</span>
                          </>
                        )
                      }
                    </p>
                    {retryCount > 0 && (
                      <p className="text-sm text-center mt-2">
                        <span className="timing-info">System Activation (step {retryCount}/2, 2-5 seconds)</span>
                      </p>
                    )}
                  </div>
                  {/* Loading skeleton */}
                  <div style={{ marginTop: '1rem' }}>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="skeleton-section">
                        <h2 className="skeleton-title">&nbsp;</h2>
                        <div className="skeleton-line" />
                        <div className="skeleton-line short" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {answer && !loading && (
                <div className="answer-body">
                  {/* Quality Indicator */}
                  <QualityIndicator 
                    status={qualityStatus} 
                    retryCount={retryCount}
                    qualityScore={qualityScore}
                  />
                  
                  {/* Question History - positioned above answer */}
                  <QuestionHistory
                    history={questionHistory}
                    currentIndex={currentHistoryIndex}
                    currentQuestion={pendingQuestion || ''}
                    onLoadHistory={loadFromHistory}
                    onReturnToCurrent={returnToCurrent}
                    visible={questionHistory.length > 0}
                  />
                  
                  {/* Use ResponseDisplay for better quality management */}
                  {currentResponse && currentResponse.status === 'success' ? (
                    <ResponseDisplay 
                      response={currentResponse}
                      quality={qualityStatus}
                      retryCount={retryCount}
                      onRetry={handleRetry}
                    />
                  ) : (
                    <AnswerCard 
                      answer={answer}
                      onReflectionPromptClick={(prompt) => {
                        setQueryInput(prompt)
                        setPendingQuestion(prompt)
                        handleSubmit(prompt)
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
      </div>
    )
  }

  // Fallback loading state
  return (
    <div className="App">
      <header className="App-header">
        <h1>Loading...</h1>
      </header>
    </div>
  )
}

// Main App Component with Routing
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/labs" element={<LabsApp />} />
      </Routes>
    </Router>
  );
}

export default App
