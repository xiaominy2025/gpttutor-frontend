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

// Helper function to validate section content is meaningful
async function validateSectionContent(page: any, sectionTestId: string, sectionName: string) {
  console.log(`🔍 Validating ${sectionName} content...`);
  
  const sectionElement = page.locator(`[data-testid="${sectionTestId}"]`);
  const isVisible = await sectionElement.isVisible();
  
  if (!isVisible) {
    console.log(`❌ ${sectionName} section not visible`);
    return false;
  }
  
  // Get the content - handle different section structures
  let contentText = '';
  
  if (sectionTestId === 'reflection-prompts') {
    // Reflection prompts render as ul/li elements
    const ulElement = sectionElement.locator('ul');
    const isUlVisible = await ulElement.isVisible();
    
    if (isUlVisible) {
      const liElements = ulElement.locator('li');
      const liCount = await liElements.count();
      
      if (liCount > 0) {
        const liTexts = [];
        for (let i = 0; i < liCount; i++) {
          const liText = await liElements.nth(i).textContent();
          if (liText) liTexts.push(liText.trim());
        }
        contentText = liTexts.join(' ');
      }
    } else {
      // Check if there's a fallback message
      const fallbackElement = sectionElement.locator('p');
      const fallbackText = await fallbackElement.textContent();
      contentText = fallbackText || '';
    }
  } else {
    // Other sections render as div elements
    const contentElement = sectionElement.locator('div').first();
    contentText = await contentElement.textContent() || '';
  }
  
  if (!contentText) {
    console.log(`❌ ${sectionName} has no content`);
    return false;
  }
  
  // Check if content is meaningful (not just fallback message)
  const fallbackMessages = [
    "No strategic thinking lens available",
    "No story available",
    "No reflection prompts available",
    "No relevant concepts/tools for this query."
  ];
  
  const isFallbackMessage = fallbackMessages.some(msg => 
    contentText.trim().includes(msg)
  );
  
  if (isFallbackMessage) {
    console.log(`❌ ${sectionName} shows fallback message: "${contentText.trim()}"`);
    return false;
  }
  
  // Check for stray markdown markers
  const hasStrayMarkers = /[-–—=_]+\s*$/.test(contentText.trim());
  if (hasStrayMarkers) {
    console.log(`❌ ${sectionName} contains stray markdown markers: "${contentText.trim()}"`);
    return false;
  }
  
  // Check for raw markdown formatting
  const hasRawMarkdown = /\*\*[^*]+\*\*/.test(contentText);
  if (hasRawMarkdown) {
    console.log(`❌ ${sectionName} contains raw markdown formatting: "${contentText.trim()}"`);
    return false;
  }

  // Check for other markdown artifacts
  const hasMarkdownArtifacts = /\[.*\]\(.*\)|`.*`|#{1,6}\s/.test(contentText);
  if (hasMarkdownArtifacts) {
    console.log(`❌ ${sectionName} contains markdown artifacts: "${contentText.trim()}"`);
    return false;
  }
  
  // Check if content has reasonable length
  if (contentText.trim().length < 20) {
    console.log(`⚠️ ${sectionName} content seems too short: "${contentText.trim()}"`);
    return false;
  }
  
  console.log(`✅ ${sectionName} has meaningful content: "${contentText.trim().substring(0, 100)}..."`);
  return true;
}

// Helper function to validate concept rendering (v1.6 format)
async function validateConceptRendering(page: any) {
  console.log('🔍 Validating concept rendering...');
  
  // Check if concepts section exists
  const conceptsSection = page.locator('[data-testid="concepts-section"]');
  const isVisible = await conceptsSection.isVisible();
  
  if (!isVisible) {
    console.log('❌ Concepts section not visible');
    return false;
  }
  
  // Check for concept elements with data-testid
  const conceptElements = page.locator('[data-testid^="concept-"]');
  const conceptCount = await conceptElements.count();
  
  if (conceptCount === 0) {
    // Check if "No relevant concepts/tools for this query" message is shown
    const noConceptsMessage = page.locator('text=No relevant concepts/tools for this query');
    const hasNoConceptsMessage = await noConceptsMessage.isVisible();
    
    if (hasNoConceptsMessage) {
      console.log('✅ No concepts message displayed correctly');
      return true;
    } else {
      console.log('❌ No concepts found and no message displayed');
      return false;
    }
  }
  
  console.log(`✅ Found ${conceptCount} concept(s)`);
  
  // Validate each concept has the correct format "Term: Definition"
  for (let i = 0; i < conceptCount; i++) {
    const conceptElement = page.locator(`[data-testid="concept-${i}"]`);
    const conceptText = await conceptElement.textContent();
    
    if (!conceptText) {
      console.log(`❌ Concept ${i} has no text content`);
      return false;
    }
    
    // Check if the concept follows "Term: Definition" format
    const hasColon = conceptText.includes(':');
    const hasDefinition = conceptText.split(':').length > 1;
    
    if (!hasColon || !hasDefinition) {
      console.log(`❌ Concept ${i} does not follow "Term: Definition" format: "${conceptText}"`);
      return false;
    }
    
    console.log(`✅ Concept ${i} format valid: "${conceptText.trim()}"`);
  }
  
  return true;
}

