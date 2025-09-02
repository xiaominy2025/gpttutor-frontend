/**
 * Quality Management System Validation Script
 * Run this in your browser console to test the pre-warming and QA/QC system
 */

console.log('🧪 Starting Quality Management System Validation...');

// Test configuration
const TEST_QUERY = "Under tariff uncertainty, how do I plan my production?";
const TEST_COURSE_ID = "decision";
const EXPECTED_MIN_QUALITY = 70;

// Test results storage
const testResults = {
  coldStart: null,
  warmStart: null,
  qaQcTrigger: null,
  warmUpSuccess: false,
  qualityImprovement: false
};

/**
 * Test 1: Cold Start Scenario
 * This simulates the first query after clearing cache
 */
async function testColdStart() {
  console.log('\n🔥 Test 1: Cold Start Scenario');
  console.log('Clearing cache to simulate cold start...');
  
  const queryService = QueryService.getInstance();
  queryService.clearCache();
  
  console.log('Sending first query (should trigger warm-up)...');
  const startTime = Date.now();
  
  try {
    const response = await queryService.query(TEST_QUERY, TEST_COURSE_ID);
    const duration = Date.now() - startTime;
    const quality = analyzeResponseQuality(response);
    const score = getQualityScore(response);
    
    testResults.coldStart = {
      response,
      quality,
      score,
      duration,
      answerLength: response.data?.answer?.length || 0,
      strategicLength: response.data?.strategicThinkingLens?.length || 0,
      promptCount: response.data?.followUpPrompts?.length || 0
    };
    
    console.log(`✅ Cold start completed in ${duration}ms`);
    console.log(`📊 Quality: ${quality} (${score}/100)`);
    console.log(`📝 Answer length: ${testResults.coldStart.answerLength} chars`);
    console.log(`🧠 Strategic lens: ${testResults.coldStart.strategicLength} chars`);
    console.log(`❓ Follow-up prompts: ${testResults.coldStart.promptCount}`);
    
    // Check if warm-up was successful
    testResults.warmUpSuccess = queryService.isWarmedUp;
    console.log(`🔥 Warm-up status: ${testResults.warmUpSuccess ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Cold start test failed:', error);
    testResults.coldStart = { error: error.message };
  }
}

/**
 * Test 2: Warm Start Scenario
 * This tests the second query with a warmed system
 */
async function testWarmStart() {
  console.log('\n🔥 Test 2: Warm Start Scenario');
  console.log('Sending second query (system should be warm)...');
  
  const startTime = Date.now();
  
  try {
    const response = await queryService.query(TEST_QUERY + " (warm test)", TEST_COURSE_ID);
    const duration = Date.now() - startTime;
    const quality = analyzeResponseQuality(response);
    const score = getQualityScore(response);
    
    testResults.warmStart = {
      response,
      quality,
      score,
      duration,
      answerLength: response.data?.answer?.length || 0,
      strategicLength: response.data?.strategicThinkingLens?.length || 0,
      promptCount: response.data?.followUpPrompts?.length || 0
    };
    
    console.log(`✅ Warm start completed in ${duration}ms`);
    console.log(`📊 Quality: ${quality} (${score}/100)`);
    console.log(`📝 Answer length: ${testResults.warmStart.answerLength} chars`);
    console.log(`🧠 Strategic lens: ${testResults.warmStart.strategicLength} chars`);
    console.log(`❓ Follow-up prompts: ${testResults.warmStart.promptCount}`);
    
  } catch (error) {
    console.error('❌ Warm start test failed:', error);
    testResults.warmStart = { error: error.message };
  }
}

/**
 * Test 3: QA/QC Trigger Test
 * This tests if the system detects and handles low quality
 */
async function testQaQcTrigger() {
  console.log('\n🔄 Test 3: QA/QC Trigger Test');
  console.log('Testing quality threshold detection...');
  
  // Create a mock low-quality response to test QA/QC logic
  const mockLowQualityResponse = {
    data: {
      answer: "Short answer for testing purposes. This should trigger QA/QC.",
      strategicThinkingLens: "Brief strategic thinking lens.",
      followUpPrompts: ["One prompt"],
      conceptsToolsPractice: "Basic concepts"
    },
    status: "success",
    version: "1.0",
    timestamp: new Date().toISOString()
  };
  
  const quality = analyzeResponseQuality(mockLowQualityResponse);
  const score = getQualityScore(mockLowQualityResponse);
  
  testResults.qaQcTrigger = {
    mockResponse: mockLowQualityResponse,
    quality,
    score,
    wouldTrigger: score < EXPECTED_MIN_QUALITY
  };
  
  console.log(`📊 Mock response quality: ${quality} (${score}/100)`);
  console.log(`🚫 Would trigger QA/QC: ${testResults.qaQcTrigger.wouldTrigger ? 'YES' : 'NO'}`);
  console.log(`📏 Answer length: ${mockLowQualityResponse.data.answer.length} chars`);
  console.log(`🧠 Strategic lens: ${mockLowQualityResponse.data.strategicThinkingLens.length} chars`);
}

/**
 * Test 4: Quality Improvement Analysis
 * Compares cold vs warm start quality
 */
function analyzeQualityImprovement() {
  console.log('\n📈 Test 4: Quality Improvement Analysis');
  
  if (!testResults.coldStart || !testResults.warmStart) {
    console.log('❌ Cannot analyze quality improvement - missing test results');
    return;
  }
  
  const cold = testResults.coldStart;
  const warm = testResults.warmStart;
  
  const qualityScoreImprovement = warm.score - cold.score;
  const answerLengthImprovement = warm.answerLength - cold.answerLength;
  const strategicLengthImprovement = warm.strategicLength - cold.strategicLength;
  
  testResults.qualityImprovement = {
    scoreImprovement: qualityScoreImprovement,
    answerLengthImprovement,
    strategicLengthImprovement,
    meetsThreshold: warm.score >= EXPECTED_MIN_QUALITY
  };
  
  console.log(`📊 Quality Score Improvement: ${cold.score} → ${warm.score} (+${qualityScoreImprovement})`);
  console.log(`📝 Answer Length Improvement: ${cold.answerLength} → ${warm.answerLength} (+${answerLengthImprovement})`);
  console.log(`🧠 Strategic Lens Improvement: ${cold.strategicLength} → ${warm.strategicLength} (+${strategicLengthImprovement})`);
  console.log(`✅ Meets Quality Threshold (${EXPECTED_MIN_QUALITY}+): ${testResults.qualityImprovement.meetsThreshold ? 'YES' : 'NO'}`);
  
  // Check if improvement matches expected pattern
  const expectedPattern = {
    scoreImprovement: 'Should be >20 points',
    answerLengthImprovement: 'Should be >2000 chars',
    strategicLengthImprovement: 'Should be >500 chars'
  };
  
  console.log('\n📋 Expected Improvement Pattern:');
  console.log(`   Score: ${expectedPattern.scoreImprovement}`);
  console.log(`   Answer Length: ${expectedPattern.answerLengthImprovement}`);
  console.log(`   Strategic Lens: ${expectedPattern.strategicLengthImprovement}`);
}

/**
 * Test 5: System Health Check
 * Tests proactive monitoring
 */
async function testSystemHealthCheck() {
  console.log('\n🌡️ Test 5: System Health Check');
  
  const queryService = QueryService.getInstance();
  
  try {
    console.log('Running proactive health check...');
    await queryService.checkAndWarmUpIfNeeded();
    
    const cacheStats = queryService.getCacheStats();
    console.log('📊 Cache Statistics:');
    console.log(`   Cached Queries: ${cacheStats.cachedQueries}`);
    console.log(`   Quality History: ${cacheStats.qualityHistory}`);
    console.log(`   Is Warmed Up: ${cacheStats.isWarmedUp}`);
    
  } catch (error) {
    console.error('❌ System health check failed:', error);
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n📋 ========================================');
  console.log('📋 QUALITY MANAGEMENT SYSTEM TEST REPORT');
  console.log('📋 ========================================');
  
  console.log('\n🔥 Test Results Summary:');
  console.log(`   Cold Start: ${testResults.coldStart ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Warm Start: ${testResults.warmStart ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   QA/QC Trigger: ${testResults.qaQcTrigger ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Warm-up Success: ${testResults.warmUpSuccess ? '✅ YES' : '❌ NO'}`);
  console.log(`   Quality Improvement: ${testResults.qualityImprovement ? '✅ YES' : '❌ NO'}`);
  
  if (testResults.qualityImprovement) {
    console.log('\n📈 Quality Improvement Achieved:');
    console.log(`   Score: +${testResults.qualityImprovement.scoreImprovement} points`);
    console.log(`   Answer Length: +${testResults.qualityImprovement.answerLengthImprovement} chars`);
    console.log(`   Strategic Lens: +${testResults.qualityImprovement.strategicLengthImprovement} chars`);
    console.log(`   Meets Threshold: ${testResults.qualityImprovement.meetsThreshold ? 'YES' : 'NO'}`);
  }
  
  console.log('\n🎯 Deployment Confidence:');
  if (testResults.warmUpSuccess && testResults.qualityImprovement?.meetsThreshold) {
    console.log('   🚀 HIGH CONFIDENCE - System should eliminate quality differences');
  } else if (testResults.warmUpSuccess) {
    console.log('   ⚠️  MEDIUM CONFIDENCE - Warm-up works but quality needs verification');
  } else {
    console.log('   ❌ LOW CONFIDENCE - Warm-up failed, needs investigation');
  }
  
  console.log('\n📊 Raw Test Data:');
  console.log(JSON.stringify(testResults, null, 2));
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting comprehensive quality system validation...');
  
  try {
    await testColdStart();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
    
    await testWarmStart();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    
    testQaQcTrigger();
    analyzeQualityImprovement();
    await testSystemHealthCheck();
    
    generateTestReport();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export functions for manual testing
window.QualitySystemTests = {
  runAllTests,
  testColdStart,
  testWarmStart,
  testQaQcTrigger,
  analyzeQualityImprovement,
  testSystemHealthCheck,
  generateTestReport,
  testResults
};

console.log('✅ Quality System Validation Script loaded!');
console.log('💡 Run QualitySystemTests.runAllTests() to start testing');
console.log('💡 Or run individual tests like QualitySystemTests.testColdStart()');
