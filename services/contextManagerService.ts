import { Dish } from '../types';
import { estimateTokens } from '../utils/tokenUtils';

export interface SessionEvent {
    type: 'swipe_right' | 'swipe_left' | 'swipe_up' | 'search' | 'cook' | 'view_details';
    dish?: Dish; // For swipes/views
    query?: string; // For searches
    timestamp: number;
}

export interface SessionMemory {
    sessionId: string;
    startedAt: number;
    events: SessionEvent[];
    tokenEstimate: number;
}

export interface CondensedMemory {
    userId: string;
    summary: string;           // "Loves South Indian, avoids fried, diabetic-friendly"
    // Embeddings handled by Pinecone service, linked by userId
    cuisineAffinities: Record<string, number>;  // { "South Indian": 0.9, "Chinese": 0.3 }
    avoidPatterns: string[];
    lastCondensedAt: number;
}

const MEMORY_LIMIT_TOKENS = 500; // Limit for raw event history before condensation

class ContextManagerService {
    public currentSession: SessionMemory | null = null;
    public condensedMemory: CondensedMemory | null = null;

    initSession(userId: string) {
        this.currentSession = {
            sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            startedAt: Date.now(),
            events: [],
            tokenEstimate: 0
        };
        console.log(`[ContextManager] Session initialized: ${this.currentSession.sessionId}`);

        // Load condensed memory from LocalStorage
        try {
            const savedMemory = localStorage.getItem('tadka_brain_memory');
            if (savedMemory) {
                this.condensedMemory = JSON.parse(savedMemory);
                console.log("[ContextManager] AI Memory restored.");
            }
        } catch (e) {
            console.warn("[ContextManager] Failed to restore memory", e);
        }
    }

    recordEvent(event: SessionEvent) {
        if (!this.currentSession) return;

        this.currentSession.events.push(event);

        // Rough estimate: 10 tokens per event overhead + content
        let addedTokens = 10;
        if (event.dish) addedTokens += estimateTokens(event.dish.name + (event.dish.tags?.join(' ') || ''));
        if (event.query) addedTokens += estimateTokens(event.query);

        this.currentSession.tokenEstimate += addedTokens;

        if (console) console.debug(`[ContextManager] Event: ${event.type}. Context size: ~${this.currentSession.tokenEstimate} tokens`);
    }

    setCondensedMemory(memory: CondensedMemory) {
        this.condensedMemory = memory;
        localStorage.setItem('tadka_brain_memory', JSON.stringify(memory));
    }

    getCondensedMemory(): CondensedMemory | null {
        return this.condensedMemory;
    }

    /**
     * Returns the optimized context string for the prompt
     * @param mode 'feed' (minimal) | 'cook' (safety) | 'analyze' (full)
     */
    getOptimizedContext(mode: 'feed' | 'cook' | 'analyze' = 'feed'): string {
        let context = '';

        // 1. Add Condensed Memory (Global preferences)
        if (this.condensedMemory) {
            context += `USER PROFILE SUMMARY: ${this.condensedMemory.summary}\n`;
            if (this.condensedMemory.avoidPatterns.length > 0) {
                context += `KNOWN DISLIKES: ${this.condensedMemory.avoidPatterns.join(', ')}\n`;
            }
        }

        // 2. Add Recent Session Events (Short-term context)
        if (this.currentSession && this.currentSession.events.length > 0) {
            // Filter irrelevant events based on mode
            const recentEvents = this.currentSession.events.slice(-10); // Last 10 max

            const likes = recentEvents.filter(e => e.type === 'swipe_right' || e.type === 'swipe_up').map(e => e.dish?.name).filter(Boolean);
            const dislikes = recentEvents.filter(e => e.type === 'swipe_left').map(e => e.dish?.name).filter(Boolean);

            if (likes.length > 0) context += `JUST LIKED: ${likes.join(', ')}\n`;
            if (dislikes.length > 0) context += `JUST SKIPPED: ${dislikes.join(', ')}\n`;
        }

        return context.trim();
    }

    /**
     * Prepare a prompt for the LLM to condense the current session
     */
    /**
     * Prepare a prompt for the LLM to condense the current session
     */
    /**
     * Prepare a prompt for the LLM to condense the current session and store in Vector DB
     */
    async condenseSession(userId: string): Promise<void> {
        if (!this.currentSession || this.currentSession.events.length === 0) return;

        try {
            const eventsText = this.currentSession.events.map(e => {
                if (e.type === 'swipe_right') return `Liked ${e.dish?.name} (${e.dish?.cuisine})`;
                if (e.type === 'swipe_left') return `Disliked ${e.dish?.name}`;
                if (e.type === 'search') return `Searched "${e.query}"`;
                return null;
            }).filter(Boolean).join('. ');

            if (!eventsText) return;

            // 1. Generate Summary using Gemini
            const prompt = `Analyze this user session: "${eventsText}". 
            Update their taste profile summary (approx 20 words). 
            Focus on flavor patterns, cuisines, and dislikes.
            Return JSON: { summary: "string", affinities: {"Cuisine": 0.0-1.0}, avoidPatterns: ["string"] }`;

            const { secureGenerate } = await import('./geminiService');
            const summarySchema = {
                type: 6, // SchemaType.OBJECT
                properties: {
                    summary: { type: 1 }, // STRING
                    affinities: { type: 6 }, // OBJECT (flexible)
                    avoidPatterns: { type: 4, items: { type: 1 } } // ARRAY of STRING
                }
            };

            const result = await secureGenerate(prompt, summarySchema as any, 'analyze');

            if (result && result.summary) {
                // 2. Update Local State
                this.condensedMemory = {
                    userId,
                    summary: result.summary,
                    cuisineAffinities: result.affinities || {},
                    avoidPatterns: result.avoidPatterns || [],
                    lastCondensedAt: Date.now()
                };
                this.setCondensedMemory(this.condensedMemory);
                console.log(`[ContextManager] Memory Condensed: "${result.summary}"`);

                const { pineconeService } = await import('./pineconeService');
                // 3. Upsert to Pinecone (Persona Vector)
                // We embed the SUMMARY so we can find dishes that match this persona conceptually
                await pineconeService.upsert([{
                    id: `user_${userId}_persona`,
                    text: `User Persona: ${result.summary}. Likes: ${Object.keys(result.affinities || {}).join(', ')}. Avoids: ${result.avoidPatterns?.join(', ')}`,
                    metadata: {
                        type: 'user_persona',
                        userId,
                        raw_summary: result.summary
                    }
                }]);
            }
        } catch (e) {
            console.error("[ContextManager] Condensation Failed:", e);
        }
    }
}

export const contextManager = new ContextManagerService();

