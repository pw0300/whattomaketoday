import { describe, it, expect, beforeEach } from 'vitest';
import { knowledgeGraph, IngredientNode } from './knowledgeGraphService';
import { Allergen } from '../types';

describe('Knowledge Graph Service', () => {

    // Reset or re-instantiate if needed, but it's a singleton.
    // For unit tests, we rely on its initial state from JSON.

    it('should validate known ingredients', () => {
        expect(knowledgeGraph.validateIngredient('Paneer')).toBe(true);
        expect(knowledgeGraph.validateIngredient('Chicken')).toBe(true);
        expect(knowledgeGraph.validateIngredient('Unobtainium')).toBe(false);
    });

    it('should learn new ingredients from dishes', () => {
        const weirdDish = {
            ingredients: [
                { name: 'Dragonfruit', category: 'Produce' },
                { name: 'Cashew Cheese', category: 'Protein' } // Should trigger Nut inference
            ]
        };

        // Before learning
        expect(knowledgeGraph.validateIngredient('Dragonfruit')).toBe(false);

        // Learn
        knowledgeGraph.learnFromDish(weirdDish);

        // After learning
        expect(knowledgeGraph.validateIngredient('Dragonfruit')).toBe(true);
        const newIng = knowledgeGraph.getIngredient('Dragonfruit');
        expect(newIng?.tier).toBe('Exotic');
        expect(newIng?.category).toBe('Produce');

        // Check Inference
        const cashewCheese = knowledgeGraph.getIngredient('Cashew Cheese');
        expect(cashewCheese?.allergens).toContain(Allergen.Nuts);
    });

    it('should strict filter unsafe dishes', () => {
        // Setup User with Dairy Allergy
        const userAllergens = [Allergen.Dairy];

        // Safe Dish
        const safeDish = {
            ingredients: [
                { name: 'Chicken', category: 'Protein' }, // No allergens
                { name: 'Onion', category: 'Produce' }
            ]
        };

        // Unsafe Dish (Paneer is in master list as Dairy)
        const unsafeDish = {
            ingredients: [
                { name: 'Paneer', category: 'Dairy' },
                { name: 'Spinach', category: 'Produce' }
            ]
        };

        expect(knowledgeGraph.isDishContextSafe(safeDish, userAllergens)).toBe(true);
        expect(knowledgeGraph.isDishContextSafe(unsafeDish, userAllergens)).toBe(false);
    });
});
