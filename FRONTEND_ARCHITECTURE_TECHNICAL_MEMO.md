# Engent Labs Frontend Architecture Technical Memo
**Version:** V1.6.6 ("Decision Coach")  
**Document Type:** Internal Engineering Documentation & Patent Evaluation Support  
**Date:** October 8, 2025  
**Author:** Senior Front-End Architecture Team

---

## 1. Overview and Purpose

### Platform Function
The Engent Labs frontend is a React-based single-page application that transforms structured JSON responses from an AI-powered backend into interactive educational experiences. Unlike traditional AI chat interfaces that present unstructured conversational output, this frontend implements a **three-section pedagogical framework** that systematically guides learners through: (1) strategic analysis, (2) reflective inquiry, and (3) conceptual grounding.

### Data Visualization Philosophy
The frontend receives a unified JSON payload from the backend containing `strategicThinkingLens` (80-150 word strategic narrative), `followUpPrompts` (array of 2-4 actionable questions), and `conceptsToolsPractice` (array of term-definition pairs). These fields are rendered into visually distinct, sequentially organized sections that mirror established cognitive learning patterns: comprehension → inquiry → knowledge reinforcement.

### Educational Goal
The architecture operationalizes a **"one-API-call, three-section learning cycle"** paradigm. Rather than allowing students to receive direct answers (which encourages passive consumption), the system:
- Presents strategic context that models expert reasoning patterns
- Surfaces follow-up questions that students can click to deepen inquiry
- Anchors learning in course-specific terminology and frameworks

This design intentionally prevents "answer extraction" behavior while promoting iterative questioning—transforming the AI from a shortcut into a structured thinking partner aligned with instructor pedagogy.

---

## 2. Component Architecture

### Component Hierarchy
```
App (Router)
├── Homepage (Marketing & Pre-Warm)
└── LabsApp (Main Learning Interface)
    ├── CourseSelector (Course Selection Screen)
    ├── QueryInput (Student Question Entry)
    ├── QuestionHistory (Session History Navigation)
    ├── ResponseDisplay (Quality-Managed Responses)
    │   ├── Strategic Lens Section
    │   ├── Follow-up Prompts Section (Clickable)
    │   └── Concepts & Tools Section
    ├── AnswerCard (Legacy/Fallback Rendering)
    ├── QualityIndicator (Quality Metrics Display)
    └── BackendTest (Development Diagnostics)
```

### Core Component Responsibilities

#### **App.jsx**
- Router configuration for `/` (Homepage) and `/labs` (Learning Interface)
- Root-level routing and navigation

#### **LabsApp (App.jsx)**
- State orchestration for:
  - Course selection (`selectedCourseId`, `courseMetadata`)
  - Query/response lifecycle (`loading`, `answer`, `currentResponse`)
  - Question history (`questionHistory`, `currentHistoryIndex`)
  - Quality management (`qualityStatus`, `qualityScore`, `retryCount`)
- Implements three-view state machine: `splash` → `courseSelection` → `mainApp`
- Integrates QueryService singleton for API communication
- Executes periodic health checks (auto-cache management, Lambda warm-up detection)
- Handles follow-up prompt clicks by auto-filling input and submitting

#### **QueryInput.jsx**
- Controlled text input with submit handler
- Loading state management (disables during processing)
- Course-specific placeholder text
- Form validation and submission

#### **ResponseDisplay.tsx** (Primary Renderer)
- TypeScript component for structured JSON rendering
- Maps `response.data.strategicThinkingLens` → Strategic Thinking Lens section
- Maps `response.data.followUpPrompts[]` → Clickable numbered list with `onPromptClick` handler
- Maps `response.data.conceptsToolsPractice[]` → Term-definition pairs with bracket styling
- Implements paragraph rendering with multi-line text normalization
- Handles both object and string formats for concepts (defensive parsing)

#### **AnswerCard.jsx** (Legacy Renderer)
- Markdown rendering using ReactMarkdown
- Handles rejection responses (`status: "rejected"`)
- Deduplicates concepts and prompts
- Splits multi-question strings into individual prompts
- Provides click handlers for follow-up prompts with GA4 logging

#### **QuestionHistory.jsx**
- Displays last 5 queries with timestamps
- Loads cached responses from history without re-querying backend
- Visual indicators for current vs. historical queries
- Copy-to-clipboard functionality with keyboard shortcut support

#### **QualityIndicator.tsx**
- Displays quality score (0-100) with color-coded status
- Shows retry button for low-quality responses (score < 50)
- Integrates with QueryService quality thresholds

#### **Homepage.jsx**
- Marketing content with mission, vision, and product explanation
- Pre-warms Lambda function on load (`QueryService.preWarmLambda()`)
- Links to `/labs` in new tab
- Scroll-to-section navigation for "Example in Action" demo

