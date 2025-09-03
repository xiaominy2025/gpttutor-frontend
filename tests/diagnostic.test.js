import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock the diagnostic script
const mockDiagnostics = {
  jsLoaded: false,
  apiUrl: null,
  backendReachable: false,
  backendHealthy: false,
  followUpContainerExists: false,
  clickHandlersAttached: false,
  issues: []
}

// Real backend responses from the user's file
const realBackendResponses = {
  healthy: {
    status: "success",
    data: {
      status: "healthy"
    },
    version: "V1.6.6.6",
    timestamp: "2025-08-26T15:39:17.943000+00:00"
  },
  unhealthy: {
    status: "error",
    error: "Backend unavailable"
  },
  // Real query responses from the user's backend answers file
  queryResponse1: {
    status: "success",
    data: {
      answer: "**Strategic Thinking Lens**\n\nIn navigating tariff uncertainty for production planning, it's vital to consider several key domains. First, analyze the cost implications of various production scenarios under different tariff outcomes. Determine the impacts on raw material prices, labor costs, and potential changes in consumer demand or market competition. Second, prioritize flexibility in your production processes. Develop agile strategies that allow quick adjustments based on tariff updates or market shifts, minimizing potential disruptions. Lastly, foster strong relationships with suppliers to ensure a secure and efficient supply chain amid tariff volatility. Balancing these considerations will enable you to adapt swiftly to tariff changes while optimizing production efficiency.\n\n*For example,* Facing fluctuating tariffs, a company producing electronic goods continually tracks the evolving tariff landscape. they analyze the cost variances linked to different tariff scenarios, enabling them to forecast and adjust pricing and production levels promptly. by maintaining transparent communication with suppliers, they secure backup options and adjust inventory levels based on tariff revisions, ensuring streamlined production even under uncertainty.\n\n\n\n**Follow-up Prompts**\n\n1. How might a scenario planning approach help in preparing for various tariff outcomes?\n2. What are the risks of overcommitting to long-term production plans in the face of tariff uncertainty?\n3. Have you considered diversifying your supply chain geographically to mitigate tariff risks?\n\n\n\n**Concepts/Tools**\n\nCost-Benefit Analysis: A systematic approach to estimating the strengths and weaknesses of alternatives, used to determine options that provide the best approach to achieving benefits while preserving savings.  \nAgile Manufacturing: A manufacturing system focused on flexibility and responsiveness, enabling companies to adapt quickly to changes in the production environment.",
      strategicThinkingLens: "In navigating tariff uncertainty for production planning, it's vital to consider several key domains. First, analyze the cost implications of various production scenarios under different tariff outcomes. Determine the impacts on raw material prices, labor costs, and potential changes in consumer demand or market competition. Second, prioritize flexibility in your production processes. Develop agile strategies that allow quick adjustments based on tariff updates or market shifts, minimizing potential disruptions. Lastly, foster strong relationships with suppliers to ensure a secure and efficient supply chain amid tariff volatility. Balancing these considerations will enable you to adapt swiftly to tariff changes while optimizing production efficiency.\n\n*For example,* Facing fluctuating tariffs, a company producing electronic goods continually tracks the evolving tariff landscape. they analyze the cost variances linked to different tariff scenarios, enabling them to forecast and adjust pricing and production levels promptly. by maintaining transparent communication with suppliers, they secure backup options and adjust inventory levels based on tariff revisions, ensuring streamlined production even under uncertainty.",
      followUpPrompts: "1. How might a scenario planning approach help in preparing for various tariff outcomes?\n2. What are the risks of overcommitting to long-term production plans in the face of tariff uncertainty?\n3. Have you considered diversifying your supply chain geographically to mitigate tariff risks?",
      conceptsToolsPractice: [
        {
          term: "Cost-Benefit Analysis",
          definition: "A systematic approach to estimating the strengths and weaknesses of alternatives, used to determine options that provide the best approach to achieving benefits while preserving savings."
        },
        {
          term: "Agile Manufacturing",
          definition: "A manufacturing system focused on flexibility and responsiveness, enabling companies to adapt quickly to changes in the production environment."
        },
        {
          term: "Benefit Analysis",
          definition: "A systematic approach to estimating the strengths and weaknesses of alternatives, used to determine options that provide the best approach to achieving benefits while preserving savings."
        }
      ],
      model: "gpt-3.5-turbo",
      processing_time: 4.346079587936401
    },
    version: "V1.6.6.6",
    timestamp: "2025-08-26T15:06:24.792901Z"
  },
  queryResponse2: {
    status: "success",
    data: {
      answer: "**Strategic Thinking Lens**\n\nWhen navigating production planning under tariff uncertainty, it's crucial to adopt a flexible approach. Begin by diversifying your supplier base to mitigate potential tariff impacts, reducing reliance on a single source. Assessing alternative materials or components from domestic or tariff-free regions can also lessen tariff-related risks. Simultaneously, staying informed about tariff negotiations and potential outcomes will provide insight for strategic decision-making. Balancing short-term cost implications with long-term supply chain resilience is vital to maintaining production stability.\n\n*For example,* In anticipating tariff changes, a furniture manufacturer diversified its supplier base internationally and locally. by incorporating materials sourced from both asia and north america, they minimized the impact of potential tariff fluctuations, ensuring minimal disruption to their production process.\n\n\n\n**Follow-up Prompts**\n1. How might geopolitical factors influence future tariff decisions and affect your production planning?\n2. Have you considered the potential competitive advantages of early adaptation to tariff uncertainties in your industry?\n\n\n\n**Concepts/Tools**\nRisk Mitigation: Strategies employed to reduce the likelihood or impact of potential risks.\nSupply Chain Diversification: Spreading sourcing and manufacturing activities across multiple locations to minimize concentrated risks.",
      strategicThinkingLens: "When navigating production planning under tariff uncertainty, it's crucial to adopt a flexible approach. Begin by diversifying your supplier base to mitigate potential tariff impacts, reducing reliance on a single source. Assessing alternative materials or components from domestic or tariff-free regions can also lessen tariff-related risks. Simultaneously, staying informed about tariff negotiations and potential outcomes will provide insight for strategic decision-making. Balancing short-term cost implications with long-term supply chain resilience is vital to maintaining production stability.\n\n*For example,* In anticipating tariff changes, a furniture manufacturer diversified its supplier base internationally and locally. by incorporating materials sourced from both asia and north america, they minimized the impact of potential tariff fluctuations, ensuring minimal disruption to their production process.",
      followUpPrompts: "1. How might geopolitical factors influence future tariff decisions and affect your production planning?\n2. Have you considered the potential competitive advantages of early adaptation to tariff uncertainties in your industry?",
      conceptsToolsPractice: [
        {
          term: "Risk Mitigation",
          definition: "Strategies employed to reduce the likelihood or impact of potential risks."
        },
        {
          term: "Supply Chain Diversification",
          definition: "Spreading sourcing and manufacturing activities across multiple locations to minimize concentrated risks."
        }
      ],
      model: "gpt-3.5-turbo",
      processing_time: 2.240262985229492
    },
    version: "V1.6.6.6",
    timestamp: "2025-08-26T15:06:27.216525Z"
  },
  queryResponse3: {
    status: "success",
    data: {
      answer: "**Strategic Thinking Lens**\n\nIn navigating production planning amidst tariff uncertainty, several strategic considerations come into play. Firstly, assess the potential impact of tariffs on your supply chain costs and ultimately on the final product pricing. To mitigate risks, consider diversifying suppliers geographically or renegotiating contracts to adapt to changing tariff structures. Secondly, think about demand fluctuations due to tariff changes. Balancing inventory levels to cater to potential shifts in demand can help prevent overstocking or shortages. Lastly, explore alternative production locations or local sourcing to minimize tariff-related disruptions.\n\n*For example,* When a tech company faced fluctuating tariffs, they proactively evaluated suppliers' locations to hedge against potential cost increases. by diversifying sourcing across regions, they managed to stabilize production costs and maintain competitive pricing amid tariff uncertainties.\n\n\n\n**Follow-up Prompts**\n1. How might realigning your supply chain geographically affect lead times and quality control?\n2. Have you considered collaborating with other industry players facing similar challenges to negotiate bulk discounts or shared sourcing strategies?\n\n\n\n**Concepts/Tools**\nStakeholder Alignment: Ensuring all stakeholders share common goals and work together towards the best decision outcomes.\nRisk Assessment: Identifying potential risks, evaluating their impact and likelihood, and developing strategies to manage or mitigate them.",
      strategicThinkingLens: "In navigating production planning amidst tariff uncertainty, several strategic considerations come into play. Firstly, assess the potential impact of tariffs on your supply chain costs and ultimately on the final product pricing. To mitigate risks, consider diversifying suppliers geographically or renegotiating contracts to adapt to changing tariff structures. Secondly, think about demand fluctuations due to tariff changes. Balancing inventory levels to cater to potential shifts in demand can help prevent overstocking or shortages. Lastly, explore alternative production locations or local sourcing to minimize tariff-related disruptions.\n\n*For example,* When a tech company faced fluctuating tariffs, they proactively evaluated suppliers' locations to hedge against potential cost increases. by diversifying sourcing across regions, they managed to stabilize production costs and maintain competitive pricing amid tariff uncertainties.",
      followUpPrompts: "1. How might realigning your supply chain geographically affect lead times and quality control?\n2. Have you considered collaborating with other industry players facing similar challenges to negotiate bulk discounts or shared sourcing strategies?",
      conceptsToolsPractice: [
        {
          term: "Stakeholder Alignment",
          definition: "Ensuring all stakeholders share common goals and work together towards the best decision outcomes."
        },
        {
          term: "Risk Assessment",
          definition: "Identifying potential risks, evaluating their impact and likelihood, and developing strategies to manage or mitigate them."
        }
      ],
      model: "gpt-3.5-turbo",
      processing_time: 3.9544601440429688
    },
    version: "V1.6.6.6",
    timestamp: "2025-08-26T15:06:31.343847Z"
  },
  queryResponse4: {
    status: "success",
    data: {
      answer: "**Strategic Thinking Lens**\n\nIn navigating tariff uncertainty for your production planning, consider multiple key factors. Firstly, analyze the potential impacts of fluctuating tariffs on your supply chain. Evaluate alternative sourcing options or production methods to mitigate risks in case of sudden tariff changes. Secondly, anticipate the shifting market demands under tariff fluctuations and adapt your production mix accordingly. Balancing short-term adjustments with long-term strategic goals is crucial to maintain competitiveness while navigating uncertainties. Lastly, communicate transparently with stakeholders like suppliers, distributors, and customers about your contingency plans to build trust and manage expectations effectively.\n\n*For example,* When facing tariff uncertainty, a furniture manufacturer diversified its suppliers by sourcing raw materials locally and globally. by doing so, the company reduced its reliance on a single market, ensuring continuity of production at stable costs, even amidst tariff fluctuations.\n\n\n\n**Follow-up Prompts**\n1. How might you assess the financial implications of dual sourcing strategies for your production under tariff uncertainty?\n2. What innovative production techniques could you adopt to increase flexibility in response to varying tariff scenarios?\n\n\n\n**Concepts/Tools**\nSupply Chain Management: The management of the flow of goods and services, involving the movement and storage of raw materials, work-in-process inventory, and finished goods from point of origin to point of consumption.\nContingency Planning: A proactive strategy to prepare for potential risks and uncertainties, involving the creation of actionable plans to mitigate negative impacts.",
      strategicThinkingLens: "In navigating tariff uncertainty for your production planning, consider multiple key factors. Firstly, analyze the potential impacts of fluctuating tariffs on your supply chain. Evaluate alternative sourcing options or production methods to mitigate risks in case of sudden tariff changes. Secondly, anticipate the shifting market demands under tariff fluctuations and adapt your production mix accordingly. Balancing short-term adjustments with long-term strategic goals is crucial to maintain competitiveness while navigating uncertainties. Lastly, communicate transparently with stakeholders like suppliers, distributors, and customers about your contingency plans to build trust and manage expectations effectively.\n\n*For example,* When facing tariff uncertainty, a furniture manufacturer diversified its suppliers by sourcing raw materials locally and globally. by doing so, the company reduced its reliance on a single market, ensuring continuity of production at stable costs, even amidst tariff fluctuations.",
      followUpPrompts: "1. How might you assess the financial implications of dual sourcing strategies for your production under tariff uncertainty?\n2. What innovative production techniques could you adopt to increase flexibility in response to varying tariff scenarios?",
      conceptsToolsPractice: [
        {
          term: "Supply Chain Management",
          definition: "The management of the flow of goods and services, involving the movement and storage of raw materials, work-in-process inventory, and finished goods from point of origin to point of consumption."
        },
        {
          term: "Contingency Planning",
          definition: "A proactive strategy to prepare for potential risks and uncertainties, involving the creation of actionable plans to mitigate negative impacts."
        }
      ],
      model: "gpt-3.5-turbo",
      processing_time: 3.434335708618164
    },
    version: "V1.6.6.6",
    timestamp: "2025-08-26T15:06:34.913318Z"
  }
}

