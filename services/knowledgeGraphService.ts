import { Allergen } from '../types.ts';

// Import JSON data
import ingredientsMaster from '../data/ingredients_master_list.json';

/**
 * Knowledge Graph Service
 * Provides ingredient validation, substitution suggestions, and pantry intelligence
 */

export interface IngredientNode {
    displayName: string;
    category: string;
    tier: 'Common' | 'Exotic';
    allergens: string[];
    seasonality: string;
    substitutes: string[];
    commonIn: string[];
    nutritionProfile: string;
    // New Sensory & Health Attributes (Phase 8)
    flavorProfile?: 'Sweet' | 'Sour' | 'Salty' | 'Bitter' | 'Umami' | 'Spicy' | 'Savory' | 'Neutral';
    texture?: 'Crunchy' | 'Soft' | 'Creamy' | 'Chewy' | 'Liquid' | 'Firm';
    glycemicIndex?: 'Low' | 'Medium' | 'High';
    storageMetrics?: {
        shelfLife: string; // e.g. "1 week"
        method: 'Pantry' | 'Fridge' | 'Freezer';
    };
}

export interface DishTemplate {
    displayName: string;
    essentialIngredients: string[];
    cuisine: string;
    dietaryTags: string[];
}

class KnowledgeGraphService {
    private ingredients: Record<string, IngredientNode>;
    private dishTemplates: Record<string, DishTemplate>;

    constructor() {
        this.ingredients = ingredientsMaster.ingredients as Record<string, IngredientNode>;
        this.dishTemplates = ingredientsMaster.dishTemplates as Record<string, DishTemplate>;
    }

    /**
     * Normalize ingredient name for lookup
     */
    private normalizeKey(name: string): string {
        return name.toLowerCase().trim().replace(/\s+/g, '-');
    }

    /**
     * Validate if an ingredient exists in the knowledge graph
     */
    validateIngredient(ingredientName: string): boolean {
        const key = this.normalizeKey(ingredientName);
        return key in this.ingredients;
    }

    /**
     * Get ingredient details from the graph
     */
    getIngredient(ingredientName: string): IngredientNode | null {
        const key = this.normalizeKey(ingredientName);
        return this.ingredients[key] || null;
    }

    /**
     * Suggest substitutes for an ingredient
     */
    getSubstitutes(ingredientName: string): string[] {
        const ingredient = this.getIngredient(ingredientName);
        if (!ingredient) return [];

        return ingredient.substitutes.map(subKey => {
            const sub = this.ingredients[subKey];
            return sub ? sub.displayName : subKey;
        });
    }

    /**
     * Check if ingredient contains specific allergen
     */
    hasAllergen(ingredientName: string, allergen: Allergen): boolean {
        const ingredient = this.getIngredient(ingredientName);
        if (!ingredient) return false;

        return ingredient.allergens.includes(allergen);
    }

    /**
     * Get all ingredients safe for user (no allergens)
     */
    getSafeIngredients(userAllergens: Allergen[]): IngredientNode[] {
        return Object.values(this.ingredients).filter(ing =>
            !ing.allergens.some(a => userAllergens.includes(a as Allergen))
        );
    }

    /**
     * Suggest dishes based on available pantry items
     */
    suggestDishesFromPantry(pantryItems: string[]): DishTemplate[] {
        const normalizedPantry = pantryItems.map(item => this.normalizeKey(item));

        return Object.values(this.dishTemplates).filter(dish => {
            // Check if at least 70% of essential ingredients are available
            const available = dish.essentialIngredients.filter(ing =>
                normalizedPantry.includes(ing)
            );

            return available.length / dish.essentialIngredients.length >= 0.7;
        });
    }

    /**
     * Get missing ingredients for a dish
     */
    getMissingIngredients(dishKey: string, pantryItems: string[]): string[] {
        const dish = this.dishTemplates[dishKey];
        if (!dish) return [];

        const normalizedPantry = pantryItems.map(item => this.normalizeKey(item));

        return dish.essentialIngredients
            .filter(ing => !normalizedPantry.includes(ing))
            .map(ing => this.ingredients[ing]?.displayName || ing);
    }

    /**
     * Telemetry: Log KG utilization
     */
    logUsage(action: string, ingredientName?: string) {
        console.log(`[KG Telemetry] ${action}${ingredientName ? ` - ${ingredientName}` : ''}`);
    }

