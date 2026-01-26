/**
 * AI Optimization Service
 * 
 * Centralized service for all AI workflow optimizations:
 * 1. Adaptive Model Selection - Choose optimal model per task
 * 2. Embedding Cache - Cache embeddings to reduce API calls
 * 3. Semantic Deduplication - Avoid regenerating similar dishes
  * 4. Request Coalescing - Deduplicate concurrent identical requests
 */

// =============================================================================
// 1. ADAPTIVE MODEL SELECTION
// =============================================================================

export type TaskType = 'feed' | 'cook' | 'analyze' | 'enrich' | 'embed';

interface ModelConfig {
    model: string;
    maxOutputTokens: number;
    temperature: number;
    description: string;
}

const MODEL_CONFIGS: Record<TaskType, ModelConfig> = {
    feed: {
        model: 'gemini-2.0-flash',
        maxOutputTokens: 300,
        temperature: 0.4,
        description: 'Fast generation for swipe deck'
    },
    enrich: {
        model: 'gemini-2.0-flash',
        maxOutputTokens: 500,
        temperature: 0.3,
        description: 'Dish hydration (Standard JSON)'
    },
    cook: {
        model: 'gemini-3-flash-preview',
        maxOutputTokens: 4000,
        temperature: 0.3,
        description: 'Reasoning model for complex constraints'
    },
    analyze: {
        model: 'gemini-2.0-flash',
        maxOutputTokens: 1500,
        temperature: 0.2,
        description: 'Multimodal analysis'
    },
    embed: {
        model: 'text-embedding-004',
        maxOutputTokens: 0,
        temperature: 0,
        description: 'Text embeddings'
    }
};

/**
 * Select optimal model based on task type.
 */
export function selectModel(taskType: TaskType): ModelConfig {
    const config = MODEL_CONFIGS[taskType];
    console.debug(`[ModelSelect] Task: ${taskType} → Model: ${config.model}`);
    return config;
}

/**
 * Get model name only (for backward compatibility).
 */
export function getModelForTask(taskType: TaskType): string {
    return MODEL_CONFIGS[taskType].model;
}

// =============================================================================
// 2. EMBEDDING CACHE
// =============================================================================

interface CachedEmbedding {
    embedding: number[];
    expiry: number;
}

class EmbeddingCache {
    private cache = new Map<string, CachedEmbedding>();
    private readonly maxSize = 500;
    private readonly ttlMs = 60 * 60 * 1000; // 1 hour

    private metrics = {
        hits: 0,
        misses: 0
    };

    /**
     * Hash text for cache key (simple hash for performance).
     */
    private hashText(text: string): string {
        let hash = 0;
        const normalized = text.toLowerCase().trim();
        for (let i = 0; i < normalized.length; i++) {
            const char = normalized.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `emb_${hash}`;
    }

    /**
     * Get cached embedding if available and not expired.
     */
    get(text: string): number[] | null {
        const key = this.hashText(text);
        const cached = this.cache.get(key);

        if (cached && cached.expiry > Date.now()) {
            this.metrics.hits++;
            console.debug(`[EmbeddingCache] HIT (${this.getHitRate()}% rate)`);
            return cached.embedding;
        }

        if (cached) {
            // Expired, remove it
            this.cache.delete(key);
        }

        this.metrics.misses++;
        return null;
    }

    /**
     * Store embedding in cache.
     */
    set(text: string, embedding: number[]): void {
        const key = this.hashText(text);

        // LRU eviction if at max size
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            embedding,
            expiry: Date.now() + this.ttlMs
        });
    }

    /**
     * Get cache hit rate as percentage.
     */
    getHitRate(): number {
        const total = this.metrics.hits + this.metrics.misses;
        return total > 0 ? Math.round((this.metrics.hits / total) * 100) : 0;
    }

    /**
     * Get cache statistics.
     */
    getStats(): { size: number; hits: number; misses: number; hitRate: number } {
        return {
            size: this.cache.size,
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            hitRate: this.getHitRate()
        };
    }

    /**
     * Clear all cached embeddings.
     */
    clear(): void {
        this.cache.clear();
        console.log('[EmbeddingCache] Cleared');
    }
}

// Singleton instance
export const embeddingCache = new EmbeddingCache();

// =============================================================================
// 3. SEMANTIC DEDUPLICATION
// =============================================================================

interface DeduplicationResult {
    shouldGenerate: boolean;
    existingDish?: any;
    similarityScore?: number;
}

/**
 * Check if we should generate a new dish or use an existing one.
 * Uses Pinecone to find semantically similar dishes.
 */