#### **CourseSelector.jsx**
- Course card UI for course selection
- Fetches course metadata from backend (`/api/course/{courseId}`)
- Displays course title, tagline, and description

### Reusable Utilities and Hooks

#### **QueryService.ts** (Singleton Service)
- Centralized API communication layer
- Query caching (Map-based in-memory cache, max 100 items)
- Lambda warm-up management with proactive re-warming
- Quality analysis integration (`analyzeResponseQuality`, `getQualityScore`)
- Automatic cache health monitoring (consecutive failure tracking)
- Auto-retry logic for responses below quality threshold (50/100)
- Estimated processing time calculation based on warm-up state

#### **qualityAnalyzer.ts**
- `analyzeResponseQuality()`: Returns 'high' | 'consistent' | 'low' based on:
  - Strategic lens word count (80-150 optimal)
  - Actionable prompts (2+ minimum, 4+ excellent)
  - Relevant concepts (2+ minimum, 4+ excellent)
- `getQualityScore()`: Returns 0-100 score weighted:
  - 40% strategic lens quality (word count)
  - 30% follow-up prompts quality (count + length)
  - 30% concepts/tools quality (count)

#### **api.js** (API Client)
- Validates `VITE_API_URL` contains Lambda Function URL
- Enforces CORS configuration checks
- Provides `health()`, `loadCourseUIConfig()`, `processQuery()` methods
- Normalizes backend responses (handles both object and string formats)
- Exposes `window.engentLabsApi` for diagnostic tools

#### **analytics.js**
- Google Analytics 4 (GA4) event logging:
  - `logQuerySubmitted()` - Student submits query
  - `logFollowupClicked(promptText)` - Follow-up prompt clicked
  - `logHistoryQueryLoaded(queryText)` - Historical query loaded
  - `logQueryRetried()` - Quality retry triggered
  - `logConceptClicked(conceptTerm)` - Concept card interaction (future)

---

## 3. Data Flow and Rendering Logic

### Request-Response Cycle
```
User Input → QueryInput → LabsApp.handleSubmit() 
  ↓
QueryService.query(query, courseId)
  ↓ (checks cache first)
QueryService.makeQuery() → POST /query
  ↓
Backend Lambda Response (JSON)
  ↓
Quality Analysis (analyzeResponseQuality, getQualityScore)
  ↓ (if score < 50)
Auto-Retry (single retry, no multi-retry loops)
  ↓
Response Normalization (handle string/object formats)
  ↓
State Update (setAnswer, setCurrentResponse, setQualityStatus)
  ↓
ResponseDisplay Rendering (3 sections)
  ↓
Add to History (questionHistory with full response cached)
```

### JSON Field Mapping to UI

#### Backend Response Format
```json
{
  "data": {
    "answer": "Full markdown text (for history/debug)",
    "strategicThinkingLens": "80-150 word strategic narrative",
    "followUpPrompts": ["Question 1?", "Question 2?", "Question 3?"],
    "conceptsToolsPractice": [
      {"term": "Eisenhower Matrix", "definition": "Framework for..."},
      {"term": "Time Blocking", "definition": "Technique for..."}
    ]
  },
  "status": "success",
  "version": "V1.6.6.6",
  "timestamp": "2025-01-22T18:30:00Z"
}
```

#### UI Rendering
- **Section 1 (Strategic Thinking Lens):** Renders `data.strategicThinkingLens` as paragraph text with clean typography
- **Section 2 (Follow-up Prompts):** Renders `data.followUpPrompts[]` as `<ol>` numbered list with click handlers
- **Section 3 (Concepts & Tools):** Renders `data.conceptsToolsPractice[]` as term-definition pairs with bracket styling

### Defensive Parsing and Normalization
The frontend implements multi-format parsing to handle backend inconsistencies:
- **Prompts:** Accepts arrays or newline-delimited strings, splits multi-question items, deduplicates
- **Concepts:** Accepts object arrays `{term, definition}` or string arrays `"Term: Definition"`, normalizes to objects
- **Strategic Lens:** Accepts string or extracts from combined markdown if needed

### Memoization and Performance
- React component memoization not currently implemented (planned for V1.7+)
- Query responses cached in QueryService Map (LRU-style auto-eviction at 100 items)
- Historical queries stored with full response objects for instant re-rendering
- Lazy loading not implemented (all sections render immediately)

### Async Handling
- Loading states managed via `loading` boolean (disables input, shows skeleton)
- Query timeouts at 30 seconds (configurable in QueryService)
- Error boundaries not implemented (handled via try-catch in handleSubmit)
- Lambda warm-up status displayed to users during cold starts

---

## 4. State Management and API Integration

### State Architecture
**Pattern:** Local React state (`useState`) with single source of truth in `LabsApp` component.

