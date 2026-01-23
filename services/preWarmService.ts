/**
 * Pre-Warm Service
 * 
 * Background pre-generation of recommendations during/after onboarding.
 * Ensures new users get instant results on first interaction.
 */

import { Dish, UserProfile } from '../types';
import { streamingResponseService } from './streamingResponseService';
import { personaService } from './personaService';
import { knowledgeGraph } from './knowledgeGraphService';

interface PreWarmStatus {
    userId: string;
    startedAt: number;
    completedAt: number | null;
    dishCount: number;
    status: 'pending' | 'in_progress' | 'complete' | 'failed';
}

class PreWarmService {
    private preWarmStatus: Map<string, PreWarmStatus> = new Map();
    private preWarmQueue: Set<string> = new Set();

    /**
     * Start background pre-warming for a new user.
     * Called after onboarding completion.
     */
    async startPreWarming(userId: string, profile: UserProfile): Promise<void> {
        // Prevent duplicate pre-warming
        if (this.preWarmQueue.has(userId)) {
            console.log(`[PreWarm] User ${userId} already in queue, skipping.`);
            return;
        }

        this.preWarmQueue.add(userId);
        this.preWarmStatus.set(userId, {
            userId,
            startedAt: Date.now(),
            completedAt: null,
            dishCount: 0,
            status: 'in_progress'
        });

        console.log(`[PreWarm] Starting background generation for user ${userId}...`);

        try {
            // 1. Get assigned persona
            const personaId = personaService.assignPersona(profile);
            const persona = personaService.getPersona(personaId);

            if (!persona) {
                throw new Error(`Persona not found: ${personaId}`);
            }

            // 2. Get safe dish candidates from KG (fast, no LLM)
            const kgCandidates = knowledgeGraph.suggestDishes({
                dietaryPreference: profile.dietaryPreference,
                allergens: profile.allergens,
                cuisines: profile.cuisines
            });

            // 3. Build initial dishes from KG templates + persona preferences
            const preWarmedDishes: Dish[] = [];

            // Add KG-based dishes
            for (const template of kgCandidates.slice(0, 8)) {
                const dish: Dish = {
                    id: `prewarm-kg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: template.displayName,
                    localName: template.displayName,
                    description: `Traditional ${template.cuisine} dish - ${profile.dietaryPreference}`,
                    cuisine: template.cuisine,
                    type: this.inferMealType(template.displayName),
                    image: '',
                    macros: this.estimateMacros(template),
                    ingredients: [],
                    instructions: [],
                    tags: template.dietaryTags,
                    healthTags: this.generateHealthTags(profile, template),
                    allergens: [],
                    matchScore: 85 + Math.floor(Math.random() * 10),
                    generatedAt: Date.now()
                };
                preWarmedDishes.push(dish);
            }

            // Add persona sample dishes
            const sampleDishes = persona.sampleDishes || [];
            for (const dishName of sampleDishes.slice(0, 4)) {
                const dish: Dish = {
                    id: `prewarm-persona-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: dishName,
                    localName: dishName,
                    description: `${persona.name} style - ${persona.description}`,
                    cuisine: Object.keys(persona.cuisineWeights)[0] || 'Fusion',
                    type: 'Dinner',
                    image: '',
                    macros: { calories: 350, protein: 20, carbs: 35, fat: 12 },
                    ingredients: [],
                    instructions: [],
                    tags: Object.keys(persona.preferences).map(p => p.replace('_', ' ')),
                    healthTags: [],
                    allergens: [],
                    matchScore: 90,
                    generatedAt: Date.now()
                };
                preWarmedDishes.push(dish);
            }

            // 4. Store pre-warmed dishes for streaming service
            streamingResponseService.setPreWarmedDishes(userId, preWarmedDishes);

            // 5. Update status
            const status = this.preWarmStatus.get(userId);
            if (status) {
                status.completedAt = Date.now();
                status.dishCount = preWarmedDishes.length;
                status.status = 'complete';
            }

            console.log(`[PreWarm] Complete for user ${userId}: ${preWarmedDishes.length} dishes in ${Date.now() - (status?.startedAt || Date.now())}ms`);

        } catch (error) {
            console.error(`[PreWarm] Failed for user ${userId}:`, error);
            const status = this.preWarmStatus.get(userId);
            if (status) {
                status.status = 'failed';
            }
        } finally {
            this.preWarmQueue.delete(userId);
        }
    }

    /**
     * Check if pre-warming is complete for a user.
     */
    isPreWarmComplete(userId: string): boolean {
        const status = this.preWarmStatus.get(userId);
        return status?.status === 'complete';
    }

    /**
     * Get pre-warm status for a user.
     */
    getStatus(userId: string): PreWarmStatus | null {
        return this.preWarmStatus.get(userId) || null;
    }

    /**
     * Get pre-warmed dishes (proxies to streaming service).
     */
    getPreWarmedDishes(userId: string): number {
        return streamingResponseService.getPreWarmedCount(userId);
    }

    /**
     * Infer meal type from dish name.
     */
    private inferMealType(dishName: string): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
        const lowerName = dishName.toLowerCase();
        if (lowerName.includes('breakfast') || lowerName.includes('toast') ||
            lowerName.includes('paratha') || lowerName.includes('poha') ||
            lowerName.includes('idli') || lowerName.includes('dosa')) {
            return 'Breakfast';
        }
        if (lowerName.includes('snack') || lowerName.includes('pakora') ||
            lowerName.includes('chaat') || lowerName.includes('samosa')) {
            return 'Snack';
        }
        if (lowerName.includes('rice') || lowerName.includes('thali') ||
            lowerName.includes('dal')) {
            return 'Lunch';
        }
        return 'Dinner';
    }

    /**
     * Estimate macros based on dish template.
     */
    private estimateMacros(template: any): { calories: number; protein: number; carbs: number; fat: number } {
        const base = { calories: 300, protein: 15, carbs: 40, fat: 10 };

        // Adjust based on ingredients/tags
        if (template.dietaryTags?.includes('Vegetarian')) {
            base.protein -= 5;
        }
        if (template.dietaryTags?.includes('Non-Vegetarian')) {
            base.protein += 10;
        }

        return base;
    }

    /**
     * Generate health tags based on user conditions.
     */
    private generateHealthTags(profile: UserProfile, template: any): string[] {
        const tags: string[] = [];

        if (profile.conditions.includes('Diabetes' as any)) {
            tags.push('Diabetes-Friendly');
        }
        if (profile.conditions.includes('PCOS' as any)) {
            tags.push('PCOS-Safe');
        }
        if (profile.dietaryPreference === 'Vegan') {
            tags.push('Plant-Based');
        }

        return tags;
    }
}

// Singleton instance
export const preWarmService = new PreWarmService();