export async function checkSemanticDuplicate(
    dishName: string,
    cuisine: string,
    threshold: number = 0.95
): Promise<DeduplicationResult> {
    try {
        const { pineconeService } = await import('./pineconeService');
        const query = `${dishName} ${cuisine}`;
        const results = await pineconeService.hybridSearch(query, 'dishes', { topK: 1, alpha: 0.9 });

        if (results.length === 0) {
            return { shouldGenerate: true };
        }

        const topMatch = results[0];
        const score = topMatch.score || 0;

        if (score >= threshold) {
            console.log(`[Dedup] SKIP: "${dishName}" matches "${topMatch.metadata?.name}" (${(score * 100).toFixed(1)}%)`);

            const existingDish: any = { ...topMatch.metadata };
            // Deserialize complex objects from JSON strings
            try {
                if (typeof existingDish.macros === 'string') existingDish.macros = JSON.parse(existingDish.macros);
                if (typeof existingDish.ingredients === 'string') existingDish.ingredients = JSON.parse(existingDish.ingredients);
                if (typeof existingDish.instructions === 'string') existingDish.instructions = JSON.parse(existingDish.instructions);
            } catch (e) {
                console.warn("[Dedup] Failed to parse metadata JSON", e);
                // Fallback to generation if data is corrupt
                return { shouldGenerate: true };
            }

            return {
                shouldGenerate: false,
                existingDish,
                similarityScore: score
            };
        }

        return { shouldGenerate: true, similarityScore: score };
    } catch (error) {
        console.warn('[Dedup] Check failed, proceeding with generation:', error);
        return { shouldGenerate: true };
    }
}

// =============================================================================
// 4. REQUEST COALESCING
// =============================================================================

class RequestCoalescer {
    private pending = new Map<string, Promise<any>>();
    private metrics = {
        coalesced: 0,
        unique: 0
    };

    /**
     * Execute a request, coalescing with any identical in-flight request.
     */
    async request<T>(key: string, fn: () => Promise<T>): Promise<T> {
        // Check if an identical request is already in flight
        if (this.pending.has(key)) {
            this.metrics.coalesced++;
            console.debug(`[Coalescer] Reusing in-flight request: ${key.slice(0, 30)}...`);
            return this.pending.get(key)! as Promise<T>;
        }

        // Execute new request
        this.metrics.unique++;
        const promise = fn().finally(() => {
            // Remove from pending after completion
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }

    /**
     * Generate a cache key from request parameters.
     */
    generateKey(taskType: string, ...args: any[]): string {
        return `${taskType}:${JSON.stringify(args)}`;
    }

    /**
     * Get coalescing statistics.
     */
    getStats(): { coalesced: number; unique: number; savingsRate: number } {
        const total = this.metrics.coalesced + this.metrics.unique;
        return {
            coalesced: this.metrics.coalesced,
            unique: this.metrics.unique,
            savingsRate: total > 0 ? Math.round((this.metrics.coalesced / total) * 100) : 0
        };
    }
}

// Singleton instance
export const requestCoalescer = new RequestCoalescer();

// =============================================================================
// 5. TOKEN BUDGET OPTIMIZATION
// =============================================================================

interface TokenBudget {
    maxInputTokens: number;
    maxOutputTokens: number;
}

const TOKEN_BUDGETS: Record<TaskType, TokenBudget> = {
    feed: { maxInputTokens: 500, maxOutputTokens: 300 },
    enrich: { maxInputTokens: 800, maxOutputTokens: 500 },
    cook: { maxInputTokens: 8000, maxOutputTokens: 4000 },
    analyze: { maxInputTokens: 2000, maxOutputTokens: 1500 },
    embed: { maxInputTokens: 2000, maxOutputTokens: 0 }
};

/**
 * Get token budget for a task type.
 */
export function getTokenBudget(taskType: TaskType): TokenBudget {
    return TOKEN_BUDGETS[taskType];
}

/**
 * Truncate text to fit within token budget.
 * Rough estimate: 1 token ≈ 4 characters.
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;

    console.debug(`[TokenBudget] Truncating from ${text.length} to ${maxChars} chars`);
    return text.slice(0, maxChars) + '...';
}

// =============================================================================
// AGGREGATED STATISTICS
// =============================================================================

/**
 * Get all optimization statistics for monitoring.
 */
export function getOptimizationStats(): {
    embeddingCache: ReturnType<typeof embeddingCache.getStats>;
    requestCoalescing: ReturnType<typeof requestCoalescer.getStats>;
} {
    return {
        embeddingCache: embeddingCache.getStats(),
        requestCoalescing: requestCoalescer.getStats()
    };
}

/**
 * Log all optimization statistics to console.
 */
export function logOptimizationStats(): void {
    const stats = getOptimizationStats();
    console.log('\n📊 [AI Optimization Stats]');
    console.log('='.repeat(40));
    console.log(`Embedding Cache: ${stats.embeddingCache.hitRate}% hit rate (${stats.embeddingCache.size} entries)`);
    console.log(`Request Coalescing: ${stats.requestCoalescing.savingsRate}% savings (${stats.requestCoalescing.coalesced} coalesced)`);
    console.log('='.repeat(40));
}