**Key State Variables:**
- `answer` (object): Current response structured as `{strategicThinkingLens, followUpPrompts, conceptsToolsPractice}`
- `currentResponse` (QueryResponse): Full backend response for quality analysis
- `questionHistory` (array): Last 5 queries with full responses for instant replay
- `qualityStatus` ('loading' | 'low' | 'high' | 'consistent'): Quality state
- `qualityScore` (number): 0-100 score from quality analyzer
- `retryCount` (number): Retry attempts (max 2)
- `selectedCourseId` (string): Current course selection
- `courseMetadata` (object): Course UI configuration from backend

**No Global State Management:** Redux, Context API, or Zustand not used. All state flows through props and callbacks.

### API Integration Patterns

#### One-API-Call Paradigm
Unlike multi-call designs (separate endpoints for strategic lens, prompts, concepts), Engent Labs uses a **single `/query` endpoint** that returns a unified JSON payload. This reduces:
- Network round-trips (1 call vs. 3+ calls)
- State synchronization complexity
- Race condition risks
- Latency-induced UI jank

#### Query Service Singleton
`QueryService.getInstance()` provides:
- **Centralized caching:** Keyed by `${query}-${courseId}`
- **Lambda warm-up management:** Proactive warm-up on Homepage load, course selection
- **Quality-driven retries:** Auto-retry if response score < 50/100
- **Cache health monitoring:** Tracks consecutive failures, auto-clears at threshold

#### CORS Configuration
- **Production:** Backend Lambda must set `Access-Control-Allow-Origin: https://www.engentlabs.com`
- **Local Development:** Requires browser CORS extension or `--disable-web-security` flag
- **Validation:** Frontend checks if `VITE_API_URL` matches `window.location.host` (warns if misconfigured)

#### Error Handling Strategy
1. **Network Errors:** Display CORS diagnostic guidance (backend contact info)
2. **Rejected Queries:** Show custom rejection message from backend
3. **Quality Failures:** Trigger auto-retry (max 1 retry with PC=1 warm instances)
4. **Cache Corruption:** Auto-clear cache at 15+ consecutive failures

---

## 5. Personalization and Interactivity

### User Session Management
**Current State:** Basic session tracking via browser storage (not persistent across devices).
- Question history stored in component state (lost on page refresh)
- No user accounts or authentication (V1.6.6)
- No server-side session persistence

**Planned (V1.7+):**
- User profiles with saved history across sessions
- Personalized learning paths based on query patterns
- Instructor dashboards with student analytics

### Course-Specific Personalization
- Course metadata (`title`, `placeholder`, `sections_titles`) loaded from backend `/api/course/{courseId}`
- UI adapts placeholder text, section headings, and terminology per course
- Future: Course-specific concept tooltips, glossaries, and reference materials

### Interactive Behaviors

#### Expandable/Clickable Follow-up Prompts
- Each prompt rendered as `<li>` with `onClick` handler
- Clicking auto-fills `QueryInput`, strips numbering, and auto-submits
- GA4 event logged (`followup_prompt_clicked`)
- Visual hover state (color change to blue)

#### Question History Navigation
- Click historical query to instantly load cached response
- No backend call required (full response stored in history)
- "Return to Current" button to restore latest query
- Copy-to-clipboard with Ctrl+C keyboard shortcut

#### Hover Tooltips (Planned V1.7+)
- Concept terms will trigger tooltip overlays with extended definitions
- Backend `tooltip_rules` configuration defines max length
- Instructor-curated tooltip content via backend metadata

#### Editable Glossaries (Planned V1.7+)
- Instructor interface to add/edit concept definitions
- Student interface to add personal notes to concepts
- Synced to backend via `/api/glossary` endpoints

#### Reflection Prompts (Implemented)
- Follow-up prompts serve as reflection triggers
- Clicking prompt initiates new query cycle (iterative learning)
- No "answer extraction" allowed (system always guides to next question)

---

## 6. Design, Accessibility, and Educational Rationale

### Responsive Design Principles

#### Tailwind CSS Grid System
- Mobile-first breakpoints: `sm:`, `md:`, `lg:` modifiers
- Course selector: Single column mobile, 2-column grid desktop
- Response sections: Stacked mobile, side-by-side desktop (planned V1.7+)

#### Typography Scale
- Strategic Lens: `text-base` body text, 1.6 line-height for readability
- Follow-up Prompts: `text-sm` with `list-decimal` numbered list
- Concepts/Tools: `text-sm` with bold term, regular definition
- Headings: `text-2xl` for section titles, `text-3xl` for page headers

#### Spacing and Layout
- Section separation via `<div className="section-separator" />` (1px gray border)
- Card padding: `p-6` (1.5rem) on mobile, `p-8` (2rem) on desktop
- Vertical rhythm: `space-y-6` between sections

### Accessibility Features

