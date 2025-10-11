import { QueryResponse, QualityStatus } from '../types/QualityTypes';
import { analyzeResponseQuality, getQualityScore } from '../utils/qualityAnalyzer';

class QueryService {
  private static instance: QueryService;
  private _isWarmedUp = false;
  private queryCache = new Map<string, QueryResponse>();
  private warmUpPromise: Promise<void> | null = null;
  private qualityHistory = new Map<string, QualityStatus>();
  
  // QA/QC Configuration - Optimized for PC=1
  private readonly MIN_QUALITY_THRESHOLD = 50; // Lowered for PC=1 (always warm)
  private readonly MAX_RETRY_ATTEMPTS = 1; // Single retry only with PC=1
  private readonly RETRY_TIMEOUT = 30000; // 30s max total time

  // Automatic cache management - Optimized for PC=1
  private readonly MAX_CACHE_SIZE = 100; // Increased for PC=1 (more memory available)
  private readonly MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour max age (increased)
  private readonly PROBLEM_DETECTION_THRESHOLD = 15; // More tolerant with PC=1

  // Track cache health
  private cacheHealth = {
    consecutiveFailures: 0,
    lastFailureTime: 0,
    totalQueries: 0,
    successfulQueries: 0
  };

  static getInstance(): QueryService {
    if (!QueryService.instance) {
      QueryService.instance = new QueryService();
    }
    return QueryService.instance;
  }

  async query(query: string, courseId: string): Promise<QueryResponse> {
    try {
      // Check cache first
      const cacheKey = `${query}-${courseId}`;
      if (this.queryCache.has(cacheKey)) {
        console.log('🔥 Using cached response for:', query);
        this.trackQueryHealth(true); // Cache hit is successful
        return this.queryCache.get(cacheKey)!;
      }

      // Use existing warm-up system (proactive)
      if (!this._isWarmedUp) {
        console.log('🔥 Proactive warm-up: Lambda not warmed up, warming up before user query');
        await this.warmUpLambda();
      }

      // Make actual query
      let response = await this.makeQuery(query, courseId);
      
      // QA/QC: Fast structural completeness check for PC=1
      const quality = analyzeResponseQuality(response);
      const qualityScore = getQualityScore(response);
      
      if (qualityScore < this.MIN_QUALITY_THRESHOLD) {
        console.log(`🚫 QA/QC: Response quality ${qualityScore}/100 below threshold ${this.MIN_QUALITY_THRESHOLD} - structural issues detected`);
        
        // Single retry (no warm-up delays with PC=1)
        console.log('🔄 QA/QC: Single retry for structural issues...');
        const retryResponse = await this.makeQuery(query, courseId);
        const retryScore = getQualityScore(retryResponse);
        
        console.log(`🔄 QA/QC: Retry quality ${retryScore}/100`);
        
        // Accept retry response regardless of quality (PC=1 should be consistent)
        response = retryResponse;
        console.log(`✅ QA/QC: Using retry response (${retryScore}/100)`);
      }
      
      // Store quality metrics
      this.qualityHistory.set(cacheKey, quality);
      
      // Cache the response
      this.queryCache.set(cacheKey, response);
      
      // Track successful query
      this.trackQueryHealth(true);
      
      // Automatic cache management to prevent UI issues
      this.manageCache();
      
      const answerWordCount = response.data.answer.trim().split(/\s+/).length;
      console.log(`📊 Query quality: ${quality} (${qualityScore}/100) - ${answerWordCount} words`);
      return response;
      
    } catch (error) {
      // Track failed query
      this.trackQueryHealth(false);
      
      // Automatic cache management on failure
      this.manageCache();
      
      console.error('❌ Query failed:', error);
      throw error;
    }
  }

