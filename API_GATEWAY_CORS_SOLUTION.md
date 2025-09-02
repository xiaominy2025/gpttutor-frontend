# 🚀 Engent Labs CORS Solution - Phased Approach

## 📋 **Mission**
Solve CORS issues blocking frontend with a phased approach: **Phase 1** (immediate Lambda CORS fix) followed by **Phase 3** (optional API Gateway upgrade).

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

### **Technical Implementation**
```python
# Remove Flask-CORS completely
# CORS(app, ...) - REMOVE THIS

# Add centralized CORS function
def add_cors_headers(response, origin=None):
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

# Add OPTIONS handler for preflight
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = make_response()
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)

# Modify existing endpoints to add CORS headers
@app.route('/health', methods=['GET'])
def health():
    response = jsonify({"status": "healthy", "version": "V1.6.6.6", "engine_ready": True})
    origin = request.headers.get('Origin')
    return add_cors_headers(response, origin)
```

### **Frontend Impact**
- **No changes needed** - current integration works
- **Same API URL** - `https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws`
- **Dual origin support** - covers both www and non-www variants
- **Immediate unblocking** - CORS errors resolved

---

## 📱 **Phase 2: Frontend Validation**

### **Frontend Team Responsibilities**
- **No code changes required**
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
1. **Create HTTP API** in us-east-2
2. **Configure Lambda integration** (`engent-v1666-img`)
3. **Set up CORS** with dual origins
4. **Create custom domain** with ACM certificate
5. **Update frontend**: `VITE_API_URL=https://api.engentlabs.com`

### **Frontend Changes for Phase 3**
```bash
# Only environment variable change needed
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
