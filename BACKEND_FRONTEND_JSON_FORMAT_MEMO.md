# 🎯 BACKEND-FRONTEND JSON FORMAT MEMO
## Complete API Contract for 100% Perfect Communication

**Purpose:** This memo provides the exact JSON format specifications that the frontend expects from the backend to ensure flawless communication and UI rendering.

---

## 🌐 **BASE CONFIGURATION**

### **Backend Base URL**
```
https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws
```

### **Required CORS Headers (CRITICAL)**
```python
'Access-Control-Allow-Origin': 'https://engentlabs.com'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
'Content-Type': 'application/json'
```

### **OPTIONS Handler (REQUIRED)**
```python
def handle_options(event):
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

---

## 📡 **API ENDPOINTS & JSON FORMATS**

### **1. Health Check Endpoint**

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
      "timestamp": "2025-01-22T18:30:00Z"
    },
    "status": "success"
  }
}
```

**Frontend Expectation:** The frontend calls this on app startup and expects `data.status === 'healthy'` to proceed.

---

### **2. Query Processing Endpoint (MAIN)**

**Request:** `POST /query`
```json
{
  "query": "How should I prioritize tasks when under tight deadlines?",
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
      "answer": "**Strategic Thinking Lens**\n\nWhen facing tight deadlines, strategic prioritization becomes critical...\n\n**Follow-up Prompts**\n\n1. What criteria do you use to evaluate task urgency versus importance?\n2. How do you communicate priority changes to stakeholders?\n\n**Concepts/Tools**\n\n- Eisenhower Matrix: A framework for categorizing tasks by urgency and importance\n- Time Blocking: A technique for allocating specific time slots to tasks",
      "strategicThinkingLens": "When facing tight deadlines, strategic prioritization becomes critical. The key is to distinguish between urgent tasks that demand immediate attention and important tasks that contribute to long-term goals. Start by categorizing tasks using the Eisenhower Matrix, then apply time-blocking techniques to ensure high-priority items receive dedicated focus. Consider the 80/20 rule: 20% of your efforts typically generate 80% of results. Communicate clearly with stakeholders about realistic timelines and potential trade-offs. Remember that saying 'no' to lower-priority requests is often more strategic than overcommitting and delivering mediocre results across all fronts.",
      "followUpPrompts": [
        "What criteria do you use to evaluate task urgency versus importance?",
        "How do you communicate priority changes to stakeholders?",
        "What tools or systems help you track and manage competing deadlines?",
        "How do you handle unexpected urgent requests that disrupt your planned priorities?"
      ],
      "conceptsToolsPractice": [
        {
          "term": "Eisenhower Matrix",
          "definition": "A framework for categorizing tasks by urgency and importance into four quadrants."
        },
        {
          "term": "Time Blocking",
          "definition": "A technique for allocating specific time slots to tasks to improve focus and productivity."
        },
        {
          "term": "Pareto Principle (80/20 Rule)",
          "definition": "The principle that 80% of results come from 20% of efforts or causes."
        }
      ],
      "query": "How should I prioritize tasks when under tight deadlines?",
      "course_id": "decision",
      "timestamp": "2025-01-22T18:30:00Z",
      "model": "gpt-3.5-turbo",
      "processing_time": 2.3
    },
    "status": "success",
    "version": "V1.6.6.6",
    "timestamp": "2025-01-22T18:30:00Z"
  }
}
```

**CRITICAL FIELD REQUIREMENTS:**

1. **`strategicThinkingLens`** (string, required):
   - Must be 80-150 words for optimal quality
   - Should be a complete, coherent paragraph
   - No markdown formatting needed

2. **`followUpPrompts`** (array of strings, required):
   - Must be an array of strings, not objects
   - Each prompt should be 20+ characters
   - Minimum 2 prompts, optimal 3-4 prompts
   - Should be actionable questions

3. **`conceptsToolsPractice`** (array of objects, required):
   - **MUST be an array of objects, never strings**
   - Each object must have `term` and `definition` properties
   - Minimum 2 concepts, optimal 3-4 concepts
   - No HTML, tooltips, or plain strings allowed

4. **`answer`** (string, required):
   - Contains the full markdown-formatted response
   - Includes all sections: Strategic Thinking Lens, Follow-up Prompts, Concepts/Tools
   - Used for history and debugging

---

### **3. Course Configuration Endpoint**

