/**
 * Latency Metrics Service
 * 
 * Tracks and reports latency metrics for monitoring optimization effectiveness.
 */

export interface LatencyEvent {
    eventType: 'generation' | 'cache_hit' | 'vector_search' | 'streaming_tier';
    startTime: number;
    endTime: number;
    durationMs: number;
    metadata: Record<string, any>;
}

export interface LatencyReport {
    avgTimeToFirstDish: number;
    avgTotalResponseTime: number;
    cacheHitRate: number;
    vectorHitRate: number;
    prewarmHitRate: number;
    streamingTierBreakdown: {
        tier1: { avgMs: number; count: number };
        tier2: { avgMs: number; count: number };
        tier3: { avgMs: number; count: number };
    };
    newUserMetrics: {
        avgFirstResponse: number;
        count: number;
    };
}

class LatencyMetricsService {
    private events: LatencyEvent[] = [];
    private maxEvents = 1000; // Keep last 1000 events

    private counters = {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        vectorHits: 0,
        vectorMisses: 0,
        preWarmHits: 0,
        preWarmMisses: 0,
        newUserRequests: 0
    };

    private timings = {
        tier1Total: 0,
        tier1Count: 0,
        tier2Total: 0,
        tier2Count: 0,
        tier3Total: 0,
        tier3Count: 0,
        firstDishTotal: 0,
        firstDishCount: 0,
        newUserFirstDishTotal: 0,
        newUserFirstDishCount: 0
    };

    /**
     * Record a latency event.
     */
    recordEvent(event: Omit<LatencyEvent, 'durationMs'>): void {
        const fullEvent: LatencyEvent = {
            ...event,
            durationMs: event.endTime - event.startTime
        };

        this.events.push(fullEvent);

        // Keep event list bounded
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Update counters based on event type
        this.updateCounters(fullEvent);
    }

    /**
     * Record cache hit/miss.
     */
    recordCacheAccess(hit: boolean, source: 'firebase' | 'vector' | 'prewarm'): void {
        this.counters.totalRequests++;

        switch (source) {
            case 'firebase':
                hit ? this.counters.cacheHits++ : this.counters.cacheMisses++;
                break;
            case 'vector':
                hit ? this.counters.vectorHits++ : this.counters.vectorMisses++;
                break;
            case 'prewarm':
                hit ? this.counters.preWarmHits++ : this.counters.preWarmMisses++;
                break;
        }
    }

    /**
     * Record streaming tier completion.
     */
    recordTierCompletion(tier: 1 | 2 | 3, durationMs: number): void {
        switch (tier) {
            case 1:
                this.timings.tier1Total += durationMs;
                this.timings.tier1Count++;
                break;
            case 2:
                this.timings.tier2Total += durationMs;
                this.timings.tier2Count++;
                break;
            case 3:
                this.timings.tier3Total += durationMs;
                this.timings.tier3Count++;
                break;
        }
    }

    /**
     * Record time to first dish for a request.
     */
    recordFirstDishLatency(durationMs: number, isNewUser: boolean = false): void {
        this.timings.firstDishTotal += durationMs;
        this.timings.firstDishCount++;

        if (isNewUser) {
            this.counters.newUserRequests++;
            this.timings.newUserFirstDishTotal += durationMs;
            this.timings.newUserFirstDishCount++;
        }
    }

