import { useState, useEffect, useMemo } from 'react';

export default function CourseSelector({ onCourseSelect, selectedCourseId = null }) {
  const [coursesMetadata, setCoursesMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Predefined list of available course IDs - memoized to avoid dependency issues
  const courseIds = useMemo(() => ['decision', 'marketing', 'strategy'], []);

  // Define backend base URL with fallback
  const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Fetch metadata for all courses
  useEffect(() => {
    const fetchAllCourseMetadata = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const metadataPromises = courseIds.map(async (courseId) => {
          try {
            const response = await fetch(`${API_BASE}/api/course/${courseId}`);
            if (response.ok) {
              const data = await response.json();
              // V1.6.5 backend wraps metadata inside "metadata"
              return { courseId, data: data.metadata };
            } else {
              console.warn(`Failed to fetch metadata for course ${courseId}: ${response.status}`);
              return { courseId, data: null };
            }
          } catch (error) {
            console.error(`Error fetching metadata for course ${courseId}:`, error);
            return { courseId, data: null };
          }
        });

        const results = await Promise.all(metadataPromises);
        const metadataMap = {};
        
        results.forEach(({ courseId, data }) => {
          if (data) {
            metadataMap[courseId] = data;
          }
        });

        setCoursesMetadata(metadataMap);
      } catch (error) {
        console.error("Failed to fetch course metadata:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCourseMetadata();
  }, [courseIds, API_BASE]);

  if (loading) {
    return (
      <div className="course-selector">
        <h2 className="course-selector-title">Choose Your Practice Lab</h2>
        <p className="course-selector-subtitle">
          Loading available courses...
        </p>
        <div className="course-grid">
          {courseIds.map((courseId) => (
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
        {courseIds.map((courseId) => {
          const courseData = coursesMetadata[courseId];
          
          if (!courseData) {
            return (
              <div key={courseId} className="course-card disabled">
                <div className="course-card-header">
                  <h3 className="course-name">Course Unavailable</h3>
                  <div className="course-badge">{courseId}</div>
                </div>
                <p className="course-description">This course is currently unavailable.</p>
              </div>
            );
          }

          return (
            <div
              key={courseId}
              className={`course-card ${selectedCourseId === courseId ? 'selected' : ''}`}
              onClick={() => onCourseSelect(courseId)}
            >
              <div className="course-card-header">
                <h3 className="course-name">{courseData.short_name || courseData.title}</h3>
                <div className="course-badge">{courseId}</div>
              </div>
              <p className="course-description">{courseData.description || courseData.tagline}</p>
              <div className="course-example">
                <strong>Example:</strong> {courseData.placeholder || "Ask a question..."}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 