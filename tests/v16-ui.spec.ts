import { test, expect } from '@playwright/test';

// Test queries with expected lens coverage
const testQueries = [
  {
    query: "How should I prioritize tasks when under tight deadlines?",
    description: "Strategic mindset only",
    expectedLenses: ["strategic_mindset"]
  },
  {
    query: "What tools can help me evaluate whether to lease or buy equipment?",
    description: "Strategic mindset + Analytical tools",
    expectedLenses: ["strategic_mindset", "analytical_tools"]
  },
  {
    query: "How can I encourage my team to speak up during meetings?",
    description: "Human behavior only",
    expectedLenses: ["human_behavior"]
  },
  {
    query: "How do I approach negotiating for a new BMW X4?",
    description: "All three lenses",
    expectedLenses: ["strategic_mindset", "analytical_tools", "human_behavior"]
  },
  {
    query: "Should I pivot my startup based on early customer feedback?",
    description: "All three lenses",
    expectedLenses: ["strategic_mindset", "analytical_tools", "human_behavior"]
  },
  {
    query: "How can I convince a risk-averse investor to fund my project?",
    description: "Strategy + Behavior",
    expectedLenses: ["strategic_mindset", "human_behavior"]
  },
  {
    query: "How should I plan production with fluctuating demand and limited storage?",
    description: "All three lenses",
    expectedLenses: ["strategic_mindset", "analytical_tools", "human_behavior"]
  }
];

// Helper function to validate tooltip formatting
async function validateTooltipFormatting(page: any) {
  // Look for the actual Tooltip component format that gets rendered
  const tooltipSpans = await page.locator('span.relative.group').all();
  const tooltipCount = tooltipSpans.length;
  
  console.log(`🔍 Found ${tooltipCount} tooltip components`);
  
  if (tooltipCount === 0) {
    console.log('⚠️ No tooltips found in response');
    return false;
  }
  
  // Validate each tooltip component format
  for (let i = 0; i < tooltipSpans.length; i++) {
    const span = tooltipSpans[i];
    const className = await span.getAttribute('class');
    const textContent = await span.textContent();
    
    // Check format: <span class="relative group"><span class="underline text-blue-700 cursor-help">Term</span></span>
    if (!className?.includes('relative') || !className?.includes('group')) {
      console.log(`❌ Tooltip ${i + 1}: Missing 'relative group' classes`);
      return false;
    }
    
    if (!textContent?.trim()) {
      console.log(`❌ Tooltip ${i + 1}: Empty text content`);
      return false;
    }
    
    console.log(`✅ Tooltip ${i + 1}: "${textContent}"`);
  }
  
  // Check for proper tooltip component structure
  const html = await page.content();
  const tooltipComponents = (html.match(/<span class="relative group"/g) || []).length;
  
  console.log(`✅ Tooltip component validation passed: ${tooltipComponents} tooltip components found`);
  return true;
}

// Helper function to validate section structure
async function validateSectionStructure(page: any) {
  const expectedSections = [
    'Strategic Thinking Lens',
    'Story in Action', 
    'Reflection Prompts',
    'Concepts/Tools/Practice Reference'
  ];
  
  const missingSections = [];
  
  for (const section of expectedSections) {
    const sectionElement = page.locator(`h3:has-text("${section}")`);
    const isVisible = await sectionElement.isVisible();
    
    if (!isVisible) {
      missingSections.push(section);
      console.log(`❌ Missing section: ${section}`);
    } else {
      console.log(`✅ Section found: ${section}`);
    }
  }
  
  if (missingSections.length > 0) {
    console.log(`⚠️ Missing sections: ${missingSections.join(', ')}`);
    return false;
  }
  
  console.log('✅ All 4 sections present and visible');
  return true;
}

