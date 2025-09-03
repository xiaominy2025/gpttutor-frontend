// Single, unified API client for Engent Labs Frontend
// Aligned with FRONTEND_INTEGRATION_README.md and FRONTEND_DEPLOYMENT_GUIDE.md
// ENFORCED: Always uses Lambda Function URL for production stability

const BASE_URL = (import.meta.env.VITE_API_URL || '').trim();

// One-time startup log and safety checks
(() => {
  if (!BASE_URL) {
    console.error('❌ VITE_API_URL is not set. Frontend must use Lambda Function URL.');
    return;
  }

  try {
    const apiUrl = new URL(BASE_URL);
    const apiHost = apiUrl.host;
    const frontendHost = window.location.host;
    
    // Verify we're using the Lambda Function URL
    if (!BASE_URL.includes('lambda-url.us-east-2.on.aws')) {
      console.error('❌ CRITICAL: API base URL must use Lambda Function URL for production stability');
      console.error('   Current URL:', BASE_URL);
      console.error('   Expected format: https://<function-id>.lambda-url.us-east-2.on.aws/');
      return;
    }
    
    console.log('✅ API Service initialized – Base URL:', BASE_URL);
    console.log('🔗 API Host:', apiHost);
    console.log('🌐 Frontend Host:', frontendHost);
    console.log('✅ Frontend configured for Lambda Function URL');
    
    // Only warn if the API host exactly matches the frontend host
    if (apiHost === frontendHost) {
      console.warn('⚠️ API base URL matches frontend host; requests will hit the static site. Use the Lambda Function URL.');
    }
  } catch (e) {
    console.error('❌ Invalid VITE_API_URL format:', BASE_URL);
  }
})();

// Generic request function with proper error handling and CORS workaround
async function makeRequest(path, init = {}) {
  if (!BASE_URL) {
    throw new Error('API URL not configured. Set VITE_API_URL environment variable.');
  }

  const url = BASE_URL.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  
  // Check if we're in local development
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  try {
    // For local development, provide helpful guidance
    if (isLocalDev) {
      console.log('🔧 Local development detected - Lambda URL CORS workaround needed');
      console.log('💡 Options to fix CORS:');
      console.log('   1. Install CORS browser extension (e.g., "CORS Unblock")');
      console.log('   2. Use browser with disabled security (--disable-web-security)');
      console.log('   3. Ask backend team to add localhost:5173 to CORS origins');
      
      // Try the request anyway - it might work with browser extensions
      const res = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...init?.headers 
        },
        ...init,
      });

      const contentType = res.headers.get('content-type') || '';
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText.slice(0, 200)}`);
      }

      if (!contentType.includes('application/json')) {
        const body = await res.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${body.slice(0, 200)}`);
      }

      const json = await res.json();
      return json;
    } else {
      // Production environment - use normal request
      const res = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...init?.headers 
        },
        ...init,
      });

      const contentType = res.headers.get('content-type') || '';
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText.slice(0, 200)}`);
      }

      if (!contentType.includes('application/json')) {
        const body = await res.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${body.slice(0, 200)}`);
      }

      const json = await res.json();
      return json;
    }
  } catch (error) {
    // Enhanced error logging for CORS issues
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`❌ CORS/Network Error: ${init?.method || 'GET'} ${url}`);
      console.error('🔧 This is likely a backend CORS configuration issue.');
      if (isLocalDev) {
        console.error('📋 Local development detected - Lambda URL CORS issue');
        console.error('💡 Quick fixes:');
        console.error('   1. Install "CORS Unblock" browser extension');
        console.error('   2. Use Chrome with: --disable-web-security --user-data-dir=/tmp/chrome_dev');
        console.error('   3. Ask backend team to add localhost:5173 to Lambda CORS origins');
        console.error('🔗 Lambda URL CORS fix needed in backend for localhost:5173');
      } else {
        console.error('📋 Backend needs to fix CORS headers for https://www.engentlabs.com');
      }
      throw new Error('CORS Error: Backend needs to configure CORS headers for this domain. Please contact backend team.');
    }
    
    console.error(`❌ API Request failed: ${init?.method || 'GET'} ${url}`, error);
    throw error;
  }
}

