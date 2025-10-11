# 🚨 URGENT: Backend Lambda CORS Fix Required

## 📋 Problem Summary

The frontend is deployed and working at `https://engentlabs.com`, but **all API requests are being blocked by CORS policy**. The Lambda function is not configured to allow requests from this origin.

## ❌ Current Error (Browser Console)

```
Access to fetch at 'https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/api/course/decision' 
from origin 'https://engentlabs.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🎯 Required Fix

The Lambda function **`ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws`** needs to be updated to:

1. **Allow CORS from both domains:**
   - `https://engentlabs.com` (primary - current deployment)
   - `https://www.engentlabs.com` (www variant)

2. **Handle OPTIONS preflight requests** for all endpoints

3. **Return proper CORS headers** in all responses

---

## 🔧 Technical Implementation Required

### Backend Lambda Function Details
- **Function Name**: `engent-v1666-img` (or equivalent)
- **Current URL**: `https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws`
- **Region**: `us-east-2`

### Required CORS Headers in ALL Responses

```
Access-Control-Allow-Origin: https://engentlabs.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

**Important**: The `Access-Control-Allow-Origin` header should dynamically match the request's `Origin` header if it's either `https://engentlabs.com` or `https://www.engentlabs.com`.

### Implementation Approach (Choose One)

#### **Option 1: Lambda Function URL CORS Configuration (Easiest)**

Update the Lambda Function URL configuration via AWS Console or CLI:

```bash
aws lambda update-function-url-config \
  --function-name engent-v1666-img \
  --region us-east-2 \
  --cors '{
    "AllowOrigins": ["https://engentlabs.com", "https://www.engentlabs.com"],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "MaxAge": 86400,
    "AllowCredentials": false
  }'
```

#### **Option 2: Application-Level CORS (In Lambda Code)**

If using Flask/Python:

```python
from flask import Flask, request, jsonify, make_response

app = Flask(__name__)

def add_cors_headers(response, origin=None):
    """Add CORS headers with dual origin support"""
    # Get origin from request
    request_origin = origin or request.headers.get('Origin')
    
    # Allow both www and non-www variants
    allowed_origins = [
        'https://engentlabs.com',
        'https://www.engentlabs.com'
    ]
    
    if request_origin in allowed_origins:
        response.headers['Access-Control-Allow-Origin'] = request_origin
    else:
        # Default to primary origin
        response.headers['Access-Control-Allow-Origin'] = 'https://engentlabs.com'
    
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response

# Handle OPTIONS preflight for all routes
@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/health', methods=['OPTIONS'])
@app.route('/query', methods=['OPTIONS'])
@app.route('/api/course/<courseId>', methods=['OPTIONS'])
def handle_options(path=None, courseId=None):
    """Handle OPTIONS preflight requests"""
    response = make_response()
    return add_cors_headers(response)

# Update all existing endpoints to include CORS headers
@app.route('/health', methods=['GET'])
def health():
    response = jsonify({
        "status": "healthy",
        "version": "V1.6.6.6",
        "engine_ready": True
    })
    return add_cors_headers(response)

@app.route('/query', methods=['POST'])
def query():
    # ... existing query logic ...
    response = jsonify({
        "status": "success",
        "data": {
            # ... query response data ...
        }
    })
    return add_cors_headers(response)

@app.route('/api/course/<courseId>', methods=['GET'])
def course_config(courseId):
    # ... existing course config logic ...
    response = jsonify({
        "success": True,
        "data": {
            # ... course config data ...
        }
    })
    return add_cors_headers(response)
```

**Important**: If using Flask-CORS library, ensure it's configured correctly:

```python
from flask_cors import CORS

# Remove or update existing CORS configuration
CORS(app, 
     origins=["https://engentlabs.com", "https://www.engentlabs.com"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"],
     max_age=86400)
```

---

## 🧪 Testing After Fix

### Test 1: Health Endpoint from engentlabs.com
```bash
curl -X GET https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/health \
  -H "Origin: https://engentlabs.com" \
  -v
```

**Expected**: Response should include `Access-Control-Allow-Origin: https://engentlabs.com`

### Test 2: OPTIONS Preflight
```bash
curl -X OPTIONS https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/health \
  -H "Origin: https://engentlabs.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected**: 
- Status: 200 OK
- Headers should include:
  - `Access-Control-Allow-Origin: https://engentlabs.com`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`

### Test 3: Course Config Endpoint
```bash
curl -X GET https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/api/course/decision \
  -H "Origin: https://engentlabs.com" \
  -v
```

**Expected**: Response should include `Access-Control-Allow-Origin: https://engentlabs.com`

### Test 4: Query Endpoint
```bash
curl -X POST https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws/query \
  -H "Origin: https://engentlabs.com" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","course_id":"decision","user_id":"default"}' \
  -v
```

**Expected**: Response should include `Access-Control-Allow-Origin: https://engentlabs.com`

---

## ✅ Verification Checklist

After implementing the fix, verify:

- [ ] Browser console shows NO CORS errors
- [ ] Health check succeeds: `https://engentlabs.com/labs` loads without errors
- [ ] Course configuration loads successfully
- [ ] Query submission works from the UI
- [ ] All endpoints return proper CORS headers
- [ ] Both `https://engentlabs.com` AND `https://www.engentlabs.com` work

---

## 📞 Current Status

- **Frontend**: ✅ Deployed and ready at `https://engentlabs.com/labs`
- **Backend**: ❌ Blocking all requests due to missing CORS configuration
- **Impact**: 🚨 **CRITICAL** - Application is completely non-functional
- **Priority**: 🔴 **HIGHEST** - Blocking production use

---

## 📊 Affected Endpoints

All of these endpoints need CORS headers:

1. `GET /health` - Health check
2. `GET /api/course/{courseId}` - Course configuration
3. `POST /query` - Query processing
4. `OPTIONS /*` - Preflight requests (all routes)

---

## 💡 Quick Reference

**Current Lambda URL**: `https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws`

**Origins to Allow**:
- `https://engentlabs.com` ← **Primary (current deployment)**
- `https://www.engentlabs.com` ← **Secondary (www redirect)**

**Required Methods**: `GET, POST, OPTIONS`

**Required Headers**: `Content-Type, Authorization`

---

## 📝 Additional Notes

1. **No Frontend Changes Needed**: The frontend is correctly configured and working. This is purely a backend CORS configuration issue.

2. **Testing Locally**: If testing locally at `http://localhost:5173`, you may want to temporarily add it to allowed origins for development purposes.

3. **Security**: The CORS configuration should ONLY allow the specific origins listed above, not use wildcards (`*`).

4. **Deployment**: After updating the Lambda function, no deployment is needed on the frontend side.

---

**Document Created**: October 10, 2025  
**Status**: Awaiting Backend Fix  
**Next Action**: Backend team to implement CORS fix and test