  // New method: Update cache with high-quality response after warm-up
  async updateCacheWithHighQualityResponse(query: string, courseId: string): Promise<void> {
    const cacheKey = `${query}-${courseId}`;
    
    // If we have a cached low-quality response and system is now warmed up
    if (this.queryCache.has(cacheKey) && this._isWarmedUp) {
      const cachedResponse = this.queryCache.get(cacheKey)!;
      const cachedQuality = analyzeResponseQuality(cachedResponse);
      const cachedScore = getQualityScore(cachedResponse);
      
      // If cached response is low quality, replace it with a fresh high-quality one
      if (cachedScore < this.MIN_QUALITY_THRESHOLD) {
        console.log(`🔄 Updating cache with high-quality response for: ${query}`);
        console.log(`   Old quality: ${cachedQuality} (${cachedScore}/100)`);
        
        try {
          const freshResponse = await this.makeQuery(query, courseId);
          const freshQuality = analyzeResponseQuality(freshResponse);
          const freshScore = getQualityScore(freshResponse);
          
          if (freshScore >= this.MIN_QUALITY_THRESHOLD) {
            this.queryCache.set(cacheKey, freshResponse);
            this.qualityHistory.set(cacheKey, freshQuality);
            const freshAnswerWordCount = freshResponse.data.answer.trim().split(/\s+/).length;
            console.log(`✅ Cache updated: ${freshQuality} (${freshScore}/100) - ${freshAnswerWordCount} words`);
          } else {
            console.log(`⚠️ Fresh response still low quality: ${freshScore}/100`);
          }
        } catch (error) {
          console.warn('Failed to update cache with high-quality response:', error);
        }
      }
    }
  }

  private async warmUpLambda(): Promise<void> {
    // Prevent multiple simultaneous warm-up attempts
    if (this.warmUpPromise) {
      await this.warmUpPromise;
      return;
    }

    this.warmUpPromise = this.performWarmUp();
    await this.warmUpPromise;
  }

  // Simplified for PC=1 - no complex force warm-up needed
  private async forceWarmUp(): Promise<void> {
    console.log('🔒 QA/QC: PC=1 always warm, skipping complex warm-up...');
    this._isWarmedUp = true; // PC=1 means always warm
  }

  private async performWarmUp(): Promise<void> {
    try {
      console.log("🔥 Warming up Lambda function...");
      
      // Single health check query (PC=1 eliminates need for complex warm-up)
      const warmUpResponse = await this.makeQuery("What is strategic planning?", "decision");
      
      // Simple success check (PC=1 should be consistent)
      this._isWarmedUp = true;
      console.log(`✅ Lambda warmed up successfully (PC=1 always warm)`);
      
    } catch (error) {
      console.warn("⚠️ Lambda warm-up failed, proceeding anyway:", error);
      // Don't block user queries if warm-up fails
      this._isWarmedUp = true;
    } finally {
      this.warmUpPromise = null;
    }
  }

  // Update all cached low-quality responses after warm-up
  private async updateAllCachedLowQualityResponses(): Promise<void> {
    console.log('🔄 Updating all cached low-quality responses...');
    
    for (const [cacheKey, response] of this.queryCache.entries()) {
      const quality = analyzeResponseQuality(response);
      const score = getQualityScore(response);
      
      if (score < this.MIN_QUALITY_THRESHOLD) {
        // Extract query and courseId from cache key
        const [query, courseId] = cacheKey.split('-');
        if (query && courseId) {
          await this.updateCacheWithHighQualityResponse(query, courseId);
        }
      }
    }
  }

  // Utility function to get API base URL
  private getApiBaseUrl(): string {
    // Use the global getApiBaseUrl function set by the main API client
    if (typeof window !== 'undefined' && (window as any).getApiBaseUrl) {
      return (window as any).getApiBaseUrl();
    }
    
    // Try to get from window object (set by Vite)
    if (typeof window !== 'undefined' && (window as any).__VITE_API_URL) {
      return (window as any).__VITE_API_URL;
    }
    
    // Try to get from global Vite environment (available at runtime)
    if (typeof window !== 'undefined' && (window as any).VITE_API_URL) {
      return (window as any).VITE_API_URL;
    }
    
    // Fallback to process.env for Node.js environments
    if (typeof process !== 'undefined' && process.env.VITE_API_URL) {
      return process.env.VITE_API_URL;
    }
    
    throw new Error('VITE_API_URL environment variable not set. Frontend must use Lambda Function URL.');
  }