#### ARIA Labels (Partial Implementation)
- `aria-label="Back to courses"` on navigation buttons
- `data-testid` attributes for testing (not true ARIA)
- **Gap:** Missing ARIA roles for sections, no `aria-live` regions

#### Keyboard Navigation (Partial)
- Tab navigation through follow-up prompts (native `<li>` focus)
- Enter key on prompts triggers click (native button behavior)
- **Gap:** No keyboard shortcuts for history navigation

#### Color Contrast
- Primary text: `#111827` (gray-900) on `#ffffff` (white) = 19.38:1 (AAA)
- Follow-up prompts: `#2563eb` (blue-600) hover = 4.54:1 (AA)
- **Gap:** No high-contrast mode toggle

#### Screen Reader Support (Planned V1.7+)
- Section headings not wrapped in `<h2>` semantic HTML
- No `alt` text for decorative elements
- No `role="main"` landmark for content area

### Educational Rationale for 3-Section Structure

#### Cognitive Load Theory Alignment
1. **Strategic Lens (Comprehension):** Presents 80-150 words—optimal for working memory capacity (7±2 chunks). Provides schema activation before inquiry.
2. **Follow-up Prompts (Elaboration):** Triggers elaborative rehearsal via questions. Students construct meaning by choosing next inquiry direction.
3. **Concepts/Tools (Consolidation):** Anchors learning in instructor-approved terminology. Supports long-term memory encoding via retrieval practice.

#### Bloom's Taxonomy Progression
- **Strategic Lens:** Understand → Analyze (strategic context models expert analysis)
- **Follow-up Prompts:** Apply → Evaluate (questions guide application and judgment)
- **Concepts/Tools:** Remember → Understand (definitions support foundational knowledge)

#### Anti-Plagiarism Design
- No "copy full answer" button (students must engage with sections)
- Follow-up prompts encourage iterative questioning (not one-shot extraction)
- Strategic lens is conceptual (not directly usable as assignment text)
- History limited to 5 items (discourages stockpiling answers)

---

## 7. Security and Environment Configuration

### Environment Variables
- **`VITE_API_URL`** (required): Lambda Function URL base (e.g., `https://<id>.lambda-url.us-east-2.on.aws`)
- **Production:** Set in S3 deployment script or CloudFront environment injection
- **Development:** Set in `.env.local` (gitignored)

### API Key Handling
**Current State:** No API keys required (Lambda Function URL is public, backend uses rate limiting).

**Future (V1.7+):**
- User authentication via JWT tokens
- API keys issued per instructor/institution
- Rate limiting per user account (not IP-based)

### HTTPS Enforcement
- **Production:** CloudFront enforces HTTPS redirect
- **Development:** Vite dev server uses HTTP (localhost only)
- **Backend:** Lambda Function URL uses HTTPS by default

### Deployment Environments

#### Development (`localhost:5173`)
- Vite dev server with HMR
- CORS requires browser extension or `--disable-web-security`
- `VITE_API_URL` points to Lambda URL (no local backend)

#### Staging (S3 + CloudFront, `staging.engentlabs.com`)
- Pre-production testing environment
- Separate Lambda function with staging backend
- Reduced cache TTL for rapid iteration

#### Production (S3 + CloudFront, `www.engentlabs.com`)
- Cache TTL: 1 hour for static assets, 5 minutes for HTML
- CloudFront invalidation on every deployment
- Lambda Function URL with PC=1 (always warm, no cold starts)

### Rate Limiting and Authentication Hooks (Planned V1.7+)
- Frontend will send JWT token in `Authorization` header
- Backend validates token and enforces per-user rate limits
- Graceful degradation if auth fails (guest mode with restricted features)

---

## 8. Distinctive or Patent-Relevant Features

### 8.1 Structured Three-Section Educational Layout

**Technical Description:**  
The frontend enforces a **rigid three-section rendering pipeline** that maps backend JSON fields (`strategicThinkingLens`, `followUpPrompts`, `conceptsToolsPractice`) to visually distinct UI regions in sequential order. Unlike generic chat interfaces with unstructured markdown, this system uses:
- Field-to-component binding (each JSON field has a dedicated React component)
- Quality-gated rendering (responses below 50/100 score trigger auto-retry before display)
- Section-specific interaction patterns (prompts clickable, lens read-only, concepts hoverable)