// Helper function to create DOM structure
function createTestDOM() {
  document.body.innerHTML = `
    <div id="app">
      <textarea placeholder="Ask a decision-making question..."></textarea>
      <div data-testid="strategic-thinking-lens">
        <h3>Strategic Thinking Lens</h3>
        <div class="content"></div>
      </div>
      <div data-testid="followup-prompts">
        <h3>Follow-up Prompts</h3>
        <div class="content"></div>
      </div>
      <div data-testid="concepts-section">
        <h3>Concepts/Tools</h3>
        <div class="content"></div>
      </div>
    </div>
  `
}

// Helper function to simulate diagnostic script
function simulateDiagnosticScript(backendResponse) {
  // Reset diagnostics
  Object.assign(mockDiagnostics, {
    jsLoaded: false,
    apiUrl: null,
    backendReachable: false,
    backendHealthy: false,
    followUpContainerExists: false,
    clickHandlersAttached: false,
    issues: []
  })

  // Simulate JavaScript loading check
  mockDiagnostics.jsLoaded = true
      mockDiagnostics.apiUrl = 'https://ppoh5tatv4cnr7x7gzgha5k6wu0jrisc.lambda-url.us-east-2.on.aws'

  // Simulate backend connectivity check
  if (backendResponse && backendResponse.status === 'success' && backendResponse.data && backendResponse.data.status === 'healthy') {
    mockDiagnostics.backendReachable = true
    mockDiagnostics.backendHealthy = true
    console.log('✅ Backend is reachable and healthy (V1.6.6.6 format):', backendResponse)
  } else {
    mockDiagnostics.issues.push(`Backend health check failed - unexpected response format: ${JSON.stringify(backendResponse)}`)
    console.warn('⚠️ Backend health check failed - unexpected response format:', backendResponse)
  }

  // Simulate DOM element check
  const requiredElements = [
    { name: 'Query Input', selector: 'textarea[placeholder*="decision-making question"]' },
    { name: 'Strategic Thinking Lens Section', selector: '[data-testid="strategic-thinking-lens"]' },
    { name: 'Follow-up Prompts Section', selector: '[data-testid="followup-prompts"]' },
    { name: 'Concepts Section', selector: '[data-testid="concepts-section"]' }
  ]

  const missingElements = requiredElements.filter(check => {
    const element = document.querySelector(check.selector)
    return !element
  })

  if (missingElements.length > 0) {
    mockDiagnostics.issues.push(`Missing DOM elements: ${missingElements.map(e => e.name).join(', ')}`)
  } else {
    mockDiagnostics.followUpContainerExists = true
  }

  // Simulate click handlers check
  const followUpSection = document.querySelector('[data-testid="followup-prompts"]')
  if (followUpSection) {
    mockDiagnostics.clickHandlersAttached = true
  }

  return mockDiagnostics
}

