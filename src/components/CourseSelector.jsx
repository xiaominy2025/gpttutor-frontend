import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import QueryService from "../services/QueryService";

function CourseSelector({ onCourseSelect }) {
  const [courses, setCourses] = useState([]);
  const queryService = QueryService.getInstance();

  useEffect(() => {
    // Fetch course metadata from API
    api.loadCourseUIConfig("decision")
      .then(data => {
        setCourses([{
          course_id: "decision",
          title: data.title,
          description: data.tagline
        }]);
      })
      .catch(err => {
        console.error("Failed to load course metadata:", err);
        // No fallback - rely on backend only
        setCourses([]);
      });

    // Pre-warm Lambda while user is selecting course
    const preWarmLambda = async () => {
      console.log('🚀 CourseSelector: Starting pre-warm-up of Lambda function...');
      try {
        if (!queryService.isWarmedUp) {
          console.log('🔥 CourseSelector: Lambda not warmed up, starting warm-up process...');
          // Start warm-up in background
          queryService.query("What is strategic planning?", "decision").then(() => {
            console.log('✅ CourseSelector: Lambda pre-warm-up completed successfully');
          }).catch((error) => {
            console.warn('⚠️ CourseSelector: Lambda pre-warm-up failed:', error);
          });
        } else {
          console.log('✅ CourseSelector: Lambda already warmed up, no pre-warming needed');
        }
      } catch (error) {
        console.warn('⚠️ CourseSelector: Failed to start Lambda pre-warm-up:', error);
      }
    };

    // Start pre-warming after a short delay to let course data load first
    setTimeout(preWarmLambda, 1000);
  }, []);

  return (
    <div className="course-selector">
      <h2>Select a practice lab</h2>
      <div className="course-list">
        {courses.map(course => (
          <div
            key={course.course_id}
            className="course-card"
            onClick={() => onCourseSelect(course.course_id, course)}
          >
            <h3>{course.title}</h3>
            <p>{course.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseSelector;
