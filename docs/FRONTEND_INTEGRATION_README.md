# 🚀 GPTTutor Frontend Integration Guide

## 📋 Overview

This guide ensures perfect communication between your frontend application and the GPTTutor backend (v1666). The backend is deployed as an AWS Lambda function with a public URL endpoint.

## 🌐 Backend Endpoints

### Base URL
```
https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

### Available Endpoints

| Endpoint | Method | Purpose | Response Format |
|----------|--------|---------|-----------------|
| `/health` | GET | Health check | `{status, version, engine_ready}` |
| `/query` | POST | Process queries | `{status, data: {answer, conceptsToolsPractice, ...}}` |
| `/courses` | GET | List available courses | `{success, data: {courses, default_course}}` |
| `/api/course/{course_id}` | GET | Get course metadata | `{title, mobile_title, tagline, placeholder, ...}` |
| `/api/course/{course_id}` | GET | Get course metadata | `{course_id, metadata, glossary}` |

## 🔧 Essential Frontend Integration

### 1. Health Check (Required on App Start)

```javascript
// Check backend health on app initialization
async function checkBackendHealth() {
  try {
    const response = await fetch('https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/health');
    const data = await response.json();
    
    if (data.status === 'healthy') {
      console.log('✅ Backend is ready:', data.version);
      return true;
    } else {
      console.error('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
}
```

### 2. Load Course UI Configuration

```javascript
// Load UI metadata for course display
async function loadCourseUIConfig(courseId = 'decision') {
  try {
    const response = await fetch(`https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/api/course/${courseId}`);
    const data = await response.json();
    
    // The /api/course/{courseId} endpoint returns metadata directly
    const uiConfig = data;
      return {
        title: uiConfig.title || "Decision-Making Practice Lab",
        mobileTitle: uiConfig.mobile_title || "Decision Lab",
        tagline: uiConfig.tagline || "A GPT-powered active learning platform",
        placeholder: uiConfig.placeholder || "Ask a decision-making question...",
        defaultSections: uiConfig.default_sections || 3,
        sectionsTitles: uiConfig.sections_titles || [
          "Strategic Thinking Lens",
          "Follow-up Prompts", 
          "Concepts/Tools"
        ],
        tooltipRules: uiConfig.tooltip_rules || {
          single_domain_max: 3,
          primary_domain_max: 2,
          secondary_domain_max: 1,
          total_cap: 4
        }
      };
    }
  } catch (error) {
    console.error('Failed to load course config:', error);
    return null;
  }
}
```

### 3. Process Queries (Main Functionality)

```javascript
// Process user queries and get structured responses
async function processQuery(query, courseId = 'decision', userId = 'default') {
  try {
    const response = await fetch('https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        course_id: courseId,
        user_id: userId
      })
    });

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        success: true,
        answer: data.data.answer,
        conceptsToolsPractice: data.data.conceptsToolsPractice || [],
        processingTime: data.data.processing_time,
        model: data.data.model,
        timestamp: data.data.timestamp
      };
    } else if (data.status === 'rejected') {
      return {
        success: false,
        rejected: true,
        message: data.message
      };
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Query processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## 📊 Response Data Structures

### Query Response Format

```typescript
interface QueryResponse {
  status: 'success' | 'rejected' | 'error';
  data?: {
    answer: string;                    // Full formatted answer
    query: string;                     // Original query
    course_id: string;                 // Always "decision"
    timestamp: string;                 // ISO timestamp
    model: string;                     // "gpt-3.5-turbo"
    processing_time: number;           // Processing time in seconds
    conceptsToolsPractice: Concept[];  // Extracted concepts/tools
  };
  message?: string;                    // For rejected queries
  error?: string;                      // For errors
}

interface Concept {
  term: string;        // Concept name
  definition: string;  // Concept definition
}
```

### Answer Format Structure

The `answer` field contains a formatted response with these sections:

```markdown
**Strategic Thinking Lens**
[Strategic analysis content]

**Follow-up Prompts**
[Follow-up questions]

**Concepts/Tools**
[Extracted concepts and tools]
```

## 🎯 Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function GPTTutorInterface() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uiConfig, setUiConfig] = useState(null);

  useEffect(() => {
    // Load UI configuration on component mount
    loadCourseUIConfig().then(setUiConfig);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    const result = await processQuery(query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="gpt-tutor-interface">
      <h1>{uiConfig?.title || 'Decision-Making Practice Lab'}</h1>
      <p>{uiConfig?.tagline}</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={uiConfig?.placeholder}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Ask Question'}
        </button>
      </form>

      {response && (
        <div className="response">
          {response.success ? (
            <>
              <div className="answer">{response.answer}</div>
              <div className="concepts">
                <h3>Concepts & Tools ({response.conceptsToolsPractice.length})</h3>
                {response.conceptsToolsPractice.map((concept, index) => (
                  <div key={index} className="concept">
                    <strong>{concept.term}:</strong> {concept.definition}
                  </div>
                ))}
              </div>
              <div className="meta">
                Processing time: {response.processingTime}s | Model: {response.model}
              </div>
            </>
          ) : (
            <div className="error">
              {response.rejected ? response.message : response.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Error Handling

```javascript
// Comprehensive error handling for all API calls
function handleBackendError(error, context = '') {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    // Network error
    return {
      type: 'network',
      message: 'Unable to connect to the backend. Please check your internet connection.',
      retry: true
    };
  }
  
  if (error.status === 429) {
    // Rate limiting
    return {
      type: 'rate_limit',
      message: 'Too many requests. Please wait a moment before trying again.',
      retry: true,
      retryAfter: 30
    };
  }
  
  if (error.status >= 500) {
    // Server error
    return {
      type: 'server',
      message: 'Backend service is temporarily unavailable. Please try again later.',
      retry: true
    };
  }
  
  // Generic error
  return {
    type: 'unknown',
    message: `An error occurred: ${error.message}`,
    retry: false
  };
}
```

## 🔍 Testing Your Integration

### Test Script

```javascript
// Test script to verify all endpoints
async function testBackendIntegration() {
  console.log('🧪 Testing Backend Integration...');
  
  // 1. Health Check
  console.log('\n1. Testing Health Check...');
  const health = await checkBackendHealth();
  console.log('Health:', health);
  
  // 2. Load Course Config
  console.log('\n2. Testing Course Config...');
  const config = await loadCourseUIConfig();
  console.log('Config:', config);
  
  // 3. Test Query
  console.log('\n3. Testing Query Processing...');
  const queryResult = await processQuery('How do I make a difficult decision?');
  console.log('Query Result:', queryResult);
  
  console.log('\n✅ Integration test completed!');
}
```

## ⚠️ Important Notes

### 1. CORS Configuration
- The backend has CORS enabled for all origins
- No additional CORS configuration needed on frontend

### 2. Rate Limiting
- Implement exponential backoff for retries
- Respect 429 status codes

### 3. Error States
- Always handle network failures gracefully
- Show appropriate loading states
- Provide fallback content when backend is unavailable

### 4. Response Validation
- Always validate `conceptsToolsPractice` is an array
- Check for required fields before rendering
- Handle malformed responses gracefully

## 🚀 Deployment Checklist

- [ ] Backend health check on app initialization
- [ ] Course UI configuration loading
- [ ] Query processing with proper error handling
- [ ] Response parsing and validation
- [ ] Loading states and user feedback
- [ ] Error recovery and retry logic
- [ ] Mobile-responsive design
- [ ] Accessibility compliance

## 📞 Support

For backend issues or questions:
- Check the backend logs in AWS CloudWatch
- Verify the Lambda function is running
- Test endpoints directly with curl or Postman

---

**Version**: v1666  
**Last Updated**: December 2024  
**Backend Status**: ✅ Production Ready
