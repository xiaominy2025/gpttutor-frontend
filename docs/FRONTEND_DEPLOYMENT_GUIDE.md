# 🚀 GPTTutor Frontend Deployment Guide

## 📋 Overview

This guide ensures **perfect communication** between your frontend application and the deployed GPTTutor backend on AWS Lambda. The backend is production-ready and waiting for frontend integration.

## 🌐 Deployed Backend Configuration

### **AWS Lambda Function URL**
```
https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

### **Backend Status**
- ✅ **Production Ready** (v1666)
- ✅ **All Features Enabled**: semantic, entities, dedup, merged lens
- ✅ **CORS Enabled**: No additional configuration needed
- ✅ **Response Time**: ~2.5 seconds average

## 🔧 Essential Frontend Integration

### 1. **Health Check (Required on App Start)**

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

### 2. **Load Course UI Configuration**

```javascript
// Load UI metadata for course display
async function loadCourseUIConfig(courseId = 'decision') {
  try {
    const response = await fetch(`https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/api/course/${courseId}`);
    const data = await response.json();
    
    // The /api/course/{courseId} endpoint returns metadata directly
              return {
          title: data.title || "Decision-Making Practice Lab",
          mobileTitle: data.mobile_title || "Decision Lab",
          tagline: data.tagline || "A GPT-powered active learning platform",
          placeholder: data.placeholder || "Ask a decision-making question...",
          defaultSections: data.default_sections || 3,
          sectionsTitles: data.sections_titles || [
            "Strategic Thinking Lens",
            "Follow-up Prompts", 
            "Concepts/Tools"
          ]
        };
    }
  } catch (error) {
    console.error('Failed to load course config:', error);
    return null;
  }
}
```

### 3. **Process Queries (Main Functionality)**

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

### **Query Response Format**

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

### **Answer Format Structure**

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

### **React Component Example**

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

### **Follow-up Prompts Implementation**

```javascript
// Extract and display follow-up prompts from the answer
function extractFollowUpPrompts(answerText) {
  const followUpMatch = answerText.match(/\*\*Follow-up Prompts\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*Concepts\/Tools\*\*|$)/);
  if (followUpMatch) {
    const promptsText = followUpMatch[1];
    const prompts = promptsText.split('\n').filter(line => line.trim().match(/^\d+\./));
    return prompts.map(prompt => prompt.replace(/^\d+\.\s*/, '').trim());
  }
  return [];
}

// Display clickable follow-up prompts
function displayFollowUpPrompts(prompts) {
  const container = document.getElementById('followUpPrompts');
  if (!container || !prompts || prompts.length === 0) return;

  const promptsHtml = prompts.map((prompt, index) => `
    <button 
      class="follow-up-prompt bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-left transition-all duration-200 cursor-pointer"
      onclick="handleFollowUpClick('${prompt.replace(/'/g, "\\'")}')"
    >
      <div class="flex items-start space-x-3">
        <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span class="text-blue-600 text-sm font-medium">${index + 1}</span>
        </div>
        <div class="flex-1">
          <p class="text-gray-700 font-medium">${prompt}</p>
          <p class="text-gray-500 text-sm mt-1">Click to ask this question</p>
        </div>
      </div>
    </button>
  `).join('');

  container.innerHTML = promptsHtml;
}

// Handle follow-up prompt clicks
function handleFollowUpClick(prompt) {
  const queryInput = document.getElementById('queryInput');
  if (queryInput) {
    queryInput.value = prompt;
    // Trigger form submission
    document.getElementById('queryForm').dispatchEvent(new Event('submit'));
  }
}
```

### **Error Handling**

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

### **Test Script**

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

### **Quick Test Commands**

```bash
# Test health endpoint
curl https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/health

# Test query endpoint
curl -X POST https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I make a decision?", "course_id": "decision"}'
```

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] Backend health check passes
- [ ] Course UI configuration loads correctly
- [ ] Query processing works with test queries
- [ ] Follow-up prompts extraction works
- [ ] Error handling functions properly
- [ ] Loading states display correctly

### **Deployment Steps**
1. **Upload frontend files** to your hosting platform (S3, Vercel, Netlify, etc.)
2. **Verify file integrity** - Check that all JavaScript files load without errors
3. **Test API connectivity** from deployed domain
4. **Verify CORS** - Backend already configured for all origins
5. **Test follow-up prompts** - Ensure clickable functionality works
6. **Check error handling** - Test with network failures

### **Post-Deployment Verification**
```javascript
// Add this to your deployed site to test
async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  
  // Test 1: API connectivity
  const healthOk = await checkBackendHealth();
  
  // Test 2: Submit a test query
  if (healthOk) {
    const testQuery = "How do I make a decision under uncertainty?";
    const result = await processQuery(testQuery);
    console.log('📋 Test response:', result);
    
    if (result.success) {
      console.log('✅ Query processing works');
      console.log('✅ Concepts extracted:', result.conceptsToolsPractice.length);
      
      // Test follow-up prompts
      const prompts = extractFollowUpPrompts(result.answer);
      console.log('✅ Follow-up prompts:', prompts.length);
    } else {
      console.warn('⚠️ Query processing failed:', result.error);
    }
  }
}
```

## ⚠️ Important Notes

### **1. CORS Configuration**
- ✅ The backend has CORS enabled for all origins
- ✅ No additional CORS configuration needed on frontend

### **2. Rate Limiting**
- Implement exponential backoff for retries
- Respect 429 status codes

### **3. Error States**
- Always handle network failures gracefully
- Show appropriate loading states
- Provide fallback content when backend is unavailable

### **4. Response Validation**
- Always validate `conceptsToolsPractice` is an array
- Check for required fields before rendering
- Handle malformed responses gracefully

## 🔧 Troubleshooting Common Issues

### **Issue 1: API Calls Failing**
**Symptoms**: Network errors in console
**Solutions**:
1. Check if backend URL is correct
2. Test API endpoints directly with curl/Postman
3. Verify backend is accessible from deployment domain
4. Check browser console for CORS errors

### **Issue 2: Response Format Mismatch**
**Symptoms**: Follow-up prompts not displaying
**Solutions**:
1. Verify backend returns expected response format
2. Check response structure matches expected format
3. Add response logging to debug format issues

### **Issue 3: Follow-up Prompts Not Clickable**
**Symptoms**: Prompts appear but don't respond to clicks
**Solutions**:
1. Check browser console for JavaScript errors
2. Verify `onclick` handlers are properly attached
3. Ensure no CSS is blocking click events
4. Test with a simple alert to verify event binding

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Frontend loads without console errors
- [ ] API health check returns success
- [ ] Query submission works
- [ ] Follow-up prompts appear as clickable buttons
- [ ] Clicking a prompt populates input and auto-submits
- [ ] Response sections display properly formatted
- [ ] Concepts/tools are extracted and displayed
- [ ] Error handling works gracefully

## 📞 Support

For backend issues or questions:
- Check the backend logs in AWS CloudWatch
- Verify the Lambda function is running
- Test endpoints directly with curl or Postman

---

**Version**: v1666  
**Last Updated**: December 2024  
**Backend Status**: ✅ Production Ready  
**Frontend Integration**: ✅ Ready for Deployment
