// Course configuration for Engent Labs multi-course platform
export const COURSES = {
  decision: {
    id: 'decision',
    name: "Engent Labs: Decision-Making Practice Lab",
    shortName: "Decision Lab",
    description: "A GPT-powered active learning platform for deeper understanding of decision-making.",
    defaultQuestion: "What is BATNA?",
    samplePrompt: "How should a manufacturing company decide on strategic options for growth under U.S. trade policy uncertainty?",
    splashTitle: "Decision-Making Practice Lab",
    splashTagline: "A GPT-Powered Active Learning Platform for Deeper Understanding.",
    mockAnswer: {
      story: "Imagine you're negotiating a job offer...",
      strategy: "Use your BATNA as leverage to evaluate or counter offers...",
      concepts: [
        { term: "BATNA", definition: "Best Alternative to a Negotiated Agreement" },
        { term: "Reservation Price", definition: "The minimum you're willing to accept" }
      ],
      followUps: ["How do I improve my BATNA?", "What if I don't have a strong alternative?"]
    }
  },
  marketing: {
    id: 'marketing',
    name: "Engent Labs: Marketing Strategy Practice Lab",
    shortName: "Marketing Lab",
    description: "A GPT-powered active learning platform for deeper understanding of marketing strategy.",
    defaultQuestion: "What is market segmentation?",
    samplePrompt: "How should a startup decide on its target market and positioning strategy?",
    splashTitle: "Marketing Strategy Practice Lab",
    splashTagline: "A GPT-Powered Active Learning Platform for Deeper Understanding.",
    mockAnswer: {
      story: "Imagine you're launching a new product...",
      strategy: "Use market segmentation to identify your ideal customer profile...",
      concepts: [
        { term: "Market Segmentation", definition: "Dividing a market into distinct groups of buyers" },
        { term: "Positioning", definition: "How your product is perceived relative to competitors" }
      ],
      followUps: ["How do I identify my target market?", "What if my positioning isn't working?"]
    }
  },
  strategy: {
    id: 'strategy',
    name: "Engent Labs: Strategic Thinking Practice Lab",
    shortName: "Strategy Lab",
    description: "A GPT-powered active learning platform for deeper understanding of strategic thinking.",
    defaultQuestion: "What is competitive advantage?",
    samplePrompt: "How should a company analyze its competitive landscape and develop a sustainable advantage?",
    splashTitle: "Strategic Thinking Practice Lab",
    splashTagline: "A GPT-Powered Active Learning Platform for Deeper Understanding.",
    mockAnswer: {
      story: "Imagine you're analyzing your company's position...",
      strategy: "Use competitive analysis to identify your unique value proposition...",
      concepts: [
        { term: "Competitive Advantage", definition: "A unique advantage over competitors" },
        { term: "Value Proposition", definition: "The unique value you provide to customers" }
      ],
      followUps: ["How do I build a competitive advantage?", "What if my advantage isn't sustainable?"]
    }
  }
};

// Default course (fallback)
export const DEFAULT_COURSE = 'decision';

// Helper function to get course by ID
export const getCourseById = (courseId) => {
  return COURSES[courseId] || COURSES[DEFAULT_COURSE];
};

// Helper function to get all available courses
export const getAllCourses = () => {
  return Object.values(COURSES);
};

// Legacy support
export const COURSE = COURSES[DEFAULT_COURSE];
  