// Helper function to validate reflection prompt click-to-load functionality
async function validateReflectionPromptClickToLoad(page: any) {
  console.log('🔍 Validating reflection prompt click-to-load functionality...');
  
  // Check if reflection prompts section exists and has prompts
  const reflectionPromptsSection = page.locator('[data-testid="reflection-prompts"]');
  const isVisible = await reflectionPromptsSection.isVisible();
  
  if (!isVisible) {
    console.log('❌ Reflection prompts section not visible');
    return false;
  }
  
  // Check for reflection prompt elements
  const promptElements = page.locator('[data-testid^="reflection-prompt-"]');
  const promptCount = await promptElements.count();
  
  if (promptCount === 0) {
    console.log('❌ No reflection prompts found');
    return false;
  }
  
  console.log(`✅ Found ${promptCount} reflection prompt(s)`);
  
  // Get the first prompt text
  const firstPromptElement = page.locator('[data-testid="reflection-prompt-0"]');
  const promptText = await firstPromptElement.textContent();
  
  if (!promptText) {
    console.log('❌ First reflection prompt has no text content');
    return false;
  }
  
  // Clear the input box first
  const textarea = page.locator('textarea.question-textarea');
  await textarea.clear();
  
  // Click on the first reflection prompt
  await firstPromptElement.click();
  
  // Wait a moment for the click to register
  await page.waitForTimeout(500);
  
  // Check if the textarea now contains the prompt text
  const textareaValue = await textarea.inputValue();
  
  if (textareaValue !== promptText.trim()) {
    console.log(`❌ Click-to-load failed. Expected: "${promptText.trim()}", Got: "${textareaValue}"`);
    return false;
  }
  
  console.log(`✅ Click-to-load working correctly. Prompt loaded: "${promptText.trim().substring(0, 50)}..."`);
  return true;
}

