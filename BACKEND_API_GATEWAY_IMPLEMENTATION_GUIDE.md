# 🚀 Backend Implementation Guide - Phased CORS Solution

## 📋 **Mission**
Implement a phased approach to solve CORS issues: **Phase 1** (immediate Lambda CORS fix) followed by **Phase 3** (optional API Gateway implementation).

## 🎯 **Phased Strategy**

### **Phase 1: Lambda CORS Fix (IMMEDIATE - Highest Priority)**
- **Goal**: Unblock frontend immediately with minimal risk
- **Approach**: Fix CORS headers in Lambda function
- **Timeline**: 30-45 minutes
- **Risk**: Low

### **Phase 2: Frontend Validation (After Phase 1)**
- **Goal**: Validate CORS fix works in browser
- **Approach**: Test frontend integration (no code changes needed)
- **Timeline**: 15 minutes
- **Risk**: None

### **Phase 3: API Gateway (Later This Week - Nice to Have)**
- **Goal**: Professional API with custom domain
- **Approach**: HTTP API + custom domain
- **Timeline**: 1-2 hours
- **Risk**: Medium

---

## 🔧 **Phase 1: Lambda CORS Fix Implementation**

### **Current Problem**
Lambda has conflicting CORS configuration that causes browser blocking.

### **Solution**
1. **Remove Flask-CORS** from Lambda
2. **Add centralized CORS headers** with dual origin support
3. **Handle OPTIONS preflight requests** explicitly
4. **Support both domains**: `https://www.engentlabs.com` and `https://engentlabs.com`

### **Step-by-Step Implementation**

#### **Step 1: Remove Flask-CORS**
```python
# REMOVE this line from lambda_function.py:
# CORS(app, 
#      origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", 
#               "https://engentlabs.com", "https://www.engentlabs.com"],
#      allow_headers=["Content-Type", "Authorization", "Origin"],
#      methods=["GET", "POST", "OPTIONS"],
#      max_age=3600)
```

#### **Step 2: Add Centralized CORS Function**
```python
def add_cors_headers(response, origin=None):
    """
    Add CORS headers with dual origin support
    """
    # Handle dual origins: www.engentlabs.com and engentlabs.com
    if origin in ['https://www.engentlabs.com', 'https://engentlabs.com']:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        # Default to primary origin
        response.headers['Access-Control-Allow-Origin'] = 'https://www.engentlabs.com'
    
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response
```

#### **Step 3: Add OPTIONS Handler for Preflight**
```python
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """
    Handle OPTIONS preflight requests for all endpoints
    """
    response = make_response()
    # Get origin from request headers for dynamic CORS response
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)
```

#### **Step 4: Update Existing Endpoints**
```python
@app.route('/health', methods=['GET'])
def health():
    response = jsonify({
        "status": "healthy", 
        "version": "V1.6.6.6", 
        "engine_ready": True
    })
    # Get origin from request headers for dynamic CORS response
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)

@app.route('/query', methods=['POST'])
def query():
    # ... existing query logic ...
    response = jsonify({
        "status": "success",
        "data": {
            "answer": answer,
            "conceptsToolsPractice": concepts,
            "model": "gpt-3.5-turbo",
            "processing_time": processing_time,
            "timestamp": timestamp
        }
    })
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)

@app.route('/courses/<courseId>/config', methods=['GET'])
def course_config(courseId):
    # ... existing course config logic ...
    response = jsonify({
        "success": True,
        "data": config_data
    })
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)
```

### **Step 5: Rebuild and Deploy**
1. **Update Lambda code** with CORS fix
2. **Rebuild Docker container** with updated code
3. **Deploy to ECR** and update Lambda function
4. **Test CORS headers** are present

### **Step 6: Test CORS Fix**

#### **Test 1: Health Endpoint**
```bash
curl -s https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/health
```
**Expected**: JSON response with CORS headers

#### **Test 2: CORS Preflight**
```bash
curl -X OPTIONS https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/query \
  -H "Origin: https://www.engentlabs.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```
**Expected**: 200 OK with proper CORS headers

#### **Test 3: Browser Simulation**
```bash
curl -X POST https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws/query \
  -H "Origin: https://www.engentlabs.com" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","course_id":"decision"}' \
  -v
```
**Expected**: 200 OK with `Access-Control-Allow-Origin: https://www.engentlabs.com`

---

