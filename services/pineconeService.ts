import type { Pinecone as PineconeType, Index as IndexType } from '@pinecone-database/pinecone';
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
    private pc: PineconeType | null = null;
    private indexName: string = INDEX_NAME;
    private isInitialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        // SECURITY FIX: Explicitly prevent browser-side initialization
        if (typeof window !== 'undefined') {
            // Browser context - do nothing
            // console.debug("[Pinecone] Client-side detected. SDK disabled.");
            return;
        }

        const apiKey = env.pinecone.apiKey;
        if (apiKey) {
            try {
                // Dynamic import to avoid bundling issues in client
                const { Pinecone } = await import('@pinecone-database/pinecone');
                this.pc = new Pinecone({ apiKey });
                this.isInitialized = true;
                console.log("[Pinecone] Service Initialized.");
            } catch (e) {
                console.warn("[Pinecone] Initialization failed:", e);
            }
        } else {
            console.warn("[Pinecone] Missing API Key. Vector features disabled.");
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
        // If not initialized (e.g. browser), silently skip
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
        // 1. SDK Mode (Server/Node.js)
        if (this.pc) {
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
                console.error("[Pinecone] SDK Search Error:", e);
                return [];
            }
        }

        // 2. Proxy Mode (Client/Browser)
        try {
            // Determine API URL (Local Emulator vs Production)
            const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
            // TODO: Replace with your actual project ID or dynamic config
            const PROJECT_ID = 'whattoeat-91e87';
            const REGION = 'us-central1'; // Default function region

            const url = isLocal
                ? `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/vectorSearch`
                : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/vectorSearch`;

            console.debug(`[Pinecone] Proxying search to: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, namespace, topK })
            });

            if (!response.ok) {
                console.warn(`[Pinecone] Proxy Error ${response.status}: ${await response.text()}`);
                return [];
            }

            const data = await response.json();
            return data.matches || [];

        } catch (e) {
            console.error("[Pinecone] Proxy Search Failed:", e);
            return [];
        }
    }

    /**
     * Hybrid BM25 + Semantic Search for cold-start optimization.
     */
    async hybridSearch(
        query: string,
        namespace: string = "default",
        options: { topK?: number; alpha?: number; userInteractionCount?: number } = {}
    ) {
        if (!this.pc) return [];

        const { topK = 5, userInteractionCount = 0 } = options;
        const alpha = options.alpha ?? Math.max(0.3, 0.7 - (userInteractionCount * 0.02));

        try {
            const index = this.getIndex();
            if (!index) return [];

            // 1. Semantic search
            const queryEmbedding = await generateEmbedding(query);
            if (!queryEmbedding) return [];

            const semanticResults = await index.namespace(namespace).query({
                vector: queryEmbedding,
                topK: topK * 2,
                includeMetadata: true
            });

            const matches = semanticResults.matches || [];
            if (matches.length === 0) return [];

            // 2. BM25-style keyword scoring
            const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

            const scoredResults = matches.map(match => {
                const semanticScore = match.score || 0;
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
                        bm25Score += 1 / queryTerms.length;
                    }
                });

                const hybridScore = (alpha * bm25Score) + ((1 - alpha) * semanticScore);

                return {
                    ...match,
                    score: hybridScore,
                    _semanticScore: semanticScore,
                    _bm25Score: bm25Score
                };
            });

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
