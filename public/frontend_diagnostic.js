// GPTTutor Frontend Diagnostic & Recovery Script
// Updated to work with unified API client and V1.6.6.6 backend format

(function() {
    'use strict';
    
    console.log('🔍 GPTTutor Frontend Diagnostic Starting...');
    
    // Helper function to unwrap API envelope
    async function getJSON(url, opts) {
        const res = await fetch(url, opts);
        const body = await res.json().catch(() => ({}));
        // Return full response for proper status checking
        return body;
    }
    
    // Diagnostic results
    const diagnostics = {
        jsLoaded: false,
        apiUrl: null,
        backendReachable: false,
        backendHealthy: false,
        followUpContainerExists: false,
        clickHandlersAttached: false,
        issues: []
    };
    
    // Test 1: Check if main JavaScript is loaded
    function checkJavaScriptLoading() {
        console.log('📋 Test 1: Checking JavaScript loading...');
        
        // Check if unified API client exists
        if (typeof window.engentLabsApi === 'undefined') {
            diagnostics.issues.push('Unified API client not found');
            console.error('❌ Unified API client not found');
        } else {
            diagnostics.jsLoaded = true;
            console.log('✅ Unified API client found');
        }
        
        // Check API URL
        if (typeof window.getApiBaseUrl === 'function') {
            try {
                diagnostics.apiUrl = window.getApiBaseUrl();
                console.log('🔗 API URL:', diagnostics.apiUrl);
            } catch (e) {
                diagnostics.issues.push('getApiBaseUrl function error: ' + e.message);
            }
        } else {
            diagnostics.issues.push('getApiBaseUrl function not found');
        }
    }
    
    // Test 2: Check backend connectivity - FIXED for V1.6.6.6 format
    async function checkBackendConnectivity() {
        console.log('📋 Test 2: Checking backend connectivity...');
        
        if (!diagnostics.apiUrl || diagnostics.apiUrl.trim() === '') {
            diagnostics.issues.push('No API URL available - VITE_API_URL not set');
            console.error('❌ No API URL available');
            return;
        }
        
        try {
            // Use the unified API client if available
            if (window.engentLabsApi) {
                try {
                    const response = await window.engentLabsApi.health();
                    console.log('🔍 Raw health response:', response);
                    
                    // Check for V1.6.6.6 format: { status: "success", data: { status: "healthy" } }
                    if (response && response.status === 'success' && response.data && response.data.status === 'healthy') {
                        diagnostics.backendReachable = true;
                        diagnostics.backendHealthy = true;
                        console.log('✅ Backend is reachable and healthy (V1.6.6.6 format):', response);
                    } else if (response && (response.status === 'healthy' || response.engine_ready)) {
                        // Legacy format fallback
                        diagnostics.backendReachable = true;
                        diagnostics.backendHealthy = true;
                        console.log('✅ Backend is reachable and healthy (legacy format):', response);
                    } else {
                        diagnostics.issues.push(`Backend health check failed - unexpected response format: ${JSON.stringify(response)}`);
                        console.warn('⚠️ Backend health check failed - unexpected response format:', response);
                    }
                } catch (apiError) {
                    console.error('❌ Unified API health check failed:', apiError);
                    diagnostics.issues.push(`Unified API health check error: ${apiError.message}`);
                }
            } else {
                // Fallback to direct fetch
                const response = await getJSON(`${diagnostics.apiUrl}/health`);
                console.log('🔍 Direct health response:', response);
                
                // Check for V1.6.6.6 format: { status: "success", data: { status: "healthy" } }
                if (response && response.status === 'success' && response.data && response.data.status === 'healthy') {
                    diagnostics.backendReachable = true;
                    diagnostics.backendHealthy = true;
                    console.log('✅ Backend is reachable and healthy (V1.6.6.6 format):', response);
                } else if (response && (response.status === 'healthy' || response.engine_ready)) {
                    // Legacy format fallback
                    diagnostics.backendReachable = true;
                    diagnostics.backendHealthy = true;
                    console.log('✅ Backend is reachable and healthy (legacy format):', response);
                } else {
                    diagnostics.issues.push(`Backend health check failed - unexpected response format: ${JSON.stringify(response)}`);
                    console.warn('⚠️ Backend health check failed - unexpected response format:', response);
                }
            }
        } catch (error) {
            diagnostics.issues.push(`Backend connection error: ${error.message}`);
            console.error('❌ Backend connection failed:', error);
        }
    }
    
    // Test 3: Check DOM elements - UPDATED for React components with data-testid
    function checkDOMElements() {
        console.log('📋 Test 3: Checking DOM elements...');
        
        // Updated selectors to match React components with data-testid
        const elementChecks = [
            {
                name: 'Query Input',
                selector: 'textarea[placeholder*="decision-making question"]',
                required: true
            },
            {
                name: 'Strategic Thinking Lens Section',
                selector: '[data-testid="strategic-thinking-lens"]',
                required: true
            },
            {
                name: 'Follow-up Prompts Section',
                selector: '[data-testid="followup-prompts"]',
                required: true
            },
            {
                name: 'Concepts Section',
                selector: '[data-testid="concepts-section"]',
                required: true
            }
        ];
        
        const missingElements = [];
        
        elementChecks.forEach(check => {
            let found = false;
            
            // Try exact selector match
            const element = document.querySelector(check.selector);
            if (element) {
                found = true;
            }
            
            if (!found && check.required) {
                missingElements.push(check.name);
            }
        });
        
        if (missingElements.length > 0) {
            diagnostics.issues.push(`Missing DOM elements: ${missingElements.join(', ')}`);
            console.error('❌ Missing DOM elements:', missingElements);
        } else {
            diagnostics.followUpContainerExists = true;
            console.log('✅ All required DOM elements found');
        }
    }
    
    // Test 4: Check click handlers
    function checkClickHandlers() {
        console.log('📋 Test 4: Checking click handlers...');
        
        // Look for follow-up prompts in React components
        const followUpSection = document.querySelector('[data-testid="followup-prompts"]');
        if (followUpSection) {
            const clickableElements = followUpSection.querySelectorAll('li, button, .cursor-pointer');
            if (clickableElements.length > 0) {
                const hasClickHandlers = Array.from(clickableElements).some(el => 
                    el.onclick || el.getAttribute('onclick') || el.classList.contains('cursor-pointer')
                );
                
                if (hasClickHandlers) {
                    diagnostics.clickHandlersAttached = true;
                    console.log('✅ Click handlers found on follow-up elements');
                } else {
                    diagnostics.issues.push('No click handlers on follow-up elements');
                    console.warn('⚠️ No click handlers found on follow-up elements');
                }
            } else {
                console.log('ℹ️ No follow-up elements found (normal if no prompts displayed)');
            }
        } else {
            console.log('ℹ️ Follow-up section not found (normal if no answer displayed)');
        }
    }
    
    // Normalize followUpPrompts - COLD PATCH for response parsing
    function normalizePrompts(prompts) {
        if (!prompts) return [];
        if (Array.isArray(prompts)) return prompts;
        // Handle string case: split into numbered prompts
        return prompts
            .split(/\n?\d+\.\s+/)   // split by "1. ..." patterns
            .map(s => s.trim())
            .filter(Boolean);
    }
    
    // Normalize concepts - COLD PATCH for response parsing
    function normalizeConcepts(concepts) {
        if (!Array.isArray(concepts)) return [];
        return concepts.map(c => {
            if (typeof c === "string") {
                return { term: "", definition: c };
            }
            if (!c.term) {
                return { term: "", definition: c.definition || "" };
            }
            return c;
        });
    }
    
    // Emergency fix for clickable prompts - ADDED BACKEND HEALTH GUARD
    function applyEmergencyFix() {
        console.log('🚨 Applying emergency fix for clickable prompts...');
        
        // GUARD: Only apply emergency fix if backend is truly unavailable
        if (diagnostics.backendHealthy) {
            console.log('✅ Backend healthy — skipping emergency fix to preserve backend answers');
            return;
        }
        
        console.log('⚠️ Backend unavailable — applying emergency fix with degraded responses');
        
        // Override displayFollowUpPrompts if it doesn't exist or is broken
        if (typeof window.displayFollowUpPrompts === 'undefined' || diagnostics.issues.length > 0) {
            window.displayFollowUpPrompts = function(prompts) {
                console.log('🔧 Using emergency displayFollowUpPrompts');
                
                // Look for React components instead of old IDs
                const container = document.querySelector('[data-testid="followup-prompts"]');
                const followUpContainer = document.querySelector('[data-testid="followup-prompts"]');
                
                if (!container) {
                    console.error('❌ Follow-up prompts container not found');
                    return;
                }
                
                if (!prompts || prompts.length === 0) {
                    console.log('ℹ️ No follow-up prompts to display');
                    if (followUpContainer) followUpContainer.classList.add('hidden');
                    return;
                }
                
                const promptsHtml = prompts.map((prompt, index) => {
                    const cleanPrompt = prompt.replace(/^[-•*○\s]+/, '').trim();
                    return `
                        <button 
                            class="follow-up-prompt bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-left transition-all duration-200 cursor-pointer group"
                            onclick="window.handleFollowUpClick('${cleanPrompt.replace(/'/g, "\\'")}')"
                        >
                            <div class="flex items-start space-x-3">
                                <div class="flex-shrink-0 w-6 h-6 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mt-0.5">
                                    <span class="text-blue-600 text-sm font-medium">${index + 1}</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-gray-700 group-hover:text-blue-700 font-medium">${cleanPrompt}</p>
                                    <p class="text-gray-500 text-sm mt-1">Click to ask this follow-up question</p>
                                </div>
                                <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                    </svg>
                                </div>
                            </div>
                        </button>
                    `;
                }).join('');
                
                container.innerHTML = promptsHtml;
                if (followUpContainer) followUpContainer.classList.remove('hidden');
                
                console.log('✅ Emergency follow-up prompts displayed');
            };
        }
        
        // Override handleFollowUpClick if it doesn't exist
        if (typeof window.handleFollowUpClick === 'undefined') {
            window.handleFollowUpClick = function(prompt) {
                console.log('🖱️ Emergency handleFollowUpClick called with:', prompt);
                
                // Look for React components instead of old IDs
                const queryInput = document.querySelector('textarea[placeholder*="decision-making question"]');
                const form = document.querySelector('form');
                
                if (queryInput && form) {
                    queryInput.value = prompt;
                    
                    // Auto-resize textarea if function exists
                    if (typeof window.autoResizeTextarea === 'function') {
                        window.autoResizeTextarea(queryInput);
                    }
                    
                    // Submit the form
                    if (typeof window.submitQuery === 'function') {
                        window.submitQuery();
                    } else {
                        form.dispatchEvent(new Event('submit'));
                    }
                    
                    console.log('✅ Follow-up prompt submitted');
                } else {
                    console.error('❌ Required elements not found for follow-up submission');
                }
            };
        }
        
        console.log('✅ Emergency fix applied');
    }
    
    // Run diagnostics
    async function runDiagnostics() {
        console.log('🔍 Running GPTTutor Frontend Diagnostics...');
        
        checkJavaScriptLoading();
        await checkBackendConnectivity();
        checkDOMElements();
        checkClickHandlers();
        
        // Apply emergency fix ONLY if backend is unavailable
        if (diagnostics.issues.length > 0 && !diagnostics.backendHealthy) {
            console.log('⚠️ Issues detected and backend unavailable, applying emergency fix...');
            applyEmergencyFix();
        } else if (diagnostics.backendHealthy) {
            console.log('✅ Backend healthy — preserving backend answers, no emergency fix needed');
        }
        
        // Display results
        console.log('📊 Diagnostic Results:', diagnostics);
        
        if (diagnostics.issues.length === 0) {
            console.log('✅ All diagnostics passed!');
        } else {
            console.log('❌ Issues found:', diagnostics.issues);
        }
        
        return diagnostics;
    }
    
    // Auto-run diagnostics when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runDiagnostics);
    } else {
        runDiagnostics();
    }
    
    // Make diagnostics available globally
    window.gptTutorDiagnostics = {
        run: runDiagnostics,
        results: diagnostics,
        applyEmergencyFix: applyEmergencyFix,
        normalizePrompts: normalizePrompts,
        normalizeConcepts: normalizeConcepts
    };
    
    console.log('🔍 GPTTutor Frontend Diagnostic Ready');
    console.log('💡 Run window.gptTutorDiagnostics.run() to re-run diagnostics');
    
})();