## 📱 **Phase 2: Frontend Validation**

### **Frontend Team Responsibilities**
- **No code changes required** - current integration works
- **Test browser requests** from both `https://www.engentlabs.com` and `https://engentlabs.com`
- **Verify no CORS errors** in browser console
- **Test all functionality**: queries, course config, follow-up prompts

### **Validation Checklist**
- [ ] Browser console: No CORS errors
- [ ] Query submission: Works from both domains
- [ ] Course config: Loads from `/courses/decision/config`
- [ ] All UI functionality: Follow-up prompts, etc.

---

## 🚀 **Phase 3: API Gateway (Future - Nice to Have)**

### **Benefits**
- Clean custom domain (`api.engentlabs.com`)
- Built-in monitoring and scaling
- Professional API appearance
- Enhanced security features

### **Implementation (When Ready)**

#### **Step 1: Create HTTP API**
1. **Go to API Gateway Console** → Create API → HTTP API
2. **Region**: us-east-2
3. **Auto-deploy**: Enabled
4. **Stage**: $default (no stage prefixes)

#### **Step 2: Configure Routes**
```json
{
  "Routes": [
    {
      "Method": "GET",
      "Path": "/health",
      "Integration": "Lambda (engent-v1666-img)"
    },
    {
      "Method": "POST", 
      "Path": "/query",
      "Integration": "Lambda (engent-v1666-img)"
    },
    {
      "Method": "GET",
      "Path": "/courses/{courseId}/config",
      "Integration": "Lambda (engent-v1666-img)"
    }
  ]
}
```

#### **Step 3: Configure CORS**
```json
{
  "AllowOrigins": [
    "https://www.engentlabs.com",
    "https://engentlabs.com"
  ],
  "AllowMethods": ["GET", "POST", "OPTIONS"],
  "AllowHeaders": ["Content-Type", "Authorization"],
  "MaxAge": 86400
}
```

#### **Step 4: Create Custom Domain**
1. **Request ACM Certificate** in us-east-2 for `api.engentlabs.com`
2. **Add DNS validation** record
3. **Create custom domain** in API Gateway
4. **Map base path** `/` → HTTP API (no stage prefix)

#### **Step 5: Update DNS**
- **Add CNAME record**: `api.engentlabs.com` → API Gateway domain target

#### **Step 6: Update Frontend**
```bash
# Update environment variable
VITE_API_URL=https://api.engentlabs.com
```

---

## ✅ **Success Criteria**

### **Phase 1 Success**
- [ ] Lambda returns proper CORS headers for both origins
- [ ] OPTIONS preflight requests work
- [ ] Browser requests from both domains succeed
- [ ] No CORS errors in browser console

### **Phase 2 Success**
- [ ] Frontend loads without CORS errors from both domains
- [ ] Course selection works
- [ ] Query submission works
- [ ] Follow-up prompts work

### **Phase 3 Success (Future)**
- [ ] Custom domain works (`api.engentlabs.com`)
- [ ] All functionality preserved
- [ ] Professional API appearance

---

## ⏱️ **Timeline**

### **Phase 1: Backend Fix**
- **Time**: 30-45 minutes
- **Risk**: Low
- **Impact**: Immediate frontend unblocking

### **Phase 2: Frontend Validation**
- **Time**: 15 minutes
- **Risk**: None
- **Impact**: Confirmation of CORS fix

### **Phase 3: API Gateway (Future)**
- **Time**: 1-2 hours
- **Risk**: Medium
- **Impact**: Production polish

**Total Phase 1+2**: ~1 hour  
**Phase 3**: Later this week (optional)

---

## 🎯 **Key Benefits**

### **Immediate Impact**
✅ Frontend unblocked in hours, not days  
✅ Minimal risk with small Lambda patch  
✅ No frontend changes needed initially  
✅ Complete domain coverage for both www and non-www variants

### **Future Flexibility**
✅ Optional API Gateway for production polish  
✅ Clean custom domain when ready  
✅ Professional API appearance later

---

## 🚀 **Recommendation**

**Proceed with Phase 1 immediately!** This approach:
✅ Unblocks frontend in hours, not days  
✅ Minimal risk with small Lambda patch  
✅ Immediate validation of CORS fix  
✅ Flexible timeline for API Gateway later  
✅ Complete domain coverage for both www and non-www variants

**Ready to execute Phase 1!** 🎯
