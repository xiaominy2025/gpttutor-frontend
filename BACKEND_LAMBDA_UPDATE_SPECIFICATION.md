# 🔧 Backend Lambda Function Update Specification
## GPTTutor V1.6.6.6 Frontend-Backend Integration

**Date:** 2025-08-22  
**Frontend Version:** V1.6.6.6  
**Backend Target:** AWS Lambda Function  
**Integration Status:** Requires Backend Updates

---

## 🎯 **CRITICAL ISSUES TO FIX**

### 1. **CORS Configuration** ❌ BLOCKING
**Current Issue:** Multiple CORS headers causing browser rejection
```
Access-Control-Allow-Origin: *, *
```
**Required Fix:** Single CORS header for production domain
```
Access-Control-Allow-Origin: https://engentlabs.com
```

### 2. **Response Format Inconsistency** ❌ BLOCKING
**Current Issue:** Different response formats between direct Lambda calls and Function URL
- **Direct Lambda:** Returns proper V1.6.6.6 structure with `data`/`status`
- **Function URL:** Returns simplified `message`/`version` structure

**Required Fix:** Consistent V1.6.6.6 response format for all endpoints

### 3. **Missing Strategic Thinking Lens Section** ⚠️ PARTIAL
**Current Issue:** Only `followUpPrompts` and `conceptsToolsPractice` sections present
**Required Fix:** Include `strategicThinkingLens` section in all query responses

---

## 📋 **REQUIRED BACKEND CHANGES**

### **1. CORS Headers Configuration**

**Current (Incorrect):**
```python
headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}
```

**Required (Correct):**
```python
headers = {
    'Access-Control-Allow-Origin': 'https://engentlabs.com',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
}
```

### **2. OPTIONS Preflight Handler**

**Add to Lambda function:**
```python
def handle_options(event):
    """Handle OPTIONS preflight requests"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': 'https://engentlabs.com',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Max-Age': '86400'
        },
        'body': ''
    }
```

### **3. Standardized Response Format**

**All endpoints must return this structure:**
```python
def create_response(data, status="success", status_code=200):
    """Create standardized V1.6.6.6 response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': 'https://engentlabs.com',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'data': data,
            'status': status,
            'version': 'V1.6.6.6',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
    }
```

---

## 🔌 **ENDPOINT SPECIFICATIONS**

### **1. Health Check Endpoint (`/health`)**

**Request:** `GET /health`

**Required Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "status": "healthy",
      "version": "V1.6.6.6",
      "timestamp": "2025-08-22T18:30:00Z"
    },
    "status": "success"
  }
}
```

### **2. Query Processing Endpoint (`/query`)**

**Request:** `POST /query`
```json
{
  "query": "Under tariff uncertainty, how do I plan my production?",
  "course_id": "decision",
  "user_id": "default"
}
```

**Required Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "answer": "Strategic analysis content...",
      "strategicThinkingLens": [
        {
          "title": "Strategic Framework",
          "content": "Analysis using strategic thinking frameworks..."
        }
      ],
      "followUpPrompts": [
        "What are the key uncertainties in this scenario?",
        "How would you prioritize different production factors?"
      ],
      "conceptsToolsPractice": [
        {
          "concept": "Real Options Analysis",
          "description": "Framework for decision-making under uncertainty"
        }
      ],
      "model": "gpt-3.5-turbo",
      "processing_time": 3.21
    },
    "status": "success"
  }
}
```

### **3. Courses Endpoint (`/courses`)**

**Request:** `GET /courses`

**Required Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "courses": ["decision", "marketing", "strategy"]
    },
    "status": "success"
  }
}
```

### **4. Course Metadata Endpoint (`/api/course/{courseId}`)**

**Request:** `GET /api/course/decision`

**Required Response:**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "data": {
      "course_id": "decision",
      "title": "Decision-Making Practice Lab",
      "mobile_title": "Decision Lab",
      "tagline": "A GPT-powered active learning platform for deeper understanding",
      "placeholder": "Ask a decision-making question...",
      "default_sections": 3,
      "sections_titles": [
        "Strategic Thinking Lens",
        "Follow-up Prompts", 
        "Concepts/Tools"
      ]
    },
    "status": "success"
  }
}
```

---

## 🛠️ **IMPLEMENTATION CHECKLIST**

### **Lambda Function Updates Required:**

- [ ] **Fix CORS headers** - Single origin `https://engentlabs.com`
- [ ] **Add OPTIONS handler** - Handle preflight requests
- [ ] **Standardize response format** - All endpoints use `data`/`status` structure
- [ ] **Add strategicThinkingLens section** - Include in query responses
- [ ] **Fix courses endpoint** - Return proper `{"courses": [...]}` format
- [ ] **Add course metadata endpoint** - Serve course configuration
- [ ] **Update error handling** - Consistent error response format
- [ ] **Add request validation** - Validate incoming request structure
- [ ] **Add response logging** - Log response times and formats

### **Testing Requirements:**

- [ ] **CORS testing** - Verify single origin header
- [ ] **Preflight testing** - Test OPTIONS requests
- [ ] **Response format testing** - Verify consistent structure
- [ ] **Frontend integration testing** - Test with deployed frontend
- [ ] **Error handling testing** - Test various error scenarios
- [ ] **Performance testing** - Verify response times under load

---

## 🔍 **CURRENT FRONTEND EXPECTATIONS**

### **API Base URL:**
```
https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

### **Production Domain:**
```
https://engentlabs.com
```

### **Frontend Features Requiring Backend Support:**
- ✅ Health check on splash screen
- ✅ Course metadata loading
- ✅ Query processing with course selection
- ✅ Follow-up question handling
- ✅ Strategic thinking lens display
- ✅ Concepts and tools section
- ✅ Error handling and user feedback

---

## 📊 **SUCCESS METRICS**

### **Before Update (Current Issues):**
- ❌ CORS errors blocking all requests
- ❌ Inconsistent response formats
- ❌ Missing strategic thinking lens
- ❌ Frontend cannot connect to backend

### **After Update (Target State):**
- ✅ No CORS errors
- ✅ Consistent V1.6.6.6 response format
- ✅ Complete strategic analysis sections
- ✅ Seamless frontend-backend integration
- ✅ All diagnostic tests passing

---

## 🚀 **DEPLOYMENT NOTES**

### **Lambda Function Configuration:**
- **Runtime:** Python 3.11
- **Handler:** `lambda_function.lambda_handler`
- **Timeout:** 30 seconds
- **Memory:** 1536 MB
- **Region:** us-east-2

### **Environment Variables:**
- `OPENAI_API_KEY` - From AWS Secrets Manager
- `OPENAI_MODEL` - gpt-3.5-turbo
- `TEMPERATURE` - 0.3

### **Function URL:**
```
https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

---

## 📞 **COMMUNICATION SUMMARY**

**Priority:** 🔴 **CRITICAL** - Frontend is deployed and ready, backend CORS issues are blocking all functionality.

**Impact:** The frontend is fully functional and deployed to S3, but cannot communicate with the backend due to CORS configuration issues.

**Timeline:** Backend updates should be implemented immediately to enable full functionality.

**Testing:** After backend updates, test the complete integration at `https://engentlabs.com` to verify all features work correctly.

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-22  
**Next Review:** After backend implementation


