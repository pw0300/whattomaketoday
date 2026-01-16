import { Allergen } from '../types';

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
}

// Singleton instance
export const knowledgeGraph = new KnowledgeGraphService();
