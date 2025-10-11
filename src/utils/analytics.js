/**
 * Google Analytics 4 utility functions for Engent Labs
 * Measurement ID: G-4GZVMHT9M6
 */

/**
 * Log when a user submits a query
 */
export const logQuerySubmitted = () => {
  if (window.gtag) {
    window.gtag('event', 'query_submitted', {
      page: window.location.pathname,
      method: 'student_input'
    });
    console.log('📊 GA4: Query submitted event logged');
  }
};

/**
 * Log when a user clicks a follow-up prompt
 * @param {string} promptText - The text of the follow-up prompt that was clicked
 */
export const logFollowupClicked = (promptText) => {
  if (window.gtag) {
    window.gtag('event', 'followup_prompt_clicked', {
      page: window.location.pathname,
      prompt_text: promptText
    });
    console.log('📊 GA4: Follow-up prompt clicked event logged:', promptText);
  }
};

/**
 * Log when a user clicks a concept card (for future use)
 * @param {string} conceptTerm - The concept term that was clicked
 */
export const logConceptClicked = (conceptTerm) => {
  if (window.gtag) {
    window.gtag('event', 'concept_clicked', {
      page: window.location.pathname,
      concept_term: conceptTerm
    });
    console.log('📊 GA4: Concept clicked event logged:', conceptTerm);
  }
};

/**
 * Log when a user loads a query from history
 * @param {string} queryText - The query text that was loaded from history
 */
export const logHistoryQueryLoaded = (queryText) => {
  if (window.gtag) {
    window.gtag('event', 'history_query_loaded', {
      page: window.location.pathname,
      query_text: queryText
    });
    console.log('📊 GA4: History query loaded event logged:', queryText);
  }
};

/**
 * Log when a user copies history to clipboard
 */
export const logHistoryCopied = () => {
  if (window.gtag) {
    window.gtag('event', 'history_copied', {
      page: window.location.pathname,
      method: 'keyboard_shortcut'
    });
    console.log('📊 GA4: History copied event logged');
  }
};

/**
 * Log when a user retries a query for better quality
 */
export const logQueryRetried = () => {
  if (window.gtag) {
    window.gtag('event', 'query_retried', {
      page: window.location.pathname,
      reason: 'quality_improvement'
    });
    console.log('📊 GA4: Query retried event logged');
  }
};

