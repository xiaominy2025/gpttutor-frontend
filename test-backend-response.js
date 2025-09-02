// Test script to verify backend response format
// Run with: node test-backend-response.js

import { api } from './src/lib/api.js';

async function testBackend() {
  console.log('🧪 Testing backend response format...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const health = await api.health();
    console.log('✅ Health response:', health);
    
    // Test course metadata
    console.log('\n2. Testing course metadata...');
    const courseMeta = await api.courseMeta('decision');
    console.log('✅ Course metadata:', courseMeta);
    
    // Test query endpoint
    console.log('\n3. Testing query endpoint...');
    const query = await api.query({
      query: 'What is decision making?',
      course_id: 'decision',
      user_id: 'test'
    });
    console.log('✅ Query response:', query);
    
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBackend();