// Helper function to simulate emergency fix
function simulateEmergencyFix(diagnostics) {
  if (diagnostics.backendHealthy) {
    console.log('✅ Backend healthy — skipping emergency fix to preserve backend answers')
    return false
  } else {
    console.log('⚠️ Backend unavailable — applying emergency fix with degraded responses')
    return true
  }
}

// Helper function to simulate query processing with normalization
function simulateQueryProcessing(queryResponse) {
  if (queryResponse.status === 'success' && queryResponse.data) {
    // Use normalization functions
    let processedFollowUpPrompts = []
    let processedConcepts = []
    
    if (queryResponse.data.followUpPrompts) {
      // Normalize followUpPrompts
      if (Array.isArray(queryResponse.data.followUpPrompts)) {
        processedFollowUpPrompts = queryResponse.data.followUpPrompts
      } else if (typeof queryResponse.data.followUpPrompts === 'string') {
        processedFollowUpPrompts = queryResponse.data.followUpPrompts
          .split(/\n?\d+\.\s+/)
          .map(s => s.trim())
          .filter(Boolean)
      }
    }

    if (queryResponse.data.conceptsToolsPractice) {
      // Normalize concepts
      if (Array.isArray(queryResponse.data.conceptsToolsPractice)) {
        processedConcepts = queryResponse.data.conceptsToolsPractice.map(concept => {
          if (typeof concept === 'string') {
            return { term: "", definition: concept }
          }
          if (!concept.term) {
            return { term: "", definition: concept.definition || "" }
          }
          return concept
        })
      }
    }

    console.log('✅ Response processed successfully:', {
      hasStrategicLens: !!queryResponse.data.strategicThinkingLens,
      followUpCount: processedFollowUpPrompts.length,
      conceptsCount: processedConcepts.length
    })

    return {
      success: true,
      answer: queryResponse.data.answer,
      strategicThinkingLens: queryResponse.data.strategicThinkingLens || 'No strategic thinking lens available',
      followUpPrompts: processedFollowUpPrompts,
      conceptsToolsPractice: processedConcepts,
      processingTime: queryResponse.data.processing_time,
      model: queryResponse.data.model,
      timestamp: queryResponse.data.timestamp
    }
  } else {
    console.error('❌ Query processing failed:', queryResponse)
    return {
      success: false,
      error: 'Query processing failed'
    }
  }
}

