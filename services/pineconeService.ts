import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env';
import { generateEmbedding } from './geminiService';

const INDEX_NAME = "tadkasync-main";

// Interface for what we store
export interface VectorRecord {
    id: string;
    text: string; // The text content to embed
    metadata: Record<string, any>; // Flattened metadata
}

class PineconeService {
    private pc: Pinecone | null = null;
    private indexName: string = INDEX_NAME;
    private isInitialized = false;

    constructor() {
        // SECURITY FIX: Only accept server-side API key.
        // NEVER use import.meta.env for sensitive keys as they get bundled client-side.
        const apiKey = typeof process !== 'undefined' ? process.env?.PINECONE_API_KEY : undefined;

        if (apiKey) {
            this.pc = new Pinecone({ apiKey });
            this.isInitialized = true;
            console.log("[Pinecone] Initialized with server-side key.");
        } else {
            // This is expected in browser context. Pinecone should only work server-side.
            console.warn("[Pinecone] API Key not found (expected in browser). Vector search disabled client-side.");
        }
    }

    getClient() {
        return this.pc;
    }

    getIndex() {
        if (!this.pc) return null;
        return this.pc.index(this.indexName);
    }

    // --- Core Operations ---

    async upsert(records: VectorRecord[], namespace: string = "default") {
        if (!this.pc) return;
        try {
            const index = this.getIndex();
            if (!index) return;

            const vectors = await Promise.all(records.map(async (rec) => {
                const embedding = await generateEmbedding(rec.text);
                if (!embedding) return null;

                return {
                    id: rec.id,
                    values: embedding,
                    metadata: {
                        ...rec.metadata,
                        text: rec.text // Store text in metadata for retrieval
                    }
                };
            }));

            // Filter failures
            const validVectors = vectors.filter(v => v !== null) as any[];

            if (validVectors.length > 0) {
                await index.namespace(namespace).upsert(validVectors);
                console.log(`[Pinecone] Upserted ${validVectors.length} records to namespace '${namespace}'.`);
            }
        } catch (e) {
            console.error("[Pinecone] Upsert Error:", e);
        }
    }

    async search(query: string, namespace: string = "default", topK: number = 5) {
        if (!this.pc) return [];
        try {
            const index = this.getIndex();
            if (!index) return [];

            const queryEmbedding = await generateEmbedding(query);
            if (!queryEmbedding) return [];

            const results = await index.namespace(namespace).query({
                vector: queryEmbedding,
                topK,
                includeMetadata: true
            });

            return results.matches || [];
        } catch (e) {
            console.error("[Pinecone] Search Error:", e);
            return [];
        }
    }

    /**
     * Hybrid BM25 + Semantic Search for cold-start optimization.
     * Alpha controls the weight: higher alpha = more BM25 (keyword), lower = more semantic.
     * For new users, use high alpha (0.7) to rely on explicit keywords.
     * As user data accumulates, lower alpha (0.3) for semantic matching.
     */
    async hybridSearch(
        query: string,
        namespace: string = "default",
        options: { topK?: number; alpha?: number; userInteractionCount?: number } = {}
    ) {
        if (!this.pc) return [];

        const { topK = 5, userInteractionCount = 0 } = options;

        // Adaptive alpha: new users get higher BM25 weight, experienced users get more semantic
        // Alpha = 0.7 for 0 interactions, decreases to 0.3 at 20+ interactions
        const alpha = options.alpha ?? Math.max(0.3, 0.7 - (userInteractionCount * 0.02));

        try {
            const index = this.getIndex();
            if (!index) return [];

            // 1. Semantic search
            const queryEmbedding = await generateEmbedding(query);
            if (!queryEmbedding) return [];

            const semanticResults = await index.namespace(namespace).query({
                vector: queryEmbedding,
                topK: topK * 2, // Fetch more for re-ranking
                includeMetadata: true
            });

            const matches = semanticResults.matches || [];
            if (matches.length === 0) return [];

            // 2. BM25-style keyword scoring
            const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

            const scoredResults = matches.map(match => {
                const semanticScore = match.score || 0;

                // Calculate BM25-like keyword score from metadata
                let bm25Score = 0;
                const metadata = match.metadata || {};
                const textContent = [
                    metadata.text || '',
                    metadata.name || '',
                    metadata.cuisine || '',
                    Array.isArray(metadata.tags) ? metadata.tags.join(' ') : (metadata.tags || '')
                ].join(' ').toLowerCase();

                queryTerms.forEach(term => {
                    if (textContent.includes(term)) {
                        bm25Score += 1 / queryTerms.length; // Normalize by query length
                    }
                });

                // 3. Combine scores with alpha weighting
                const hybridScore = (alpha * bm25Score) + ((1 - alpha) * semanticScore);

                return {
                    ...match,
                    score: hybridScore,
                    _semanticScore: semanticScore,
                    _bm25Score: bm25Score
                };
            });

            // 4. Re-rank by hybrid score
            scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

            console.log(`[Pinecone] Hybrid search (alpha=${alpha.toFixed(2)}): ${scoredResults.length} results`);
            return scoredResults.slice(0, topK);

        } catch (e) {
            console.error("[Pinecone] Hybrid Search Error:", e);
            return [];
        }
    }

    /**
     * Check if Pinecone is initialized and available.
     */
    isAvailable(): boolean {
        return this.isInitialized && this.pc !== null;
    }
}

export const pineconeService = new PineconeService();
