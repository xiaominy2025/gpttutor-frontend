import { QueryResponse, QualityStatus } from '../types/QualityTypes';
import { analyzeResponseQuality, getQualityScore } from '../utils/qualityAnalyzer';

class QueryService {
  private static instance: QueryService;
  private _isWarmedUp = false;
  private queryCache = new Map<string, QueryResponse>();
  private warmUpPromise: Promise<void> | null = null;
  private qualityHistory = new Map<string, QualityStatus>();
  
  // QA/QC Configuration
  private readonly MIN_QUALITY_THRESHOLD = 66; // Lowered from 70 to 66
  private readonly MAX_WARMUP_ATTEMPTS = 2; // Reduced from 3 to 2 attempts
  private readonly WARMUP_DELAY_MS = 2000; // Delay between warm-up attempts
  private readonly FORCE_WARMUP_TIMEOUT = 30000; // Force warm-up timeout (30s)

  // Automatic cache management to prevent UI issues
  private readonly MAX_CACHE_SIZE = 50; // Increased from 20 to be less aggressive
  private readonly MAX_CACHE_AGE_MS = 30 * 60 * 1000; // 30 minutes max age
  private readonly PROBLEM_DETECTION_THRESHOLD = 10; // Increased from 5 to be less aggressive

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
      
      // QA/QC: Quality gate - safety net for when system cools down
      const quality = analyzeResponseQuality(response);
      const qualityScore = getQualityScore(response);
      
      if (qualityScore < this.MIN_QUALITY_THRESHOLD) {
        console.log(`🚫 QA/QC: Response quality ${qualityScore}/100 below threshold ${this.MIN_QUALITY_THRESHOLD} - system may have cooled down`);
        
        // Force re-warm-up and retry (reactive quality control)
        console.log('🔄 QA/QC: Forcing re-warm-up to restore quality...');
        await this.forceWarmUp();
        
        const retryResponse = await this.makeQuery(query, courseId);
        const retryQuality = analyzeResponseQuality(retryResponse);
        const retryScore = getQualityScore(retryResponse);
        
        console.log(`🔄 QA/QC: Retry quality ${retryScore}/100 (${retryQuality})`);
        
        // Use retry response if it meets quality standards
        if (retryScore >= this.MIN_QUALITY_THRESHOLD) {
          response = retryResponse;
          console.log(`✅ QA/QC: Quality restored to ${retryScore}/100 after re-warm-up`);
        } else {
          console.warn(`⚠️ QA/QC: Quality still below threshold after re-warm-up (${retryScore}/100)`);
        }
      }
      
      // Store quality metrics
      this.qualityHistory.set(cacheKey, quality);
      
      // Cache the response
      this.queryCache.set(cacheKey, response);
      
      // Track successful query
      this.trackQueryHealth(true);
      
      // Automatic cache management to prevent UI issues
      this.manageCache();
      
      console.log(`📊 Query quality: ${quality} (${qualityScore}/100) - ${response.data.answer.length} chars`);
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
            console.log(`✅ Cache updated: ${freshQuality} (${freshScore}/100) - ${freshResponse.data.answer.length} chars`);
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

  private async forceWarmUp(): Promise<void> {
    console.log('🔒 QA/QC: Starting forced warm-up process...');
    
    let attempts = 0;
    let lastQualityScore = 0;
    
    while (attempts < this.MAX_WARMUP_ATTEMPTS) {
      attempts++;
      console.log(`🔥 QA/QC: Warm-up attempt ${attempts}/${this.MAX_WARMUP_ATTEMPTS}`);
      
      try {
        // Send warm-up query
        const warmUpResponse = await this.makeQuery("What is strategic planning?", "decision");
        const quality = analyzeResponseQuality(warmUpResponse);
        const qualityScore = getQualityScore(warmUpResponse);
        
        console.log(`📊 QA/QC: Warm-up quality: ${quality} (${qualityScore}/100)`);
        
        // Check if quality meets threshold
        if (qualityScore >= this.MIN_QUALITY_THRESHOLD) {
          this._isWarmedUp = true;
          console.log(`✅ QA/QC: Lambda warmed up successfully - quality ${qualityScore}/100 meets threshold`);
          return;
        }
        
        // Quality improved but still below threshold
        if (qualityScore > lastQualityScore) {
          console.log(`📈 QA/QC: Quality improving: ${lastQualityScore} → ${qualityScore}`);
          lastQualityScore = qualityScore;
        }
        
        // Wait before next attempt
        if (attempts < this.MAX_WARMUP_ATTEMPTS) {
          console.log(`⏳ QA/QC: Waiting ${this.WARMUP_DELAY_MS}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, this.WARMUP_DELAY_MS));
        }
        
      } catch (error) {
        console.warn(`⚠️ QA/QC: Warm-up attempt ${attempts} failed:`, error);
        
        if (attempts < this.MAX_WARMUP_ATTEMPTS) {
          console.log(`⏳ QA/QC: Waiting ${this.WARMUP_DELAY_MS}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.WARMUP_DELAY_MS));
        }
      }
    }
    
    // If we reach here, warm-up failed to meet quality threshold
    console.warn(`⚠️ QA/QC: Warm-up failed after ${this.MAX_WARMUP_ATTEMPTS} attempts, proceeding with lower quality`);
    this._isWarmedUp = true; // Don't block user queries indefinitely
  }

  private async performWarmUp(): Promise<void> {
    try {
      console.log("🔥 Warming up Lambda function...");
      
      // Send a simple warm-up query to populate the concept embeddings cache
      const warmUpResponse = await this.makeQuery("What is strategic planning?", "decision");
      
      // Check if warm-up was successful
      const quality = analyzeResponseQuality(warmUpResponse);
      const qualityScore = getQualityScore(warmUpResponse);
      
      if (qualityScore >= this.MIN_QUALITY_THRESHOLD) {
        this._isWarmedUp = true;
        console.log(`✅ Lambda warmed up successfully - quality ${qualityScore}/100 meets threshold`);
        
        // After successful warm-up, update any cached low-quality responses
        await this.updateAllCachedLowQualityResponses();
      } else {
        console.warn(`⚠️ Lambda warm-up response quality ${qualityScore}/100 below threshold ${this.MIN_QUALITY_THRESHOLD}`);
        this._isWarmedUp = true; // Don't block user queries
      }
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
