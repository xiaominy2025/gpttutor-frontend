# Engent Labs: Active Learning Platform

A GPT-powered active learning platform for deeper understanding across multiple domains. Built with React, Vite, and modern web technologies.

## 🚀 Features

### Multi-Course Support
- **Dynamic Course Loading**: Support for multiple specialized practice labs
- **URL Parameter Routing**: Direct access via `?course=marketing`
- **Course Selector**: Interactive course selection interface
- **Dynamic Content**: Course-specific titles, prompts, and branding

### Current Practice Labs
- **Decision Lab** (`decision`): Decision-making and negotiation strategies
- **Marketing Lab** (`marketing`): Marketing strategy and positioning
- **Strategy Lab** (`strategy`): Strategic thinking and competitive analysis

### Core Functionality
- **Splash Screen**: Professional branding with auto-dismiss
- **Responsive Design**: Optimized for desktop and mobile
- **Real-time Processing**: Live query processing with loading states
- **Error Handling**: Robust error handling and user feedback
- **Accessibility**: Screen reader support and keyboard navigation

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 7
- **Styling**: CSS3 with custom design system
- **HTTP Client**: Axios
- **Markdown**: React Markdown
- **Testing**: Playwright (E2E), Vitest (Unit)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd gpttutor-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URL
VITE_BACKEND_URL=http://localhost:5000

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables
```env
VITE_BACKEND_URL=http://localhost:5000  # Backend API URL
```

### Backend Connection
The frontend connects to the backend via the `/query` endpoint:

```javascript
// Request format
{
  "query": "Your question here",
  "course_id": "decision"  // Optional course identifier
}

// Response format
{
  "status": "success",
  "data": {
    "answer": "Markdown formatted response...",
    "concepts": ["concept1", "concept2"],
    "follow_ups": ["follow up 1", "follow up 2"]
  }
}
```

## 📚 Adding New Courses

### 1. Update Course Configuration
Add your course to `src/config/courseData.js`:

```javascript
export const COURSES = {
  your_course: {
    id: 'your_course',
    name: "Engent Labs: Your Course Practice Lab",
    shortName: "Your Lab",
    description: "A GPT-powered active learning platform for...",
    defaultQuestion: "What is your core concept?",
    samplePrompt: "How should someone approach your domain question?",
    splashTitle: "Your Course Practice Lab",
    splashTagline: "A GPT-Powered Active Learning Platform for Deeper Understanding.",
    mockAnswer: {
      story: "Example story...",
      strategy: "Example strategy...",
      concepts: [
        { term: "Concept1", definition: "Definition 1" },
        { term: "Concept2", definition: "Definition 2" }
      ],
      followUps: ["Follow up 1?", "Follow up 2?"]
    }
  }
};
```

### 2. Backend Integration
Ensure your backend supports the course_id parameter:

```python
# Example Flask endpoint
@app.route('/query', methods=['POST'])
def query():
    data = request.json
    query = data.get('query')
    course_id = data.get('course_id', 'decision')  # Default course
    
    # Process query based on course_id
    response = process_query_with_course_context(query, course_id)
    return jsonify(response)
```

### 3. Course Metadata Requirements
Each course should define:
- `id`: Unique identifier (used in URLs)
- `name`: Full display name
- `shortName`: Abbreviated name for mobile
- `description`: Course description
- `defaultQuestion`: Example question
- `samplePrompt`: Sample prompt for input field
- `splashTitle`: Title shown on splash screen
- `splashTagline`: Tagline shown on splash screen
- `mockAnswer`: Mock response for testing

## 🌐 Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
VITE_BACKEND_URL=https://your-backend-url.com
```

### Netlify Deployment
```bash
# Build the project
npm run build

# Deploy to Netlify
# Upload the dist/ folder or connect your Git repository
```

### Environment Variables for Production
```env
VITE_BACKEND_URL=https://your-production-backend.com
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
npm run test:e2e:headed  # With browser UI
```

### Test Logs
```bash
npm run test:log
```

## 📱 URL Structure

### Course Access
- **Default**: `https://your-domain.com/` (Decision Lab)
- **Marketing**: `https://your-domain.com/?course=marketing`
- **Strategy**: `https://your-domain.com/?course=strategy`
- **Invalid Course**: `https://your-domain.com/?course=invalid` (Shows course selector)

### Course Selector
- **Manual Access**: Click the 🔄 button in the navbar
- **Invalid Course**: Automatically shown for invalid course IDs

## 🎨 Customization

### Styling
The platform uses a custom CSS design system with variables:

```css
:root {
  --thinkpal-blue: #1d75da;
  --thinkpal-yellow: #fbe14d;
  --thinkpal-dark: #1c1c1e;
  --thinkpal-gray: #e0e0e0;
  --thinkpal-bg: #fff;
  --thinkpal-radius: 1.1rem;
  --thinkpal-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}
```

### Course-Specific Branding
Each course can customize:
- Application title and subtitle
- Splash screen content
- Input field placeholder text
- Sample prompts and examples

## 🔄 Development Workflow

### Adding Features
1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement changes
3. Test thoroughly
4. Update documentation
5. Create pull request

### Version Management
```bash
# Create new version
git tag -a v1.6.5 -m "Version 1.6.5: New features"

# Push tags
git push origin --tags
```

## 🐛 Troubleshooting

### Common Issues

**Backend Connection Error**
- Check `VITE_BACKEND_URL` in `.env`
- Verify backend is running
- Check CORS settings on backend

**Course Not Loading**
- Verify course ID in URL parameter
- Check course configuration in `courseData.js`
- Clear browser cache

**Build Errors**
- Update dependencies: `npm update`
- Clear cache: `npm run build --force`
- Check Node.js version compatibility

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Version**: V1.6.4  
**Last Updated**: July 27, 2025  
**Status**: Production Ready ✅