**Educational Benefit:**  
Mirrors established pedagogical frameworks (Bloom's Taxonomy, Cognitive Load Theory) by guiding students through comprehension → inquiry → knowledge consolidation. Prevents "answer extraction" behavior by structuring AI outputs as learning scaffolds rather than final deliverables.

**Why It Might Be Unique:**  
Most AI educational tools present unstructured conversational outputs. This system implements a **constrained rendering architecture** that transforms AI responses into a standardized learning sequence. The coupling of backend JSON schema validation with frontend section-locked rendering creates a "pedagogical API contract" that ensures all AI outputs follow instructor-approved learning patterns.

---

### 8.2 Dynamic Follow-up Prompt Generation and Click-to-Query System

**Technical Description:**  
The frontend renders `followUpPrompts[]` as clickable `<li>` elements with `onClick` handlers that:
1. Auto-fill the query input field with the prompt text
2. Strip leading numbers (e.g., "1. ", "2. ") from the prompt
3. Automatically submit the query (bypass manual submission)
4. Log the event to GA4 (`followup_prompt_clicked`)

The backend generates prompts using course-specific templates and instructor-defined question patterns. The frontend ensures prompts are deuplicated, split into single questions (if multi-question strings), and normalized to 20+ characters.

**Educational Benefit:**  
Encourages **iterative inquiry** rather than one-shot question-asking. Students are guided to explore concepts from multiple angles by clicking AI-suggested questions. This transforms passive consumption into active exploration, building metacognitive questioning skills.

**Why It Might Be Unique:**  
Unlike static "related questions" in search engines or simple "follow-up" suggestions in ChatGPT, this system:
- Generates questions **contextualized to the student's original query** via backend logic
- Enforces a **single-click submission flow** (no copy-paste friction)
- Tracks engagement patterns via GA4 for instructor analytics
- **Prevents answer extraction** by making follow-up inquiry the primary interaction mode

The combination of backend context-aware generation + frontend single-click submission creates a **guided inquiry loop** that systematically deepens student reasoning.

---

### 8.3 Quality-Gated Rendering with Automatic Retry Logic

**Technical Description:**  
The frontend integrates a **multi-factor quality scoring system** (`qualityAnalyzer.ts`) that evaluates backend responses on:
- Strategic lens word count (40% weight, optimal 80-150 words)
- Follow-up prompt count and length (30% weight, optimal 3-4 prompts >20 chars)
- Concept count (30% weight, optimal 3-4 concepts)

If a response scores below 50/100, the QueryService automatically retries the query **once** before rendering. With Lambda PC=1 (always warm), retries avoid cold-start penalties.

**Educational Benefit:**  
Ensures students receive **consistently high-quality responses** aligned with instructor standards. Prevents exposure to incomplete or poorly structured AI outputs that could confuse learners or provide inadequate pedagogical scaffolding.

**Why It Might Be Unique:**  
Most AI educational tools display whatever the model generates. This system implements a **quality firewall** that:
- Analyzes responses **before rendering** (not post-hoc flagging)
- Automatically retries low-quality responses (no user intervention)
- Uses **course-specific quality thresholds** (configurable per instructor)
- Provides **transparent quality metrics** to students (score displayed, retry count shown)

The quality-gating architecture creates a **reliability contract** between the AI system and the educational institution—only pedagogically sound outputs reach students.

---

### 8.4 Concept-Card Dynamic Glossary with Instructor-Curated Definitions

**Technical Description:**  
The frontend renders `conceptsToolsPractice[]` as term-definition pairs with:
- Bracket styling for visual separation (`concepts-bracket`, `concepts-term`, `concepts-def` CSS classes)
- Deduplication logic to prevent repeated concepts in a single response
- Normalization to handle both object arrays `{term, definition}` and string arrays `"Term: Definition"`

Backend concepts are drawn from **instructor-curated glossaries** stored in course metadata, ensuring definitions align with course materials rather than generic AI knowledge.

**Educational Benefit:**  
Reinforces **course-specific vocabulary** and frameworks. Students see concepts defined using the exact language and examples their instructor uses, creating coherence between AI tutoring and classroom instruction.

**Why It Might Be Unique:**  
Unlike generic AI tools that provide definitions from training data, this system:
- Uses **instructor-approved concept libraries** (backend glossary system)
- Ensures **terminological consistency** across all AI responses
- Allows **instructor editing** of definitions via backend metadata
- Plans **student-personalized glossaries** where learners add notes (V1.7+)

The combination of instructor control + student personalization creates a **hybrid knowledge base** that bridges AI-generated content with human pedagogical expertise.

---

### 8.5 Question History with Instant Response Replay (No Re-Query)

**Technical Description:**  
The frontend caches the **full backend response object** for each query in `questionHistory[]` (last 5 queries). Clicking a historical query:
1. Instantly loads the cached response (no backend call)
2. Restores the exact UI state (strategic lens, prompts, concepts)
3. Preserves quality metrics (score, status)

This differs from chat-style history that requires re-rendering from raw text logs.

**Educational Benefit:**  
Allows students to **revisit previous learning moments** without friction. Supports spaced repetition and concept review by making historical queries instantly accessible.

**Why It Might Be Unique:**  
Most AI chat tools either:
- Store only query text (require re-submission for context)
- Store conversation logs as flat text (no structured sections)

This system stores **structured response objects** with quality metadata, enabling:
- **Instant replay** with zero latency
- **Quality comparison** across queries (students see which questions yield better responses)
- **Engagement analytics** (backend can track historical query re-visits via GA4)

---

### 8.6 Lambda Pre-Warming System with Proactive Health Monitoring

**Technical Description:**  
The frontend implements a **multi-stage Lambda warm-up pipeline**:
1. **Homepage Load:** Triggers `QueryService.preWarmLambda()` in background
2. **Course Selection:** Triggers stronger warm-up with test query
3. **Periodic Health Checks:** Every 2 minutes, checks cache stats and Lambda warm-up status

If system "cools down" (detected via quality degradation), frontend **proactively re-warms** Lambda before next user query.

**Educational Benefit:**  
Eliminates cold-start delays (15-20s → 10-15s) that frustrate students and break learning flow. Ensures **consistent response times** regardless of usage patterns.

**Why It Might Be Unique:**  
Most serverless apps warm up on first user request. This system:
- Warms up **before users ask questions** (Homepage pre-warming)
- **Detects cooling** via quality metrics (not just uptime pings)
- **Auto-re-warms** proactively (no admin intervention)
- **Displays warm-up status** to users (transparent about processing time)

The predictive warm-up architecture creates a **perceived-instant AI** experience even on serverless infrastructure with inherent cold-start latency.

---

### 8.7 Yin & Yang Cartoon Overlays for Conceptual Visualization (Planned V1.7+)

**Technical Description:**  
Future releases will integrate **animated conceptual diagrams** (e.g., Yin-Yang symbols for balance/trade-offs, flowcharts for decision trees) that overlay on strategic lens sections. The backend will include `visual_cues` metadata in responses, and the frontend will render React components dynamically based on cue types.

**Educational Benefit:**  
Supports **visual learners** and reinforces abstract concepts through imagery. For example, a question about "balancing quality vs. speed" could trigger a Yin-Yang overlay showing the trade-off visually.

**Why It Might Be Unique:**  
No known AI educational tool dynamically generates **conceptual diagrams** based on query content. This would combine:
- **Backend semantic analysis** (detecting conceptual patterns like "trade-off", "process", "hierarchy")
- **Frontend component library** (reusable visual elements)
- **Instructor customization** (ability to define which concepts get visuals)

---

### 8.8 Teacher Editing Interface with Domain Logic Integration (Planned V1.7+)

**Technical Description:**  
Instructors will access a `/teacher` route where they can:
- View all student queries and AI responses
- Edit concept definitions, strategic lens templates, follow-up prompts
- Set quality thresholds (e.g., minimum word counts, required concepts)
- Configure course-specific rejection rules (off-topic detection)

Edits are synced to backend metadata and immediately affect all new responses.

**Educational Benefit:**  
Empowers instructors to **shape AI behavior** without coding. Ensures AI tutoring aligns with evolving course content and instructor preferences.

**Why It Might Be Unique:**  
Most AI educational tools are black boxes. This system provides:
- **Real-time editing** of AI prompt templates and glossaries
- **Course-specific customization** (not one-size-fits-all AI)
- **Instructor analytics dashboard** (see which concepts students struggle with)
- **Pedagogical control** without requiring AI/ML expertise

---

## 9. Future Enhancements (V1.6.6+ Roadmap)

### Teacher Tools and Instructor Dashboard
- **Query Analytics:** Heatmaps of most-asked questions, concept frequency
- **Student Progress Tracking:** Individual student query history, quality trends
- **Custom Prompt Templates:** Instructor-defined strategic lens templates per topic
- **Rejection Rule Configuration:** Define off-topic keywords, allowed question types

### Personalization Dashboard
- **Student Profiles:** Persistent login with cross-device history
- **Learning Paths:** AI-recommended follow-up topics based on query patterns
- **Saved Concepts:** Personal glossary with student-added notes
- **Achievement Badges:** Gamification for iterative inquiry behavior

### Enhanced Concept-Card Rendering
- **Hover Tooltips:** Extended definitions with examples (backend-curated)
- **Expandable Cards:** Click to reveal case studies, diagrams, references
- **Concept Graphs:** Visual network of related concepts (D3.js visualization)
- **Instructor Media:** Embed videos, slides, or readings within concept cards

### Adaptive Learning Analytics
- **Quality Prediction:** Predict if a query will yield high-quality response before submission
- **Personalized Quality Thresholds:** Adjust retry logic per student skill level
- **Real-Time Feedback:** Show students how to improve questions for better responses
- **Comparative Analytics:** Students see how their queries compare to peers (anonymized)

### Accessibility Improvements
- **High-Contrast Mode:** Toggle between default and WCAG AAA contrast themes
- **Screen Reader Optimization:** Full ARIA labels, semantic HTML, live regions
- **Keyboard Shortcuts:** Navigate history, submit queries, expand sections via keyboard
- **Font Size Controls:** User-adjustable text scaling

### Collaborative Learning Features (V2.0+)
- **Shared Queries:** Students share questions and responses with classmates
- **Instructor Annotations:** Teachers add comments to student queries
- **Peer Review:** Students critique each other's strategic lens interpretations
- **Synchronous Q&A Sessions:** Live instructor-led AI tutoring sessions

---

## 10. Summary Table of Potentially Protectable Features

| Feature Name | Function/Technical Description | Educational Benefit | Why It Might Be Unique or Non-Obvious |
|--------------|-------------------------------|-------------------|--------------------------------------|
| **Structured Three-Section Rendering Pipeline** | Enforces rigid JSON-to-UI mapping with quality gates. Backend fields (`strategicThinkingLens`, `followUpPrompts`, `conceptsToolsPractice`) bind to dedicated React components in sequential order. | Mirrors Bloom's Taxonomy and Cognitive Load Theory. Prevents answer extraction by structuring AI as learning scaffold. | Most AI tools use unstructured chat UIs. This system implements a pedagogical API contract that ensures AI outputs follow instructor-approved learning patterns. Field-specific interaction rules (clickable prompts, read-only lens) enforce scaffolding. |
| **Dynamic Follow-up Prompt Click-to-Query System** | Renders AI-generated questions as clickable list items. Click auto-fills input, strips numbering, submits query, and logs to GA4. Backend generates prompts via course-specific templates. | Encourages iterative inquiry over one-shot extraction. Builds metacognitive questioning skills by guiding multi-angle exploration. | Unlike static "related questions" or generic follow-ups, this system: (1) generates contextualized questions via backend logic, (2) enforces single-click submission (no friction), (3) tracks engagement for analytics, (4) prevents answer extraction by making inquiry the primary mode. |
| **Quality-Gated Rendering with Auto-Retry** | Multi-factor scoring system (40% lens words, 30% prompts, 30% concepts). Scores <50/100 trigger automatic single retry before rendering. Uses Lambda PC=1 to avoid cold-start penalties. | Ensures consistent high-quality responses aligned with instructor standards. Prevents exposure to incomplete/confusing AI outputs. | Most AI tools display raw model outputs. This implements a quality firewall that: (1) analyzes before rendering (not post-hoc), (2) auto-retries without user action, (3) uses course-specific thresholds, (4) shows transparent metrics (score, retry count). Creates reliability contract with institutions. |
| **Concept-Card Dynamic Glossary with Instructor Curation** | Renders `conceptsToolsPractice[]` with bracket styling, deduplication, and normalization (handles objects or strings). Backend draws from instructor-curated glossaries, not generic AI knowledge. | Reinforces course-specific vocabulary and frameworks. Ensures terminological consistency between AI tutoring and classroom instruction. | Unlike generic AI definitions, this: (1) uses instructor-approved libraries, (2) ensures consistent terminology, (3) allows instructor editing via metadata, (4) plans student-personalized notes (V1.7+). Hybrid knowledge base bridges AI + human pedagogy. |
| **Question History with Instant Response Replay** | Caches full backend response objects (last 5 queries). Clicking historical query instantly loads cached response with quality metrics—no backend call. | Supports spaced repetition and concept review. Frictionless revisiting of previous learning moments. | Most AI chats either: (1) store only query text (require re-submission), or (2) store flat logs. This stores structured response objects, enabling: instant replay (zero latency), quality comparison, engagement analytics (track re-visits). |
| **Lambda Pre-Warming with Proactive Health Monitoring** | Multi-stage warm-up: Homepage load triggers background warm-up, course selection triggers test query, periodic health checks every 2 minutes. Detects "cooling" via quality degradation, proactively re-warms. | Eliminates cold-start delays (15-20s → 10-15s). Ensures consistent response times for uninterrupted learning flow. | Most serverless apps warm on first request. This: (1) warms before user queries (Homepage pre-warm), (2) detects cooling via quality metrics (not uptime), (3) auto-re-warms proactively, (4) displays warm-up status transparently. Predictive warm-up creates perceived-instant AI on serverless. |
| **Yin & Yang Conceptual Overlays (Planned V1.7+)** | Backend includes `visual_cues` metadata in responses. Frontend dynamically renders React components (Yin-Yang for balance, flowcharts for processes) based on cue types. | Supports visual learners. Reinforces abstract concepts through imagery (e.g., "quality vs. speed" triggers Yin-Yang trade-off diagram). | No known AI educational tool dynamically generates conceptual diagrams based on query semantics. Combines: (1) backend semantic analysis (detect "trade-off", "process"), (2) frontend component library (reusable visuals), (3) instructor customization (define which concepts get visuals). |
| **Teacher Editing Interface with Domain Logic (Planned V1.7+)** | `/teacher` route allows instructors to view student queries, edit concept definitions, strategic lens templates, prompts, set quality thresholds, configure rejection rules. Synced to backend, immediately affects new responses. | Empowers instructors to shape AI behavior without coding. Aligns AI tutoring with evolving course content and instructor preferences. | Most AI tools are black boxes. This provides: (1) real-time editing of prompt templates/glossaries, (2) course-specific customization (not one-size-fits-all), (3) instructor analytics (see student struggles), (4) pedagogical control without AI/ML expertise. |
| **One-API-Call Paradigm with Unified JSON Payload** | Single `/query` endpoint returns unified JSON with all sections (`strategicThinkingLens`, `followUpPrompts`, `conceptsToolsPractice`). Reduces network calls from 3+ to 1, eliminates race conditions and state sync complexity. | Faster response delivery (lower latency). Simpler UI logic (single loading state). More reliable (no partial response failures). | Most educational AI tools use multi-call designs (separate endpoints for analysis, questions, definitions). This unified approach: (1) reduces round-trips, (2) ensures atomic responses (all-or-nothing), (3) simplifies caching (single cache key), (4) enables quality analysis on complete payload before rendering. |
| **GA4 Engagement Analytics with Event-Specific Tracking** | Logs `query_submitted`, `followup_prompt_clicked`, `history_query_loaded`, `query_retried`, `concept_clicked` to Google Analytics 4. Provides detailed engagement funnel (submission → follow-up clicks → concept exploration). | Instructors see which concepts drive inquiry, which prompts engage students, quality retry frequency. Informs curriculum design and AI tuning. | Most AI tools log basic usage metrics. This tracks educational engagement patterns: (1) prompt click text (see which questions resonate), (2) retry behavior (quality issues), (3) history revisits (spaced repetition), (4) concept interactions (knowledge consolidation). Enables data-driven pedagogy. |

---

## Technical Implementation Notes

### Dependencies and Technology Stack
- **React 19.1.0:** Core UI framework
- **React Router 7.8.2:** Client-side routing
- **TypeScript 5.8.3:** Type safety for service layer and quality management
- **Vite 7.0.4:** Build tool and dev server
- **Tailwind CSS 3.4.17:** Utility-first styling
- **ReactMarkdown 10.1.0:** Markdown rendering for legacy responses
- **Axios 1.11.0:** HTTP client (legacy, mostly unused in favor of fetch)
- **Google Analytics 4:** User engagement analytics
- **Playwright 1.54.1:** End-to-end testing framework

### Build and Deployment
- **Build Command:** `npm run build` (Vite bundler outputs to `/dist`)
- **Deployment Target:** AWS S3 + CloudFront
- **Deployment Script:** `scripts/deploy-engentlabs-final.ps1` (Windows) or `scripts/deploy-engentlabs.sh` (Linux)
- **Invalidation:** CloudFront cache invalidated on every deployment (paths: `/`, `/index.html`, `/labs`)
- **Environment Variables:** Set via S3 bucket or CloudFront function (not built into bundle)

### Code Quality and Testing
- **Linting:** ESLint 9.30.1 with React hooks plugin
- **Type Checking:** TypeScript strict mode on service layer
- **Unit Tests:** Vitest 3.2.4 (planned, not currently implemented)
- **E2E Tests:** Playwright (smoke tests for core flows)
- **Code Coverage:** Not currently tracked (planned for V1.7+)

### Performance Metrics
- **Lighthouse Score (Production):** 95+ (Performance), 100 (Accessibility goal not met—current 88)
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s (with Lambda pre-warmed)
- **Total Bundle Size:** ~450 KB (gzipped)
- **API Response Time:** 10-15s (warm Lambda), 15-20s (cold start)

---

## Conclusion

The Engent Labs V1.6.6 frontend implements a **pedagogically-constrained AI interface** that transforms unstructured LLM outputs into structured learning sequences. By enforcing a three-section rendering pipeline, quality-gated auto-retry, and click-to-query follow-up prompts, the system shifts student behavior from passive answer extraction to active inquiry cycles. The architecture's distinctive features—particularly the unified JSON API contract, instructor-curated concept glossaries, and proactive Lambda warm-up—create a **reliable, course-aligned, and ethically responsible AI tutoring platform** that complements rather than replaces human instruction.

This memo serves as both engineering documentation for ongoing development and a technical foundation for potential patent evaluation, highlighting the non-obvious innovations that differentiate Engent Labs from generic AI chat interfaces and other educational AI tools.

---

**Document Version:** 1.0  
**Next Review Date:** Q2 2025 (Post-V1.7 Teacher Tools Launch)