// Main API client - aligned with reference guides
export const api = {
  // Health check (required on app start)
  health: async () => {
    try {
      const response = await makeRequest('health');
      if (response.status === 'healthy') {
        console.log('✅ Backend is ready:', response.version);
        return response;
      }
      throw new Error('Backend health check returned non-healthy');
    } catch (err) {
      console.warn('⚠️ Backend health check failed, continuing in degraded mode:', err?.message || err);
      // Graceful fallback so UI is never blocked by missing /health
      return { status: 'healthy', degraded: true };
    }
  },

  // Load course UI configuration (per guides)
  loadCourseUIConfig: async (courseId = 'decision') => {
    try {
      const response = await makeRequest(`api/course/${courseId}`);
      
      // Use backend configuration only - handle both direct response and data wrapper
      const configData = response.data || response;
      
      return {
        title: configData.title,
        mobileTitle: configData.mobile_title,
        tagline: configData.tagline,
        placeholder: configData.placeholder,
        defaultSections: configData.default_sections,
        sectionsTitles: configData.sections_titles,
        tooltipRules: configData.tooltip_rules
      };
    } catch (error) {
      console.error('❌ Backend API failed:', error);
      throw error;
    }
  },

  // Process queries (main functionality) - aligned with guides
  processQuery: async (query, courseId = 'decision', userId = 'default') => {
    const response = await makeRequest('query', {
      method: 'POST',
      body: JSON.stringify({
        query: query,
        course_id: courseId,
        user_id: userId
      })
    });

    console.log("🔍 Full Backend Response:", response);

    if (response.status === 'success') {
      // Use normalization functions for robust parsing
      let processedFollowUpPrompts = [];
      let processedConcepts = [];
      
      if (response.data.followUpPrompts) {
        // Use normalization function from diagnostic script if available
        if (window.gptTutorDiagnostics && window.gptTutorDiagnostics.normalizePrompts) {
          processedFollowUpPrompts = window.gptTutorDiagnostics.normalizePrompts(response.data.followUpPrompts);
        } else {
          // Fallback normalization
          if (Array.isArray(response.data.followUpPrompts)) {
            processedFollowUpPrompts = response.data.followUpPrompts;
          } else if (typeof response.data.followUpPrompts === 'string') {
            processedFollowUpPrompts = response.data.followUpPrompts
              .split(/\n?\d+\.\s+/)
              .map(s => s.trim())
              .filter(Boolean);
          }
        }
      }

      if (response.data.conceptsToolsPractice) {
        // Use normalization function from diagnostic script if available
        if (window.gptTutorDiagnostics && window.gptTutorDiagnostics.normalizeConcepts) {
          processedConcepts = window.gptTutorDiagnostics.normalizeConcepts(response.data.conceptsToolsPractice);
        } else {
          // Fallback normalization
          if (Array.isArray(response.data.conceptsToolsPractice)) {
            processedConcepts = response.data.conceptsToolsPractice.map(concept => {
              if (typeof concept === 'string') {
                const colonIndex = concept.indexOf(':');
                if (colonIndex > 0) {
                  return {
                    term: concept.substring(0, colonIndex).trim(),
                    definition: concept.substring(colonIndex + 1).trim()
                  };
                } else {
                  return { term: concept, definition: '' };
                }
              } else if (concept && typeof concept === 'object') {
                return {
                  term: concept.term || concept.definition || 'Unknown Concept',
                  definition: concept.definition || concept.term || ''
                };
              }
              return concept;
            });
          }
        }
      }

      console.log("✅ Response processed successfully:", {
        hasStrategicLens: !!response.data.strategicThinkingLens,
        followUpCount: processedFollowUpPrompts.length,
        conceptsCount: processedConcepts.length
      });

      return {
        success: true,
        // Preserve full combined answer for history/debug
        answer: response.data.answer,
        // Use processed data with proper fallbacks
        strategicThinkingLens: response.data.strategicThinkingLens || null,
        followUpPrompts: processedFollowUpPrompts,
        conceptsToolsPractice: processedConcepts,
        processingTime: response.data.processing_time,
        model: response.data.model,
        timestamp: response.data.timestamp
      };
    } else if (response.status === 'rejected') {
      return {
        success: false,
        rejected: true,
        message: response.message
      };
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  },

  // Legacy compatibility methods
  courseMeta: async (courseId) => {
    return api.loadCourseUIConfig(courseId);
  },

  query: async (payload) => {
    return api.processQuery(payload.query, payload.course_id, payload.user_id);
  },

  // Raw methods for direct access (if needed)
  getJSON: async (path, init) => {
    return makeRequest(path, init);
  },

  postJSON: async (path, payload) => {
    return makeRequest(path, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// Export for global access (for diagnostics)
if (typeof window !== 'undefined') {
  window.engentLabsApi = api;
  window.getApiBaseUrl = () => BASE_URL;
}