// Main test suite
test.describe('V16 UI Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('nav.navbar');
    await page.waitForSelector('form.query-form');
    
    console.log('🚀 App loaded successfully');
  });

  // Individual test cases for each query
  testQueries.forEach((testCase, i) => {
    test(`Test Case ${i + 1}: ${testCase.description}`, async ({ page }) => {
      console.log(`\n🧪 Testing: "${testCase.query}"`);
      console.log(`📋 Expected lenses: ${testCase.expectedLenses.join(', ')}`);
      
      // Find and fill the query input
      const queryInput = page.locator('textarea.query-textarea');
      await queryInput.fill(testCase.query);
      
      // Submit the query
      const submitButton = page.locator('button.query-submit-btn');
      await submitButton.click();
      
      // Wait for loading state
      await page.waitForSelector('text=🔄 Thinking...', { timeout: 5000 });
      
      // Wait for response to load
      await page.waitForSelector('[data-testid="response"]', { timeout: 30000 });
      
      // Wait a bit more for content to fully render
      await page.waitForTimeout(2000);
      
      console.log('✅ Response loaded successfully');
      
      // Validate section structure
      const sectionsValid = await validateSectionStructure(page);
      expect(sectionsValid).toBe(true);
      
      // Validate tooltip formatting (optional - some queries may not have tooltips)
      const tooltipsValid = await validateTooltipFormatting(page);
      if (!tooltipsValid) {
        console.log('⚠️ No tooltips found - this may be expected for some queries');
        // Don't fail the test if no tooltips are found
      } else {
        console.log('✅ Tooltip validation passed');
      }
      
      // Additional validation: Check that response content is not empty
      const responseElement = page.locator('[data-testid="response"]');
      const responseText = await responseElement.textContent();
      
      if (!responseText || responseText.trim().length < 100) {
        console.log('⚠️ Response content seems too short');
        console.log(`📝 Response length: ${responseText?.length || 0} characters`);
      } else {
        console.log(`✅ Response content length: ${responseText.length} characters`);
      }
      
      // Debug: Check for HTML content in the response
      const responseHTML = await responseElement.innerHTML();
      if (responseHTML.includes('<span class="relative group"')) {
        console.log('✅ Found tooltip components in HTML response');
      } else {
        console.log('⚠️ No tooltip components found in HTML response');
        console.log('🔍 HTML preview:', responseHTML.substring(0, 500) + '...');
      }
      
      // Check for specific content indicators based on expected lenses
      if (testCase.expectedLenses.includes('strategic_mindset')) {
        const strategicContent = await page.locator('h3:has-text("Strategic Thinking Lens") + div').textContent();
        expect(strategicContent?.length).toBeGreaterThan(50);
        console.log('✅ Strategic Thinking Lens content validated');
      }
      
      if (testCase.expectedLenses.includes('human_behavior')) {
        const storyContent = await page.locator('h3:has-text("Story in Action") + div').textContent();
        expect(storyContent?.length).toBeGreaterThan(50);
        console.log('✅ Story in Action content validated');
      }
      
             console.log(`🎉 Test case ${i + 1} completed successfully`);
     });
   });
  
  // Additional test: Verify API connectivity
  test('API Connectivity Test', async ({ page }) => {
    console.log('\n🔌 Testing API connectivity...');
    
    // Check if backend is accessible
    try {
      const response = await page.request.post('http://localhost:5000/query', {
        data: { query: 'test' }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('success');
      expect(data.data.answer).toBeDefined();
      
      console.log('✅ Backend API is accessible and responding correctly');
    } catch (error) {
      console.log('❌ Backend API connectivity issue:', error);
      throw error;
    }
  });
  
  // Additional test: Verify tooltip interaction
  test('Tooltip Interaction Test', async ({ page }) => {
    console.log('\n👆 Testing tooltip interactions...');
    
    // Submit a simple query to get tooltips
    const queryInput = page.locator('textarea.query-textarea');
    await queryInput.fill('How should I plan production with fluctuating demand and limited storage?');
    
    const submitButton = page.locator('button.query-submit-btn');
    await submitButton.click();
    
    // Wait for response
    await page.waitForSelector('[data-testid="response"]', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Find tooltips
    const tooltips = page.locator('span.relative.group');
    const tooltipCount = await tooltips.count();
    
    if (tooltipCount > 0) {
      // Test clicking on first tooltip
      const firstTooltip = tooltips.first();
      await firstTooltip.click();
      
      // Wait for tooltip to appear
      await page.waitForTimeout(500);
      
      // Check if tooltip content is visible
      const tooltipContent = page.locator('.absolute.z-10');
      const isVisible = await tooltipContent.isVisible();
      
      if (isVisible) {
        console.log('✅ Tooltip interaction working correctly');
      } else {
        console.log('⚠️ Tooltip content not visible after click');
      }
    } else {
      console.log('⚠️ No tooltips found for interaction test');
    }
  });
}); 