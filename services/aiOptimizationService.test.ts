
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    selectModel,
    embeddingCache,
    requestCoalescer,
    checkSemanticDuplicate,
    getTokenBudget,
    TaskType
} from './aiOptimizationService';

// Mock pineconeService
vi.mock('./pineconeService', () => ({
    pineconeService: {
        search: vi.fn(),
    }
}));

import { pineconeService } from './pineconeService';

describe('AI Optimization Service', () => {

    // 1. Adaptive Model Selection
    describe('Adaptive Model Selection', () => {
        it('should select correct model for feed task', () => {
            const config = selectModel('feed');
            expect(config.model).toBe('gemini-2.0-flash'); // Fast model
            expect(config.maxOutputTokens).toBe(300);
        });

        it('should select correct model for analysis task', () => {
            const config = selectModel('analyze');
            expect(config.model).toBe('gemini-2.0-flash'); // Capable model
            expect(config.maxOutputTokens).toBe(1500);
        });

        it('should select correct model for enrichment', () => {
            const config = selectModel('enrich');
            expect(config.model).toBe('gemini-2.0-flash'); // Balanced model
        });

        it('should select correct model for cooking', () => {
            const config = selectModel('cook');
            expect(config.model).toBe('gemini-3.0-flash'); // Reasoning model
        });
    });

    // 2. Embedding Cache
    describe('Embedding Cache', () => {
        beforeEach(() => {
            embeddingCache.clear();
        });

        it('should return null for cache miss', () => {
            expect(embeddingCache.get('test query')).toBeNull();
        });

        it('should cache and retrieve embeddings', () => {
            const embedding = [0.1, 0.2, 0.3];
            embeddingCache.set('test query', embedding);

            expect(embeddingCache.get('test query')).toEqual(embedding);
            expect(embeddingCache.get('different query')).toBeNull();
        });

        it('should normalize cache keys (case/whitespace)', () => {
            const embedding = [0.1, 0.2, 0.3];
            embeddingCache.set('Hello World', embedding);
            expect(embeddingCache.get('hello world ')).toEqual(embedding);
        });
    });

    // 3. Request Coalescing
    describe('Request Coalescing', () => {
        it('should coalesce identical concurrent requests', async () => {
            let callCount = 0;
            const asyncFn = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                callCount++;
                return 'result';
            };

            const req1 = requestCoalescer.request('key1', asyncFn);
            const req2 = requestCoalescer.request('key1', asyncFn);
            const req3 = requestCoalescer.request('key1', asyncFn);

            const results = await Promise.all([req1, req2, req3]);

            expect(results).toEqual(['result', 'result', 'result']);
            expect(callCount).toBe(1); // Only executed once
        });

        it('should execute separate requests for different keys', async () => {
            let callCount = 0;
            const asyncFn = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                callCount++;
                return 'result';
            };

            await Promise.all([
                requestCoalescer.request('keyA', asyncFn),
                requestCoalescer.request('keyB', asyncFn)
            ]);

            expect(callCount).toBe(2);
        });
    });

    // 4. Semantic Deduplication
    describe('Semantic Deduplication', () => {
        it('should allow generation if no similar dish found', async () => {
            (pineconeService.search as any).mockResolvedValue([]);
            const result = await checkSemanticDuplicate('New Dish', 'Italian');
            expect(result.shouldGenerate).toBe(true);
        });

        it('should prevent generation if highly similar dish exists', async () => {
            (pineconeService.search as any).mockResolvedValue([{
                score: 0.98,
                metadata: { name: 'Existing Dish' }
            }]);
            const result = await checkSemanticDuplicate('Similar Dish', 'Italian');
            expect(result.shouldGenerate).toBe(false);
            expect(result.existingDish.name).toBe('Existing Dish');
        });

        it('should allow generation if similarity is below threshold', async () => {
            (pineconeService.search as any).mockResolvedValue([{
                score: 0.80, // Below 0.95 default
                metadata: { name: 'Somewhat Similar' }
            }]);
            const result = await checkSemanticDuplicate('New Dish', 'Italian');
            expect(result.shouldGenerate).toBe(true);
        });
    });

    // 5. Token Budget
    describe('Token Budget', () => {
        it('should return correct token budget', () => {
            const budget = getTokenBudget('cook');
            expect(budget.maxInputTokens).toBe(1200);
        });
    });
});
