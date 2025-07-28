import { getAllCourses } from '../config/courseData';

export default function CourseSelector({ onCourseSelect, selectedCourseId = null }) {
  const courses = getAllCourses();

  return (
    <div className="course-selector">
      <h2 className="course-selector-title">Choose Your Practice Lab</h2>
      <p className="course-selector-subtitle">
        Select a specialized learning environment to practice your skills
      </p>
      
      <div className="course-grid">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`course-card ${selectedCourseId === course.id ? 'selected' : ''}`}
            onClick={() => onCourseSelect(course.id)}
          >
            <div className="course-card-header">
              <h3 className="course-name">{course.shortName}</h3>
              <div className="course-badge">{course.id}</div>
            </div>
            <p className="course-description">{course.description}</p>
            <div className="course-example">
              <strong>Example:</strong> {course.samplePrompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 