    /**
     * Get comprehensive latency report.
     */
    getReport(): LatencyReport {
        const totalCacheAccess = this.counters.cacheHits + this.counters.cacheMisses;
        const totalVectorAccess = this.counters.vectorHits + this.counters.vectorMisses;
        const totalPreWarmAccess = this.counters.preWarmHits + this.counters.preWarmMisses;

        return {
            avgTimeToFirstDish: this.timings.firstDishCount > 0
                ? Math.round(this.timings.firstDishTotal / this.timings.firstDishCount)
                : 0,
            avgTotalResponseTime: this.calculateAvgTotalResponseTime(),
            cacheHitRate: totalCacheAccess > 0
                ? Math.round((this.counters.cacheHits / totalCacheAccess) * 100)
                : 0,
            vectorHitRate: totalVectorAccess > 0
                ? Math.round((this.counters.vectorHits / totalVectorAccess) * 100)
                : 0,
            prewarmHitRate: totalPreWarmAccess > 0
                ? Math.round((this.counters.preWarmHits / totalPreWarmAccess) * 100)
                : 0,
            streamingTierBreakdown: {
                tier1: {
                    avgMs: this.timings.tier1Count > 0
                        ? Math.round(this.timings.tier1Total / this.timings.tier1Count)
                        : 0,
                    count: this.timings.tier1Count
                },
                tier2: {
                    avgMs: this.timings.tier2Count > 0
                        ? Math.round(this.timings.tier2Total / this.timings.tier2Count)
                        : 0,
                    count: this.timings.tier2Count
                },
                tier3: {
                    avgMs: this.timings.tier3Count > 0
                        ? Math.round(this.timings.tier3Total / this.timings.tier3Count)
                        : 0,
                    count: this.timings.tier3Count
                }
            },
            newUserMetrics: {
                avgFirstResponse: this.timings.newUserFirstDishCount > 0
                    ? Math.round(this.timings.newUserFirstDishTotal / this.timings.newUserFirstDishCount)
                    : 0,
                count: this.counters.newUserRequests
            }
        };
    }

    /**
     * Log report to console.
     */
    logReport(): void {
        const report = this.getReport();
        console.log('\n📊 [Latency Metrics Report]');
        console.log('='.repeat(40));
        console.log(`Avg Time to First Dish: ${report.avgTimeToFirstDish}ms`);
        console.log(`Cache Hit Rate: ${report.cacheHitRate}%`);
        console.log(`Vector Hit Rate: ${report.vectorHitRate}%`);
        console.log(`Pre-warm Hit Rate: ${report.prewarmHitRate}%`);
        console.log('\nStreaming Tiers:');
        console.log(`  Tier 1: ${report.streamingTierBreakdown.tier1.avgMs}ms avg (${report.streamingTierBreakdown.tier1.count} requests)`);
        console.log(`  Tier 2: ${report.streamingTierBreakdown.tier2.avgMs}ms avg (${report.streamingTierBreakdown.tier2.count} requests)`);
        console.log(`  Tier 3: ${report.streamingTierBreakdown.tier3.avgMs}ms avg (${report.streamingTierBreakdown.tier3.count} requests)`);
        console.log('\nNew User Performance:');
        console.log(`  Avg First Response: ${report.newUserMetrics.avgFirstResponse}ms`);
        console.log(`  New User Requests: ${report.newUserMetrics.count}`);
        console.log('='.repeat(40));
    }

    /**
     * Reset all metrics.
     */
    reset(): void {
        this.events = [];
        this.counters = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            vectorHits: 0,
            vectorMisses: 0,
            preWarmHits: 0,
            preWarmMisses: 0,
            newUserRequests: 0
        };
        this.timings = {
            tier1Total: 0,
            tier1Count: 0,
            tier2Total: 0,
            tier2Count: 0,
            tier3Total: 0,
            tier3Count: 0,
            firstDishTotal: 0,
            firstDishCount: 0,
            newUserFirstDishTotal: 0,
            newUserFirstDishCount: 0
        };
        console.log('[LatencyMetrics] All metrics reset.');
    }

    private updateCounters(event: LatencyEvent): void {
        // Track generation events for total response time
        if (event.eventType === 'generation') {
            // Handled separately via recordFirstDishLatency
        }
    }

    private calculateAvgTotalResponseTime(): number {
        const generationEvents = this.events.filter(e => e.eventType === 'generation');
        if (generationEvents.length === 0) return 0;
        const total = generationEvents.reduce((sum, e) => sum + e.durationMs, 0);
        return Math.round(total / generationEvents.length);
    }
}

// Singleton instance
export const latencyMetricsService = new LatencyMetricsService();
