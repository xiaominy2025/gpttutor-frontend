import { useState, useEffect, useMemo } from 'react';

export default function CourseSelector({ onCourseSelect, selectedCourseId = null }) {
  const [coursesMetadata, setCoursesMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch available course IDs from backend - with fallback to known courses
  const [availableCourseIds, setAvailableCourseIds] = useState(['decision', 'marketing', 'strategy']);
  
  // Generic fallback course data in case backend is unavailable
  const fallbackCourseData = useMemo(() => ({
    decision: {
      title: "Decision-Making Practice Lab",
      short_name: "Decision Lab",
      description: "Practice strategic decision-making with real-world scenarios",
      tagline: "Master the art of strategic decision-making",
      placeholder: "Ask your decision-making question...",
      mobile_title: "Decision Lab"
    },
    marketing: {
      title: "Marketing Strategy Practice Lab", 
      short_name: "Marketing Lab",
      description: "Develop marketing strategies and analyze market dynamics",
      tagline: "Build winning marketing strategies",
      placeholder: "Ask your marketing question...",
      mobile_title: "Marketing Lab"
    },
    strategy: {
      title: "Strategic Thinking Practice Lab",
      short_name: "Strategy Lab", 
      description: "Enhance strategic thinking and planning capabilities",
      tagline: "Think strategically, act decisively",
      placeholder: "Ask your strategy question...",
      mobile_title: "Strategy Lab"
    }
  }), []);

  // Define backend base URL with fallback
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Fetch available course IDs and metadata for all courses
  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // First, try to fetch available course IDs from backend
        try {
          const coursesUrl = `${API_BASE}/api/courses`;
          console.log("🔧 Fetching available courses from:", coursesUrl);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const response = await fetch(coursesUrl, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.courses && Array.isArray(data.courses)) {
              console.log("🔧 Available courses from backend:", data.courses);
              setAvailableCourseIds(data.courses);
            }
          }
        } catch (error) {
          console.warn("Could not fetch available courses from backend, using fallback:", error);
          // Keep the default course IDs
        }
      } catch (error) {
        console.error("Error in fetchAvailableCourses:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllCourseMetadata = async () => {
      try {
        setLoading(true);
        setError(false);
        
        console.log("🔧 Starting to fetch metadata for courses:", availableCourseIds);
        console.log("🔧 API_BASE:", API_BASE);
        
        const metadataPromises = availableCourseIds.map(async (courseId) => {
          try {
            const url = `${API_BASE}/api/course/${courseId}`;
            console.log(`🔧 Fetching metadata for ${courseId} from:`, url);
            
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(url, {
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`🔧 Response for ${courseId}:`, response.status, response.statusText);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`🔧 Raw data for ${courseId}:`, data);
              // V1.6.5 backend wraps metadata inside "metadata"
              const metadata = data.metadata;
              console.log(`🔧 Metadata for ${courseId}:`, metadata);
              return { courseId, data: metadata };
            } else {
              console.warn(`Failed to fetch metadata for course ${courseId}: ${response.status}`);
              return { courseId, data: null };
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.error(`Timeout fetching metadata for course ${courseId}`);
            } else {
              console.error(`Error fetching metadata for course ${courseId}:`, error);
            }
            return { courseId, data: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        console.log("🔧 All fetch results:", results);
        
        const metadataMap = {};
        
        results.forEach(({ courseId, data }) => {
          if (data) {
            metadataMap[courseId] = data;
          }
        });

        console.log("🔧 Final metadata map:", metadataMap);
        setCoursesMetadata(metadataMap);
      } catch (error) {
        console.error("Failed to fetch course metadata:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // First fetch available courses, then fetch metadata
    fetchAvailableCourses().then(() => {
      fetchAllCourseMetadata();
    });
  }, [API_BASE]);

  if (loading) {
    return (
      <div className="course-selector">
        <h2 className="course-selector-title">Choose Your Practice Lab</h2>
        <p className="course-selector-subtitle">
          Loading available courses...
        </p>
        <div className="course-grid">
          {availableCourseIds.map((courseId) => (
            <div key={courseId} className="course-card loading">
              <div className="course-card-header">
                <h3 className="course-name">Loading...</h3>
                <div className="course-badge">{courseId}</div>
              </div>
              <p className="course-description">Loading course information...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-selector">
        <h2 className="course-selector-title">Choose Your Practice Lab</h2>
        <div className="error-message">
          ⚠️ Unable to load course data. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="course-selector">
      <h2 className="course-selector-title">Choose Your Practice Lab</h2>
      <p className="course-selector-subtitle">
        Select a specialized learning environment to practice your skills
      </p>
      
      <div className="course-grid">
        {availableCourseIds.map((courseId) => {
          const courseData = coursesMetadata[courseId] || fallbackCourseData[courseId];
          
          // Always show courses as available, using fallback data if backend is down
          return (
            <div
              key={courseId}
              className={`course-card ${selectedCourseId === courseId ? 'selected' : ''}`}
              onClick={() => onCourseSelect(courseId)}
            >
              <div className="course-card-header">
                <h3 className="course-name">{courseData.short_name || courseData.title}</h3>
                <div className="course-badge">{courseId.toUpperCase()}</div>
              </div>
              <p className="course-description">{courseData.description || courseData.tagline}</p>
              <div className="course-example">
                <strong>Example:</strong> {courseData.placeholder || "Ask a question..."}
              </div>
              {!coursesMetadata[courseId] && (
                <div className="course-offline-notice">
                  <small>⚠️ Offline mode - using cached data</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 