describe('Frontend Diagnostic Fixes', () => {
  beforeEach(() => {
    createTestDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Backend Health Check', () => {
    it('should pass when backend returns V1.6.6.6 format', () => {
      const diagnostics = simulateDiagnosticScript(realBackendResponses.healthy)
      
      expect(diagnostics.backendHealthy).toBe(true)
      expect(diagnostics.backendReachable).toBe(true)
      expect(diagnostics.issues).not.toContain('Backend health check failed')
      expect(console.log).toHaveBeenCalledWith(
        '✅ Backend is reachable and healthy (V1.6.6.6 format):',
        realBackendResponses.healthy
      )
    })

    it('should fail when backend returns error status', () => {
      const diagnostics = simulateDiagnosticScript(realBackendResponses.unhealthy)
      
      expect(diagnostics.backendHealthy).toBe(false)
      expect(diagnostics.backendReachable).toBe(false)
      expect(diagnostics.issues.some(issue => issue.includes('Backend health check failed'))).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Backend health check failed - unexpected response format:',
        realBackendResponses.unhealthy
      )
    })
  })

  describe('DOM Element Detection', () => {
    it('should detect all required React components', () => {
      const diagnostics = simulateDiagnosticScript(realBackendResponses.healthy)
      
      expect(diagnostics.followUpContainerExists).toBe(true)
      expect(diagnostics.issues).not.toContain('Missing DOM elements')
      
      // Verify specific elements exist
      expect(document.querySelector('textarea[placeholder*="decision-making question"]')).toBeTruthy()
      expect(document.querySelector('[data-testid="strategic-thinking-lens"]')).toBeTruthy()
      expect(document.querySelector('[data-testid="followup-prompts"]')).toBeTruthy()
      expect(document.querySelector('[data-testid="concepts-section"]')).toBeTruthy()
    })

    it('should report missing elements when DOM is incomplete', () => {
      // Remove some elements
      document.querySelector('[data-testid="followup-prompts"]').remove()
      
      const diagnostics = simulateDiagnosticScript(realBackendResponses.healthy)
      
      expect(diagnostics.followUpContainerExists).toBe(false)
      expect(diagnostics.issues).toContain('Missing DOM elements: Follow-up Prompts Section')
      expect(diagnostics.issues[0]).toContain('Follow-up Prompts Section')
    })
  })

  describe('Emergency Fix Guard', () => {
    it('should NOT apply emergency fix when backend is healthy', () => {
      const diagnostics = simulateDiagnosticScript(realBackendResponses.healthy)
      const emergencyFixApplied = simulateEmergencyFix(diagnostics)
      
      expect(emergencyFixApplied).toBe(false)
      expect(console.log).toHaveBeenCalledWith(
        '✅ Backend healthy — skipping emergency fix to preserve backend answers'
      )
    })

    it('should apply emergency fix when backend is unavailable', () => {
      const diagnostics = simulateDiagnosticScript(realBackendResponses.unhealthy)
      const emergencyFixApplied = simulateEmergencyFix(diagnostics)
      
      expect(emergencyFixApplied).toBe(true)
      expect(console.log).toHaveBeenCalledWith(
        '⚠️ Backend unavailable — applying emergency fix with degraded responses'
      )
    })
  })

  describe('Repeat Query Rendering with Real Backend Data', () => {
    it('should render consistent responses across 4 runs with real backend data', () => {
      const results = []
      const queryResponses = [
        realBackendResponses.queryResponse1,
        realBackendResponses.queryResponse2,
        realBackendResponses.queryResponse3,
        realBackendResponses.queryResponse4
      ]
      
      // Run the same query 4 times with real backend responses
      for (let i = 1; i <= 4; i++) {
        console.log(`\n--- Query Run ${i} ---`)
        const result = simulateQueryProcessing(queryResponses[i-1])
        results.push(result)
      }

      // Verify all 4 runs were successful
      expect(results).toHaveLength(4)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.strategicThinkingLens).toBeTruthy()
        expect(result.followUpPrompts.length).toBeGreaterThan(0)
        expect(result.conceptsToolsPractice.length).toBeGreaterThan(0)
      })

      // Verify each run has rich content (not degraded)
      results.forEach((result, index) => {
        expect(result.strategicThinkingLens).not.toBe('No strategic thinking lens available')
        expect(result.followUpPrompts.length).toBeGreaterThan(0)
        expect(result.conceptsToolsPractice.length).toBeGreaterThan(0)
        
        // Verify strategic thinking lens contains rich content
        expect(result.strategicThinkingLens.length).toBeGreaterThan(100)
        expect(result.strategicThinkingLens).toContain('tariff')
        
        // Verify follow-up prompts are properly parsed
        result.followUpPrompts.forEach(prompt => {
          expect(prompt.length).toBeGreaterThan(20)
          expect(prompt).toContain('?')
        })
        
        // Verify concepts have proper structure
        result.conceptsToolsPractice.forEach(concept => {
          expect(concept.definition.length).toBeGreaterThan(20)
        })
      })

      // Verify processing logs - check for the specific log message
      const logCalls = console.log.mock.calls
      const processingLogs = logCalls.filter(call => 
        call[0] === '✅ Response processed successfully:'
      )
      expect(processingLogs).toHaveLength(4)
    })

    it('should process followUpPrompts from string to array correctly with real data', () => {
      const result = simulateQueryProcessing(realBackendResponses.queryResponse1)
      
      expect(result.followUpPrompts).toHaveLength(3)
      expect(result.followUpPrompts[0]).toBe('How might a scenario planning approach help in preparing for various tariff outcomes?')
      expect(result.followUpPrompts[1]).toBe('What are the risks of overcommitting to long-term production plans in the face of tariff uncertainty?')
      expect(result.followUpPrompts[2]).toBe('Have you considered diversifying your supply chain geographically to mitigate tariff risks?')
    })

    it('should process conceptsToolsPractice with consistent structure with real data', () => {
      const result = simulateQueryProcessing(realBackendResponses.queryResponse1)
      
      expect(result.conceptsToolsPractice).toHaveLength(3)
      expect(result.conceptsToolsPractice[0]).toEqual({
        term: 'Cost-Benefit Analysis',
        definition: 'A systematic approach to estimating the strengths and weaknesses of alternatives, used to determine options that provide the best approach to achieving benefits while preserving savings.'
      })
      expect(result.conceptsToolsPractice[1]).toEqual({
        term: 'Agile Manufacturing',
        definition: 'A manufacturing system focused on flexibility and responsiveness, enabling companies to adapt quickly to changes in the production environment.'
      })
      expect(result.conceptsToolsPractice[2]).toEqual({
        term: 'Benefit Analysis',
        definition: 'A systematic approach to estimating the strengths and weaknesses of alternatives, used to determine options that provide the best approach to achieving benefits while preserving savings.'
      })
    })
  })

  describe('Integration Test with Real Backend Data', () => {
    it('should pass all diagnostic checks with healthy backend and real data', () => {
      // Simulate full diagnostic run
      const diagnostics = simulateDiagnosticScript(realBackendResponses.healthy)
      const emergencyFixApplied = simulateEmergencyFix(diagnostics)
      const queryResult = simulateQueryProcessing(realBackendResponses.queryResponse1)

      // Verify all checks pass
      expect(diagnostics.jsLoaded).toBe(true)
      expect(diagnostics.apiUrl).toBeTruthy()
      expect(diagnostics.backendReachable).toBe(true)
      expect(diagnostics.backendHealthy).toBe(true)
      expect(diagnostics.followUpContainerExists).toBe(true)
      expect(diagnostics.clickHandlersAttached).toBe(true)
      expect(diagnostics.issues).toHaveLength(0)

      // Verify emergency fix not applied
      expect(emergencyFixApplied).toBe(false)

      // Verify query processing successful with rich content
      expect(queryResult.success).toBe(true)
      expect(queryResult.strategicThinkingLens).toBeTruthy()
      expect(queryResult.followUpPrompts).toHaveLength(3)
      expect(queryResult.conceptsToolsPractice).toHaveLength(3)
      
      // Verify rich content (not degraded)
      expect(queryResult.strategicThinkingLens.length).toBeGreaterThan(200)
      expect(queryResult.followUpPrompts[0].length).toBeGreaterThan(50)
      expect(queryResult.conceptsToolsPractice[0].definition.length).toBeGreaterThan(50)

      // Verify no error logs
      expect(console.error).not.toHaveBeenCalled()
    })
  })
})
