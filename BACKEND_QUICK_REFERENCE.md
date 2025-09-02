# 🚨 CRITICAL BACKEND FIXES - QUICK REFERENCE

## 🔴 IMMEDIATE ACTION REQUIRED

### **1. FIX CORS HEADERS (BLOCKING ALL REQUESTS)**
```python
# REPLACE THIS:
'Access-Control-Allow-Origin': '*'

# WITH THIS:
'Access-Control-Allow-Origin': 'https://engentlabs.com'
```

### **2. ADD OPTIONS HANDLER**
```python
def lambda_handler(event, context):
    # Handle OPTIONS preflight
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': 'https://engentlabs.com',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': ''
        }
    
    # Your existing logic here...
```

### **3. STANDARDIZE ALL RESPONSES**
```python
def create_response(data, status="success"):
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': 'https://engentlabs.com',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'data': data,
            'status': status,
            'version': 'V1.6.6.6'
        })
    }
```

## 📍 **ENDPOINTS TO UPDATE**

1. **`/health`** - Return `{"data": {"status": "healthy"}}`
2. **`/query`** - Return `{"data": {"answer": "...", "strategicThinkingLens": [...]}}`
3. **`/courses`** - Return `{"data": {"courses": ["decision", "marketing", "strategy"]}}`
4. **`/api/course/{courseId}`** - Return course metadata

## 🎯 **FRONTEND EXPECTATIONS**

- **API URL:** `https://uvfr5y7mwffusf4c2avkbpc3240hacyi.lambda-url.us-east-2.on.aws`
- **Production Domain:** `https://engentlabs.com`
- **Response Format:** Always wrap data in `{"data": ..., "status": "success"}`

## ⚡ **PRIORITY ORDER**

1. **Fix CORS** (blocks everything)
2. **Add OPTIONS handler** (required for preflight)
3. **Standardize responses** (frontend expects consistent format)
4. **Add missing sections** (strategicThinkingLens)

**Status:** Frontend is deployed and ready - backend CORS is blocking all functionality.


