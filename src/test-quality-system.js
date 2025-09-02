// Test script for Quality Management System
// Run this in the browser console to test the components

console.log('🧪 Testing Quality Management System...');

// Test 1: Quality Analyzer
console.log('\n📊 Test 1: Quality Analyzer');
const mockLowQualityResponse = {
  data: {
    answer: "Short answer",
    strategicThinkingLens: "Brief lens",
    followUpPrompts: ["One prompt"],
    conceptsToolsPractice: "Basic concepts"
  },
  status: "success",
  version: "V1.6.6.6",
  timestamp: "2025-01-01T00:00:00Z"
};

const mockHighQualityResponse = {
  data: {
    answer: "This is a very detailed and comprehensive answer that provides extensive analysis and insights into the strategic decision-making process. It covers multiple aspects and provides thorough explanations for each concept discussed.",
    strategicThinkingLens: "This strategic thinking lens offers a comprehensive framework for analyzing complex business decisions. It incorporates multiple analytical tools and provides detailed guidance on how to approach strategic challenges systematically.",
    followUpPrompts: ["How would you prioritize these options?", "What additional data do you need?", "How do you handle stakeholder resistance?", "What are the long-term implications?"],
    conceptsToolsPractice: "Advanced strategic frameworks and decision-making tools"
  },
  status: "success",
  version: "V1.6.6.6",
  timestamp: "2025-01-01T00:00:00Z"
};

// Import quality analyzer functions (these would be available in the actual app)
// const { analyzeResponseQuality, getQualityScore } = require('./utils/qualityAnalyzer');

console.log('✅ Mock responses created');
console.log('Low quality response length:', mockLowQualityResponse.data.answer.length);
console.log('High quality response length:', mockHighQualityResponse.data.answer.length);

// Test 2: QueryService Simulation
console.log('\n🔥 Test 2: QueryService Simulation');
class MockQueryService {
  constructor() {
    this.isWarmedUp = false;
    this.queryCache = new Map();
    this.qualityHistory = new Map();
  }

  async query(query, courseId) {
    console.log(`🔍 Query: "${query}" for course: ${courseId}`);
    
    // Simulate warm-up on first query
    if (!this.isWarmedUp) {
      console.log('🔥 Warming up Lambda function...');
      await this.simulateWarmUp();
    }

    // Check cache
    const cacheKey = `${query}-${courseId}`;
    if (this.queryCache.has(cacheKey)) {
      console.log('🔥 Using cached response');
      return this.queryCache.get(cacheKey);
    }

    // Simulate API call with quality variation
    const response = await this.simulateAPI(query);
    
    // Cache the response
    this.queryCache.set(cacheKey, response);
    
    console.log(`📊 Response cached, cache size: ${this.queryCache.size}`);
    return response;
  }

  async simulateWarmUp() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isWarmedUp = true;
    console.log('✅ Lambda warmed up successfully');
  }

  async simulateAPI(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return different quality based on query
    if (query.toLowerCase().includes('tariff')) {
      return this.isWarmedUp ? mockHighQualityResponse : mockLowQualityResponse;
    }
    
    return mockHighQualityResponse;
  }

  clearCache() {
    this.queryCache.clear();
    this.qualityHistory.clear();
    this.isWarmedUp = false;
    console.log('🧹 Cache cleared');
  }

  getCacheStats() {
    return {
      cachedQueries: this.queryCache.size,
      qualityHistory: this.qualityHistory.size,
      isWarmedUp: this.isWarmedUp
    };
  }
}

// Test the mock service
const mockService = new MockQueryService();

async function runTests() {
  console.log('\n🚀 Running Quality Management Tests...');
  
  // Test 1: First query (should trigger warm-up)
  console.log('\n--- Test 1: First Query (Cold Start) ---');
  const result1 = await mockService.query("Under tariff uncertainty, how do I plan my production?", "decision");
  console.log('Cache stats:', mockService.getCacheStats());
  
  // Test 2: Same query (should use cache)
  console.log('\n--- Test 2: Cached Query ---');
  const result2 = await mockService.query("Under tariff uncertainty, how do I plan my production?", "decision");
  console.log('Cache stats:', mockService.getCacheStats());
  
  // Test 3: Different query (should be high quality)
  console.log('\n--- Test 3: Different Query (Warm) ---');
  const result3 = await mockService.query("How do I approach team resistance to change?", "decision");
  console.log('Cache stats:', mockService.getCacheStats());
  
  // Test 4: Clear cache
  console.log('\n--- Test 4: Clear Cache ---');
  mockService.clearCache();
  console.log('Cache stats:', mockService.getCacheStats());
  
  console.log('\n✅ All tests completed!');
  console.log('\n💡 To test in the actual app:');
  console.log('1. Ask the same question twice');
  console.log('2. Check the quality indicator');
  console.log('3. Use the retry button if quality is low');
  console.log('4. Clear cache to test warm-up again');
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  window.testQualitySystem = runTests;
  console.log('💡 Run testQualitySystem() to test the system');
} else {
  runTests();
}