    /**
     * LEARN: Extract new ingredients from a generated Dish
     * In a full implementation, this could write to a Firestore 'pending_ingredients' collection.
     */
    learnFromDish(dish: { ingredients: { name: string, category: string }[] }) {
        dish.ingredients.forEach(ing => {
            if (!this.validateIngredient(ing.name)) {
                // Determine inferred details (basic heuristic)
                const inferredAllergen: Allergen[] = [];
                if (ing.category === 'Dairy') inferredAllergen.push(Allergen.Dairy);
                if (ing.category === 'Protein' && (ing.name.toLowerCase().includes('nut') || ing.name.toLowerCase().includes('cashew'))) inferredAllergen.push(Allergen.Nuts);

                console.log(`[KG Learning] Learned new ingredient from Recipe: ${ing.name} (${ing.category})`);

                // Add to temporary in-memory graph (persists for session)
                this.ingredients[this.normalizeKey(ing.name)] = {
                    displayName: ing.name,
                    category: ing.category,
                    tier: 'Exotic', // Default new items to Exotic
                    allergens: inferredAllergen, // Inferred
                    seasonality: 'Year-round',
                    substitutes: [],
                    commonIn: [],
                    nutritionProfile: 'unknown'
                };
            }
        });
    }

    /**
     * STRICT FILTER: Validate a full dish against user constraints using the Graph
     */
    isDishContextSafe(dish: { ingredients: { name: string }[] }, userAllergens: Allergen[]): boolean {
        // 1. Check direct ingredients
        for (const ing of dish.ingredients) {
            const node = this.getIngredient(ing.name);
            if (node) {
                const conflicts = node.allergens.filter(a => userAllergens.includes(a as Allergen));
                if (conflicts.length > 0) {
                    console.log(`[KG Guard] Unsafe Dish: Ingredient '${ing.name}' contains ${conflicts.join(', ')}`);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * SMART GENERATION: Suggest valid dishes from the graph based on user profile
     * This allows us to "Seed" the LLM with a known-valid dish name, reducing hallucinations/retries.
     */
    suggestDishes(profile: { dietaryPreference: string, allergens: string[], cuisines?: string[] }): DishTemplate[] {
        return Object.values(this.dishTemplates).filter(dish => {
            // 1. Check Diet
            if (profile.dietaryPreference !== 'Any') {
                // Map 'Vegetarian' -> 'Vegetarian', 'Vegan', etc.
                // Simple exact match or "compatible" logic
                if (profile.dietaryPreference === 'Vegetarian' && !dish.dietaryTags.includes('Vegetarian') && !dish.dietaryTags.includes('Vegan')) return false;
                if (profile.dietaryPreference === 'Vegan' && !dish.dietaryTags.includes('Vegan')) return false;
                if (profile.dietaryPreference === 'Non-Vegetarian') { /* Any is fine */ }
            }

            // 2. Check Allergens (Deep check on essential ingredients)
            // If any essential ingredient has a banned allergen, exclude dish
            const hasAllergen = dish.essentialIngredients.some(ingName => {
                const node = this.getIngredient(ingName);
                if (!node) return false;
                return node.allergens.some(a => profile.allergens.includes(a));
            });

            if (hasAllergen) return false;

            // 3. Check Cuisine preference (if specified)
            if (profile.cuisines && profile.cuisines.length > 0) {
                const matchesCuisine = profile.cuisines.some(c =>
                    dish.cuisine?.toLowerCase().includes(c.toLowerCase()) ||
                    c.toLowerCase().includes(dish.cuisine?.toLowerCase() || '')
                );
                if (!matchesCuisine) return false;
            }

            return true;
        });
    }
    /**
     * CONTEXT OPTIMIZATION: Get minified safety rules for LLM context
     * Only returns rules relevant to the specific user's constraints.
     */
    getRelevantSafetyContext(userAllergens: string[], userConditions: string[]): string {
        const rules: string[] = [];
        const normalizedAllergens = userAllergens.map(a => a.toLowerCase());

        // 1. Allergen Rules
        if (normalizedAllergens.length > 0) {
            Object.values(this.ingredients).forEach(ing => {
                const conflicts = ing.allergens.filter(a => normalizedAllergens.includes(a.toLowerCase()));
                if (conflicts.length > 0) {
                    const subs = ing.substitutes.join(', ') || 'Avoid';
                    rules.push(`- ${ing.displayName}: Contains ${conflicts.join(', ')}. Substitute with: ${subs}`);
                }
            });
        }

        // 2. Condition Rules (Basic logic)
        if (userConditions.some(c => c.includes('Diabetes'))) {
            rules.push("- General Diabetes Rule: Minimize sugar, white rice, potato. Prioritize fiber/protein.");
            Object.values(this.ingredients).forEach(ing => {
                if (ing.glycemicIndex === 'High') {
                    rules.push(`- ${ing.displayName}: High GI. Use sparingly.`);
                }
            });
        }

        if (userConditions.some(c => c.includes('Hypertension'))) {
            rules.push("- General Hypertension Rule: Low sodium. Minimize salt, pickles, processed sauces.");
        }

        return rules.length > 0 ? "RELEVANT INGREDIENT RULES:\n" + rules.join('\n') : "No specific ingredient constraints found in KG.";
    }
}

// Singleton instance
export const knowledgeGraph = new KnowledgeGraphService();