**Request:** `GET /api/course/{courseId}`

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
      "title": "Strategic Decision Making",
      "mobile_title": "Decision Coach",
      "tagline": "Make better decisions with strategic thinking",
      "placeholder": "How should I approach this business decision?",
      "default_sections": ["strategic", "followup", "concepts"],
      "sections_titles": [
        "Strategic Thinking Lens",
        "Follow-up Prompts", 
        "Concepts & Tools"
      ],
      "tooltip_rules": {
        "enabled": true,
        "max_length": 200
      }
    },
    "status": "success",
    "version": "V1.6.6.6",
    "timestamp": "2025-01-22T18:30:00Z"
  }
}
```

---

### **4. Course Discovery Endpoint**

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
      "courses": ["decision", "marketing", "strategy"],
      "default_course": "decision"
    },
    "status": "success",
    "version": "V1.6.6.6",
    "timestamp": "2025-01-22T18:30:00Z"
  }
}
```

---

## 🚨 **ERROR RESPONSE FORMATS**

### **Query Rejection (Off-topic)**
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "rejected",
    "message": "This question appears to be outside the scope of strategic thinking and business analysis.",
    "version": "V1.6.6.6",
    "timestamp": "2025-01-22T18:30:00Z"
  }
}
```

### **Server Error**
```json
{
  "statusCode": 500,
  "headers": {
    "Access-Control-Allow-Origin": "https://engentlabs.com",
    "Content-Type": "application/json"
  },
  "body": {
    "status": "error",
    "error": "Internal server error occurred while processing your query.",
    "version": "V1.6.6.6",
    "timestamp": "2025-01-22T18:30:00Z"
  }
}
```

---

## ✅ **VALIDATION CHECKLIST**

### **Query Response Validation**
- [ ] `data.strategicThinkingLens` exists and is 80-150 words
- [ ] `data.followUpPrompts` is an array with 2+ strings of 20+ chars each
- [ ] `data.conceptsToolsPractice` is an array of objects with `term` and `definition`
- [ ] `data.answer` contains full markdown response
- [ ] `status` is "success", "rejected", or "error"
- [ ] All required CORS headers are present
- [ ] Response is valid JSON

### **Quality Thresholds (Frontend QA/QC)**
- **Strategic Lens:** 80-150 words = optimal quality
- **Follow-up Prompts:** 2+ actionable questions = minimum, 3-4 = optimal
- **Concepts/Tools:** 2+ relevant concepts = minimum, 3-4 = optimal
- **Overall Quality Score:** 50+ = acceptable, 80+ = high quality

---

## 🔧 **FRONTEND PROCESSING LOGIC**

### **Response Processing Flow**
1. Frontend receives response from `/query` endpoint
2. Validates `status === 'success'`
3. Extracts `strategicThinkingLens`, `followUpPrompts`, `conceptsToolsPractice`
4. Renders each section in dedicated UI components
5. Handles click events on follow-up prompts
6. Displays concepts in "Term: Definition" format

### **Error Handling**
- `status === 'rejected'` → Shows rejection message
- `status === 'error'` → Shows error message
- Network errors → Shows connection error
- Invalid JSON → Shows parsing error

---

## 🎯 **IMPLEMENTATION PRIORITIES**

### **CRITICAL (Must Fix First)**
1. **CORS Headers** - Set to `https://engentlabs.com`
2. **OPTIONS Handler** - Required for preflight requests
3. **Response Structure** - Always wrap in `{data: ..., status: "success"}`

### **HIGH PRIORITY**
1. **Query Response Format** - Exact field structure as specified
2. **conceptsToolsPractice Array** - Must be objects, not strings
3. **Error Response Formats** - Consistent error handling

### **MEDIUM PRIORITY**
1. **Course Configuration** - UI metadata endpoints
2. **Health Check** - App startup validation
3. **Quality Thresholds** - Response content validation

---

## 📋 **TESTING VALIDATION**

### **Test Query**
```json
{
  "query": "How should I prioritize tasks when under tight deadlines?",
  "course_id": "decision",
  "user_id": "default"
}
```

### **Expected Response Validation**
- Response time: < 30 seconds
- Quality score: > 50/100
- All required fields present
- Valid JSON structure
- Proper CORS headers

---

**This memo ensures 100% compatibility between backend and frontend. Any deviation from these specifications will cause UI rendering failures or communication errors.**

