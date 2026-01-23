/**
 * Streaming Response Service
 * 
 * Provides 3-tier progressive response delivery for reduced perceived latency.
 * - Tier 1 (< 200ms): Safe-bet dishes from Firebase cache
 * - Tier 2 (< 1s): Persona-based recommendations with light processing
 * - Tier 3 (< 2s): Full personalized LLM-generated results
 */

import { Dish, UserProfile } from '../types';
import { getCachedDishes } from './geminiService';
import { personaService } from './personaService';
import { pineconeService } from './pineconeService';
import { knowledgeGraph } from './knowledgeGraphService';

export interface StreamingOptions {
    count: number;
    userId?: string;
    isNewUser: boolean;
}

export interface TierResult {
    tier: 1 | 2 | 3;
    dishes: Dish[];
    latencyMs: number;
    source: string;
}

type TierCallback = (result: TierResult) => void;

class StreamingResponseService {
    private preWarmedDishes: Map<string, Dish[]> = new Map();

    /**
     * Generate dishes with 3-tier streaming for progressive loading.
     * Each tier calls the callback as it completes.
     */
    async generateStreamingDishes(
        count: number,
        userProfile: UserProfile,
        options: StreamingOptions,
        onTierReady: TierCallback
    ): Promise<void> {
        const { userId, isNewUser } = options;
        const startTime = Date.now();

        // === TIER 1: Instant Safe Bets (< 200ms) ===
        // Return cached dishes immediately without any LLM processing
        try {
            const tier1Start = Date.now();

            // Check for pre-warmed dishes first
            let tier1Dishes: Dish[] = [];
            if (userId && this.preWarmedDishes.has(userId)) {
                const preWarmed = this.preWarmedDishes.get(userId) || [];
                tier1Dishes = preWarmed.splice(0, Math.min(3, count));
                console.log(`[Streaming] Tier 1: Served ${tier1Dishes.length} pre-warmed dishes`);
            }

            // Fill from Firebase cache if needed
            if (tier1Dishes.length < 3) {
                const needed = 3 - tier1Dishes.length;
                const cached = await getCachedDishes(needed, userProfile);
                tier1Dishes = [...tier1Dishes, ...cached];
            }

            if (tier1Dishes.length > 0) {
                onTierReady({
                    tier: 1,
                    dishes: tier1Dishes,
                    latencyMs: Date.now() - tier1Start,
                    source: 'cache'
                });
            }
        } catch (error) {
            console.warn('[Streaming] Tier 1 failed:', error);
        }

        // === TIER 2: Persona-based Fast Results (< 1s) ===
        // Use persona and light vector search without full LLM generation
        try {
            const tier2Start = Date.now();
            let tier2Dishes: Dish[] = [];

            if (isNewUser && userId) {
                // For new users, use persona-based recommendations
                const { personaId } = await personaService.initializeNewUser(userId, userProfile);
                const sampleDishes = personaService.getSampleDishes(personaId);

                // Try to find these dishes in vector DB
                for (const dishName of sampleDishes.slice(0, 3)) {
                    const results = await pineconeService.search(dishName, 'dishes', 1);
                    if (results.length > 0 && results[0].metadata) {
                        const dish = results[0].metadata as unknown as Dish;
                        if (dish.name && dish.description) {
                            tier2Dishes.push(dish);
                        }
                    }
                }
            } else {
                // For returning users, use semantic search with profile context
                const queryText = `${userProfile.cuisines.join(' ')} ${userProfile.dietaryPreference} dishes`;
                const similar = await pineconeService.search(queryText, 'dishes', 5);
                tier2Dishes = similar
                    .filter(m => m.score && m.score > 0.8)
                    .map(m => m.metadata as unknown as Dish)
                    .filter(d => d && d.name);
            }

            // Deduplicate with Tier 1
            const tier1Names = new Set((await getCachedDishes(10, userProfile)).map(d => d.name));
            tier2Dishes = tier2Dishes.filter(d => !tier1Names.has(d.name));

            if (tier2Dishes.length > 0) {
                onTierReady({
                    tier: 2,
                    dishes: tier2Dishes.slice(0, count),
                    latencyMs: Date.now() - tier2Start,
                    source: 'persona+vector'
                });
            }
        } catch (error) {
            console.warn('[Streaming] Tier 2 failed:', error);
        }

        // === TIER 3: Full Personalized Results (< 2s) ===
        // This is delegated to the caller to handle with full generateNewDishes()
        // We just signal that Tier 3 should start
        console.log(`[Streaming] Tiers 1-2 complete in ${Date.now() - startTime}ms. Tier 3 ready.`);
    }

    /**
     * Store pre-warmed dishes for a user.
     * Called by preWarmService after background generation.
     */
    setPreWarmedDishes(userId: string, dishes: Dish[]): void {
        this.preWarmedDishes.set(userId, dishes);
        console.log(`[Streaming] Stored ${dishes.length} pre-warmed dishes for user ${userId}`);
    }

    /**
     * Check if user has pre-warmed dishes available.
     */
    hasPreWarmedDishes(userId: string): boolean {
        const dishes = this.preWarmedDishes.get(userId);
        return dishes !== undefined && dishes.length > 0;
    }

    /**
     * Get count of pre-warmed dishes for a user.
     */
    getPreWarmedCount(userId: string): number {
        return this.preWarmedDishes.get(userId)?.length || 0;
    }

    /**
     * Clear pre-warmed dishes for a user (after they've been served).
     */
    clearPreWarmedDishes(userId: string): void {
        this.preWarmedDishes.delete(userId);
    }

    /**
     * Get instant recommendations for new users based on their persona.
     * No LLM call required - uses KG templates.
     */
    async getInstantRecommendations(profile: UserProfile, count: number = 3): Promise<Dish[]> {
        // Use KG for instant, zero-latency recommendations
        const templates = knowledgeGraph.suggestDishes({
            dietaryPreference: profile.dietaryPreference,
            allergens: profile.allergens,
            cuisines: profile.cuisines
        });

        // Convert templates to basic Dish objects
        const dishes: Dish[] = templates.slice(0, count).map((t, i) => ({
            id: `instant-${Date.now()}-${i}`,
            name: t.displayName,
            localName: t.displayName,
            description: `Traditional ${t.cuisine} dish`,
            cuisine: t.cuisine,
            type: 'Dinner' as const,
            image: '',
            macros: { calories: 300, protein: 15, carbs: 40, fat: 10 },
            ingredients: [],
            instructions: [],
            tags: t.dietaryTags,
            allergens: [],
            matchScore: 80
        }));

        return dishes;
    }
}

// Singleton instance
export const streamingResponseService = new StreamingResponseService();