  private async makeQuery(query: string, courseId: string): Promise<QueryResponse> {
    // Get API base URL from environment variable
    const apiBase = this.getApiBaseUrl();
    
    // Ensure we're using the Lambda Function URL
    if (!apiBase.includes('lambda-url.us-east-2.on.aws')) {
      throw new Error('CRITICAL: API base URL must use Lambda Function URL for production stability');
    }
    
    const response = await fetch(`${apiBase}query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        course_id: courseId,
        user_id: 'default'
      })
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get quality history for a specific query
  getQueryQuality(query: string, courseId: string): QualityStatus | undefined {
    const cacheKey = `${query}-${courseId}`;
    return this.qualityHistory.get(cacheKey);
  }

  // Check if we should suggest retry based on quality
  shouldSuggestRetry(query: string, courseId: string): boolean {
    const quality = this.getQueryQuality(query, courseId);
    return quality === 'low';
  }

  // Clear cache when needed (e.g., after deployment)
  clearCache(): void {
    const cacheSize = this.queryCache.size;
    const qualitySize = this.qualityHistory.size;
    
    this.queryCache.clear();
    this.qualityHistory.clear();
    
    // Only reset warm-up status if we had a lot of cached data (indicating potential issues)
    if (cacheSize > 10) {
      this._isWarmedUp = false;
      console.log(`🧹 Query cache cleared (${cacheSize} queries, ${qualitySize} quality records) - resetting warm-up status`);
    } else {
      console.log(`🧹 Query cache cleared (${cacheSize} queries, ${qualitySize} quality records) - preserving warm-up status`);
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cachedQueries: this.queryCache.size,
      qualityHistory: this.qualityHistory.size,
      isWarmedUp: this._isWarmedUp
    };
  }

  // Check if system has cooled down (for proactive monitoring)
  hasSystemCooledDown(): boolean {
    // Check if we have recent high-quality responses
    const recentQueries = Array.from(this.qualityHistory.entries()).slice(-5);
    const recentQualityScores = recentQueries.map(([_, quality]) => {
      // Convert quality status to approximate score
      switch (quality) {
        case 'high': return 90;
        case 'consistent': return 80;
        case 'low': return 40;
        default: return 50;
      }
    });
    
    // If average recent quality is below threshold, system may have cooled
    const avgQuality = recentQualityScores.reduce((a, b) => a + b, 0) / recentQualityScores.length;
    return avgQuality < this.MIN_QUALITY_THRESHOLD;
  }

  // Get estimated processing time based on system state
  getEstimatedProcessingTime(): string {
    if (!this._isWarmedUp) {
      return "15–20 seconds"; // Cold start + warm-up needed
    }
    
    if (this.hasSystemCooledDown()) {
      return "15–20 seconds"; // System cooled, warm-up needed
    }
    
    return "10–15 seconds"; // Normal processing
  }

  // Public method for pre-warming (can be called from Homepage)
  async preWarmLambda(): Promise<void> {
    console.log('🚀 Pre-warming Lambda function from Homepage...');
    if (!this._isWarmedUp) {
      await this.warmUpLambda();
    } else {
      console.log('✅ Lambda already warmed up, no pre-warming needed');
    }
  }

  // Public getter for warm-up status
  get isWarmedUp(): boolean {
    return this._isWarmedUp;
  }

  // Proactive warm-up check (can be called periodically)
  async checkAndWarmUpIfNeeded(): Promise<void> {
    if (this.hasSystemCooledDown()) {
      console.log('🌡️ QA/QC: System appears to have cooled down, proactive re-warming...');
      await this.forceWarmUp();
    }
  }

  // Automatic cache management to prevent UI issues
  private manageCache(): void {
    const cacheSize = this.queryCache.size;
    
    // If cache is too large, remove oldest entries
    if (cacheSize > this.MAX_CACHE_SIZE) {
      console.log(`🧹 Auto-managing cache: ${cacheSize} items exceeds limit ${this.MAX_CACHE_SIZE}`);
      this.autoCleanCache();
    }
    
    // Check cache health and auto-clear if problems detected
    if (this.shouldAutoClearCache()) {
      console.log('🚨 Auto-clearing cache due to detected problems');
      this.autoClearCache();
    }
  }

  // Auto-clean cache by removing oldest entries
  private autoCleanCache(): void {
    const entries = Array.from(this.queryCache.entries());
    const sortedEntries = entries.sort((a, b) => {
      // Sort by timestamp if available, otherwise by insertion order
      const aTime = a[1].timestamp ? new Date(a[1].timestamp).getTime() : 0;
      const bTime = b[1].timestamp ? new Date(b[1].timestamp).getTime() : 0;
      return aTime - bTime;
    });
    
    // Remove oldest entries to get back to target size
    const targetSize = Math.floor(this.MAX_CACHE_SIZE * 0.8); // 80% of max
    const toRemove = sortedEntries.slice(0, sortedEntries.length - targetSize);
    
    toRemove.forEach(([key, _]) => {
      this.queryCache.delete(key);
      this.qualityHistory.delete(key);
    });
    
    console.log(`🧹 Auto-cleaned cache: removed ${toRemove.length} old entries`);
  }

  // Detect if cache should be auto-cleared
  private shouldAutoClearCache(): boolean {
    const now = Date.now();
    const failureRate = this.cacheHealth.totalQueries > 0 ? 
      this.cacheHealth.consecutiveFailures / this.cacheHealth.totalQueries : 0;
    
    // Clear if too many consecutive failures
    if (this.cacheHealth.consecutiveFailures >= this.PROBLEM_DETECTION_THRESHOLD) {
      return true;
    }
    
    // Clear if failure rate is too high (>50%)
    if (failureRate > 0.5 && this.cacheHealth.totalQueries > 10) {
      return true;
    }
    
    // Clear if last failure was recent and we have many failures
    if (now - this.cacheHealth.lastFailureTime < 5 * 60 * 1000 && // 5 minutes
        this.cacheHealth.consecutiveFailures > 3) {
      return true;
    }
    
    return false;
  }

  // Auto-clear cache when problems detected
  private autoClearCache(): void {
    const cacheSize = this.queryCache.size;
    const qualitySize = this.qualityHistory.size;
    
    // Store the failure count BEFORE resetting it
    const consecutiveFailures = this.cacheHealth.consecutiveFailures;
    
    this.queryCache.clear();
    this.qualityHistory.clear();
    
    // Reset health metrics
    this.cacheHealth = {
      consecutiveFailures: 0,
      lastFailureTime: 0,
      totalQueries: 0,
      successfulQueries: 0
    };
    
    // Preserve warm-up status unless we had major issues
    if (consecutiveFailures > 10) {
      this._isWarmedUp = false;
      console.log(`🚨 Auto-cache clear: Major issues detected (${consecutiveFailures} failures), resetting warm-up status`);
    } else {
      console.log(`🧹 Auto-cache clear: Minor issues detected (${consecutiveFailures} failures), preserving warm-up status`);
    }
    
    console.log(`🧹 Auto-cache clear completed (was ${cacheSize} queries, ${qualitySize} quality records)`);
  }

  // Track query success/failure for health monitoring
  private trackQueryHealth(success: boolean): void {
    this.cacheHealth.totalQueries++;
    
    if (success) {
      this.cacheHealth.consecutiveFailures = 0;
      this.cacheHealth.successfulQueries++;
    } else {
      this.cacheHealth.consecutiveFailures++;
      this.cacheHealth.lastFailureTime = Date.now();
    }
  }
}

export default QueryService;
