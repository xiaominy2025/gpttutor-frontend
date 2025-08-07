# ThinkPal Frontend–Backend API Requirements

## Overview
To ensure the ThinkPal Decision Coach frontend renders correctly and all automated UI tests pass, the backend must return a consistent, structured response for **every query**.

---

## API Endpoint
**POST** `/query`

### Request Example
```json
{
  "query": "How should I prioritize tasks when under tight deadlines?"
}
```

---

## Required API Response Structure

```json
{
  "status": "success",
  "data": {
    "answer": "...",  // markdown answer (all sections)
    "query": "...",
    "timestamp": "...",
    "model": "gpt-3.5-turbo",
    "processing_time": 2.3,
    "conceptsToolsPractice": [
      { "term": "Decision Tree", "definition": "A visual tool that maps out different options and their potential outcomes." },
      { "term": "SWOT Analysis", "definition": "A framework that helps identify strengths, weaknesses, opportunities, and threats." }
    ]
  }
}
```

### Field Requirements
- `conceptsToolsPractice` **must always be an array of objects**.
- Each object **must have**:
  - `term` (string): The concept/tool/practice name.
  - `definition` (string): A one-sentence definition or explanation.
- **No HTML, tooltip spans, or plain strings** in this array—only objects as shown above.
- The `answer` field should contain the full markdown-formatted answer for the main response area (all four sections).

---

## Example Concepts Section Rendering (Frontend)
```
Concepts/Tools/Practice Reference
--------------------------------
Decision Tree: A visual tool that maps out different options and their potential outcomes.
SWOT Analysis: A framework that helps identify strengths, weaknesses, opportunities, and threats.
```

---

## Consistency is Critical
- **Every query** must return the new structured format for `conceptsToolsPractice`.
- If any query returns an empty array, missing field, or a string instead of an object, the UI and tests will fail.
- No tooltip or hover logic is needed or supported in the frontend.

---

## Recent UI/Integration Test Results & Troubleshooting

### What We Observed
- For several test queries, the UI showed empty sections ("No ... available") and/or "No concepts or tools found for this query." in the Concepts section.
- The browser console logs showed that the backend response was present, but:
  - `data.answer` was empty or missing required markdown sections.
  - `data.conceptsToolsPractice` was empty or contained fallback/legacy data.

### What the Backend Must Guarantee
- For **every query** (including all test queries), the backend must return:
  - A non-empty `answer` field with all four markdown sections:
    - `**Strategic Thinking Lens**`
    - `**Story in Action**`
    - `**Reflection Prompts**`
    - `**Concepts/Tools/Practice Reference**`
  - A `conceptsToolsPractice` array of `{ term, definition }` objects (or an empty array if truly no concepts apply).
- No fallback HTML, tooltip spans, or plain strings in any field.
- If a section is not applicable, still include the section header in the markdown and return an empty array for concepts.

### How to Debug
- For each failing query, inspect the full backend JSON response in the browser console (the frontend logs it for every query).
- Confirm:
  - Is `data.answer` present and does it contain all four sections?
  - Is `data.conceptsToolsPractice` an array of objects, or is it empty?
- If either is missing or empty, the backend must be updated for that query.

### Sample Correct Response
```json
{
  "status": "success",
  "data": {
    "answer": "**Strategic Thinking Lens**\n...markdown...\n\n**Story in Action**\n...markdown...\n\n**Reflection Prompts**\n- ...\n\n**Concepts/Tools/Practice Reference**\n",
    "conceptsToolsPractice": [
      { "term": "Decision Tree", "definition": "A visual tool that maps out different options and their potential outcomes." }
    ]
  }
}
```

---

## Troubleshooting for Backend Developers
- If Playwright/UI tests fail with timeouts or missing content, check that the response for **every query** matches the required structure above.
- Use the browser console to inspect the full backend response (the frontend logs it for every query).
- If you see a user-facing error or blank UI, the backend response is likely missing required fields or is malformed.
- All test queries (not just manual ones) must be supported with the new format.

---

## Contact
For questions or further integration help, contact the frontend team or your AI assistant. 