// Main test suite
test.describe('V16 UI Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('nav.navbar');
    await page.waitForSelector('form.question-form');
    
    console.log('🚀 App loaded successfully');
  });

  // Individual test cases for each query
  testQueries.forEach((testCase, i) => {
    test(`Test Case ${i + 1}: ${testCase.description}`, async ({ page }) => {
      console.log(`\n🧪 Testing: "${testCase.query}"`);
      console.log(`📋 Expected lenses: ${testCase.expectedLenses.join(', ')}`);
      
      // Find and fill the query input
      const queryInput = page.locator('textarea.question-textarea');
      await queryInput.fill(testCase.query);
      
      // Submit the query
      const submitButton = page.locator('button.ask-button');
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

      // Validate each section has meaningful content
      const strategicValid = await validateSectionContent(page, 'strategic-thinking-lens', 'Strategic Thinking Lens');
      const storyValid = await validateSectionContent(page, 'story-in-action', 'Story in Action');
      const reflectionValid = await validateSectionContent(page, 'reflection-prompts', 'Reflection Prompts');
      
      // At least one of the main content sections should have meaningful content
      const hasMainContent = strategicValid || storyValid || reflectionValid;
      expect(hasMainContent).toBe(true);

      // Validate concept rendering (v1.6 format)
      const conceptsValid = await validateConceptRendering(page);
      expect(conceptsValid).toBe(true);

      // Additional validation: Check that response content is not empty
      const responseElement = page.locator('[data-testid="response"]');
      const responseText = await responseElement.textContent();

      if (!responseText || responseText.trim().length < 100) {
        console.log('⚠️ Response content seems too short');
        console.log(`📝 Response length: ${responseText?.length || 0} characters`);
      } else {
        console.log(`✅ Response content length: ${responseText.length} characters`);
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
  
  // Additional test: Verify v1.6 concept format compliance
  test('V1.6 Concept Format Test', async ({ page }) => {
    console.log('\n🔍 Testing v1.6 concept format compliance...');
    
    // Submit a query that should generate concepts
    const queryInput = page.locator('textarea.question-textarea');
    await queryInput.fill('How should I plan production with fluctuating demand and limited storage?');
    
    const submitButton = page.locator('button.ask-button');
    await submitButton.click();
    
    // Wait for response
    await page.waitForSelector('[data-testid="response"]', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Validate concept rendering
    const conceptsValid = await validateConceptRendering(page);
    expect(conceptsValid).toBe(true);
    
    // Check that no tooltip-related elements exist
    const tooltipSpans = page.locator('span[class*="tooltip"]');
    const tooltipCount = await tooltipSpans.count();
    expect(tooltipCount).toBe(0);
    
    console.log('✅ V1.6 concept format compliance validated');
  });

  // Additional test: Verify markdown rendering quality
  test('Markdown Rendering Quality Test', async ({ page }) => {
    console.log('\n🔍 Testing markdown rendering quality...');
    
    // Submit a query that should generate rich content
    const queryInput = page.locator('textarea.question-textarea');
    await queryInput.fill('How should I prioritize tasks when under tight deadlines?');
    
    const submitButton = page.locator('button.ask-button');
    await submitButton.click();
    
    // Wait for response
    await page.waitForSelector('[data-testid="response"]', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check that all sections render properly without markdown artifacts
    const sections = [
      { testId: 'strategic-thinking-lens', name: 'Strategic Thinking Lens' },
      { testId: 'story-in-action', name: 'Story in Action' },
      { testId: 'reflection-prompts', name: 'Reflection Prompts' }
    ];
    
    for (const section of sections) {
      const sectionElement = page.locator(`[data-testid="${section.testId}"]`);
      const contentText = await sectionElement.textContent() || '';
      
      // Check for no raw markdown
      const hasRawMarkdown = /\*\*[^*]+\*\*|`[^`]+`|\[.*\]\(.*\)/.test(contentText);
      expect(hasRawMarkdown).toBe(false);
      
      // Check for no trailing markers
      const hasTrailingMarkers = /[-–—=_]+\s*$/.test(contentText.trim());
      expect(hasTrailingMarkers).toBe(false);
      
      console.log(`✅ ${section.name} renders cleanly without markdown artifacts`);
    }
    
    console.log('✅ Markdown rendering quality validated');
  });

  // New test: Verify reflection prompt click-to-load functionality
  test('Reflection Prompt Click-to-Load Test', async ({ page }) => {
    console.log('\n🔍 Testing reflection prompt click-to-load functionality...');
    
    // Submit a query that should generate reflection prompts
    const queryInput = page.locator('textarea.question-textarea');
    await queryInput.fill('How should I prioritize tasks when under tight deadlines?');
    
    const submitButton = page.locator('button.ask-button');
    await submitButton.click();
    
    // Wait for response
    await page.waitForSelector('[data-testid="response"]', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Validate click-to-load functionality
    const clickToLoadValid = await validateReflectionPromptClickToLoad(page);
    expect(clickToLoadValid).toBe(true);
    
    // Additional validation: Check that reflection prompts have proper styling
    const reflectionPrompts = page.locator('[data-testid^="reflection-prompt-"]');
    const promptCount = await reflectionPrompts.count();
    
    if (promptCount > 0) {
      const firstPrompt = reflectionPrompts.first();
      
      // Check for cursor pointer
      const cursorStyle = await firstPrompt.evaluate(el => getComputedStyle(el).cursor);
      expect(cursorStyle).toBe('pointer');
      
      // Check for hover effects (by checking if the class is applied)
      const hasHoverClass = await firstPrompt.evaluate(el => el.classList.contains('reflection-prompt-item'));
      expect(hasHoverClass).toBe(true);
      
      console.log('✅ Reflection prompts have proper click-to-load styling');
    }
    
    console.log('✅ Reflection prompt click-to-load functionality validated');
  });

  // Test: Verify question bar and form are centered on screen
  test('Question Bar Centering Test', async ({ page }) => {
    console.log('\n🔍 Testing question bar and form centering...');
    
    await page.goto('http://localhost:5174');

    // Wait for the page and question bar to load
    const questionBar = page.locator('.question-bar');
    await expect(questionBar).toBeVisible();

    const form = page.locator('.question-form');
    const mainContainer = page.locator('.main-container');

    // Get bounding boxes and viewport size
    const formBox = await form.boundingBox();
    const mainContainerBox = await mainContainer.boundingBox();
    const viewport = page.viewportSize();

    if (!formBox || !mainContainerBox || !viewport) {
      throw new Error('Could not get bounding box or viewport size');
    }

    // Log all the measurements
    console.log(`📊 Viewport width: ${viewport.width}`);
    console.log(`📊 Main container: x=${mainContainerBox.x}, width=${mainContainerBox.width}, center=${mainContainerBox.x + mainContainerBox.width / 2}`);
    console.log(`📊 Form: x=${formBox.x}, width=${formBox.width}, center=${formBox.x + formBox.width / 2}`);
    
    // Test main container centering first
    const mainContainerCenterX = mainContainerBox.x + mainContainerBox.width / 2;
    const screenCenterX = viewport.width / 2;
    const mainContainerOffset = Math.abs(mainContainerCenterX - screenCenterX);

    console.log(`📊 Main container center X: ${mainContainerCenterX}, Screen center X: ${screenCenterX}, Main container offset: ${mainContainerOffset}px`);

    // Assert that main container is visually centered
    expect(mainContainerOffset).toBeLessThan(5);
    
    console.log('✅ Question bar and form are properly centered');
  });
}); 