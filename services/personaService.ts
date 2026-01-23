/**
 * Persona Service
 * 
 * Manages user persona assignment for cold-start optimization.
 * Assigns new users to pre-computed persona templates for immediate personalization.
 */

import { UserProfile, HealthCondition } from '../types';
// persona_templates.json remains static for now as it is very small (<10KB)
import personaTemplates from '../data/persona_templates.json';

export interface Persona {
    id: string;
    name: string;
    description: string;
    filters: Record<string, any>;
    preferences: Record<string, number>;
    cuisineWeights: Record<string, number>;
    avoidPatterns: string[];
    sampleDishes: string[];
}

interface PersonaScore {
    personaId: string;
    score: number;
}

class PersonaService {
    private personas: Record<string, Persona>;
    private mappingRules: typeof personaTemplates.mappingRules;
    private personaEmbeddings: Map<string, number[]> = new Map();

    constructor() {
        this.personas = personaTemplates.personas as Record<string, Persona>;
        this.mappingRules = personaTemplates.mappingRules;
    }

    /**
     * Assign persona based on user profile from onboarding.
     * Uses a scoring system to find the best matching persona.
     */
    assignPersona(profile: UserProfile): string {
        const scores: PersonaScore[] = Object.keys(this.personas).map(personaId => ({
            personaId,
            score: this.calculatePersonaScore(personaId, profile)
        }));

        // Sort by score descending
        scores.sort((a, b) => b.score - a.score);

        const bestMatch = scores[0];
        console.log(`[PersonaService] Assigned persona: ${bestMatch.personaId} (score: ${bestMatch.score.toFixed(2)})`);

        return bestMatch.personaId;
    }

    /**
     * Calculate match score between a persona and user profile.
     */
    private calculatePersonaScore(personaId: string, profile: UserProfile): number {
        let score = 0;
        const persona = this.personas[personaId];

        // 1. Health condition matching (highest weight)
        profile.conditions.forEach(condition => {
            const conditionKey = condition as string;
            const mappedPersonas = this.mappingRules.conditionToPersona[conditionKey as keyof typeof this.mappingRules.conditionToPersona] || [];
            if (mappedPersonas.includes(personaId)) {
                score += 3.0; // High weight for health conditions
            }
        });

        // 2. Dietary preference matching
        const dietaryPersonas = this.mappingRules.dietaryToPersona[profile.dietaryPreference as keyof typeof this.mappingRules.dietaryToPersona] || [];
        if (dietaryPersonas.includes(personaId)) {
            score += 2.0;
        }

        // 3. Cuisine preference matching
        profile.cuisines.forEach(cuisine => {
            const cuisinePersonas = this.mappingRules.cuisineToPersona[cuisine as keyof typeof this.mappingRules.cuisineToPersona] || [];
            if (cuisinePersonas.includes(personaId)) {
                score += 1.0;
            }
            // Also check persona's cuisine weights
            if (persona.cuisineWeights[cuisine]) {
                score += persona.cuisineWeights[cuisine] * 0.5;
            }
        });

        // 4. Biometric-based adjustments
        if (profile.biometrics) {
            const { goal, activityLevel } = profile.biometrics;

            // Weight management persona for weight loss goal
            if (goal === 'Lose' && personaId === 'weight_management') {
                score += 2.0;
            }

            // Busy professional for active lifestyle
            if (activityLevel === 'Active' && personaId === 'busy_professional') {
                score += 1.0;
            }

            // Health enthusiast for moderate activity
            if (activityLevel === 'Moderate' && personaId === 'health_enthusiast') {
                score += 0.5;
            }
        }

        return score;
    }

    /**
     * Get persona details by ID.
     */
    getPersona(personaId: string): Persona | null {
        return this.personas[personaId] || null;
    }

    /**
     * Get all available personas.
     */
    getAllPersonas(): Persona[] {
        return Object.values(this.personas);
    }

    /**
     * Get pre-computed embedding for a persona.
     * Embeddings are generated and cached on first access.
     */
    async getPersonaEmbedding(personaId: string): Promise<number[] | null> {
        // Check cache first
        if (this.personaEmbeddings.has(personaId)) {
            return this.personaEmbeddings.get(personaId)!;
        }

        const persona = this.personas[personaId];
        if (!persona) return null;

        // Build embedding text from persona description and preferences
        const embeddingText = [
            `User Persona: ${persona.name}.`,
            persona.description,
            `Prefers: ${Object.keys(persona.preferences).join(', ')}.`,
            `Cuisines: ${Object.keys(persona.cuisineWeights).join(', ')}.`,
            `Avoids: ${persona.avoidPatterns.join(', ')}.`,
            `Sample dishes: ${persona.sampleDishes.join(', ')}.`
        ].join(' ');

        const { generateEmbedding } = await import('./geminiService');
        const embedding = await generateEmbedding(embeddingText);
        if (embedding) {
            this.personaEmbeddings.set(personaId, embedding);
        }

        return embedding;
    }

    /**
     * Initialize a new user in Pinecone with their assigned persona.
     * This seeds the user's vector profile for immediate personalization.
     */
    async initializeNewUser(userId: string, profile: UserProfile): Promise<{ personaId: string; success: boolean }> {
        try {
            // 1. Assign persona
            const personaId = this.assignPersona(profile);
            const persona = this.personas[personaId];

            if (!persona) {
                throw new Error(`Persona not found: ${personaId}`);
            }

            // 2. Build user vector text
            const vectorText = [
                `User Persona: ${persona.name}.`,
                `Dietary: ${profile.dietaryPreference}.`,
                `Cuisines: ${profile.cuisines.join(', ') || 'Various'}.`,
                `Health: ${profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None'}.`,
                `Allergens: ${profile.allergens.length > 0 ? profile.allergens.join(', ') : 'None'}.`,
                persona.description
            ].join(' ');

            // 3. Upsert to Pinecone
            const { pineconeService } = await import('./pineconeService');
            await pineconeService.upsert([{
                id: `user_${userId}_persona`,
                text: vectorText,
                metadata: {
                    type: 'user_persona',
                    userId,
                    personaId,
                    personaName: persona.name,
                    dietaryPreference: profile.dietaryPreference,
                    conditions: profile.conditions,
                    cuisines: profile.cuisines,
                    createdAt: Date.now()
                }
            }], 'users');

            console.log(`[PersonaService] Initialized user ${userId} with persona: ${personaId}`);

            return { personaId, success: true };
        } catch (error) {
            console.error('[PersonaService] Failed to initialize user:', error);
            return { personaId: 'busy_professional', success: false }; // Default fallback
        }
    }

    /**
     * Get recommended sample dishes for a persona.
     * Useful for pre-warming recommendations.
     */
    getSampleDishes(personaId: string): string[] {
        const persona = this.personas[personaId];
        return persona?.sampleDishes || [];
    }

    /**
     * Get cuisine weights for persona-based search boosting.
     */
    getCuisineWeights(personaId: string): Record<string, number> {
        const persona = this.personas[personaId];
        return persona?.cuisineWeights || {};
    }

    /**
     * Get avoid patterns for persona-based filtering.
     */
    getAvoidPatterns(personaId: string): string[] {
        const persona = this.personas[personaId];
        return persona?.avoidPatterns || [];
    }
}

// Singleton instance
export const personaService = new PersonaService();
