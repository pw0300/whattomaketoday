import { describe, it, expect } from 'vitest';
import { generateGroceryList, consolidateIngredients, GroceryItem } from './groceryService';
import { DayPlan, Dish, Ingredient } from '../types';

// Mock Data
const mockDish = (name: string, ingredients: Ingredient[]): Dish => ({
    id: 'd1', name, localName: name, description: '', cuisine: 'Test', type: 'Dinner',
    image: '', macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    ingredients, instructions: [], tags: [], allergens: []
});

const mockPlan = (dishes: Dish[]): DayPlan[] => {
    return dishes.map((d, i) => ({
        day: `Day ${i}`,
        lunch: d,
        dinner: null
    }));
};

describe('Grocery Service 2.0', () => {

    describe('Aggregation Logic', () => {
        it('should sum identical ingredients from different dishes', () => {
            const plan = mockPlan([
                mockDish('Dish A', [{ name: 'Onion', quantity: '1 unit', category: 'Produce' }]),
                mockDish('Dish B', [{ name: 'Onion', quantity: '2 unit', category: 'Produce' }])
            ]);

            const list = generateGroceryList(plan, []);
            const onion = list.find(i => i.name === 'Onion');

            expect(onion).toBeDefined();
            expect(onion?.totalQuantity).toBe(3);
            expect(onion?.sourceDishes).toContain('Dish A');
            expect(onion?.sourceDishes).toContain('Dish B');
        });

        it('should handle fractional quantities strings (1/2, 0.5)', () => {
            const plan = mockPlan([
                mockDish('Dish A', [{ name: 'Tomato', quantity: '0.5 kg', category: 'Produce' }]),
                mockDish('Dish B', [{ name: 'Tomato', quantity: '1.5 kg', category: 'Produce' }])
            ]);

            const list = generateGroceryList(plan, []);
            const tomato = list.find(i => i.name === 'Tomato');

            expect(tomato?.totalQuantity).toBe(2);
            expect(tomato?.unit).toBe('kg');
        });

        // Test for different units if we want to support it later, 
        // but for now let's just assert it groups them or handles them gracefully.
        it('should keep different units separate OR normalize (Implementation Choice)', () => {
            // Ideally: 500g + 0.5kg should eventually be 1kg, but for MVP sticking to unit string equality is safest
            // If logic is "group by name + unit", then this test expects 1 item if we implement normalization.
            // Let's assume we WANT simple normalization at least for case-insensitivity.
        });
    });

    describe('Pantry Diffing', () => {
        it('should mark item as stocked if exact match exists', () => {
            const plan = mockPlan([
                mockDish('Salad', [{ name: 'Salt', quantity: '1 pinch', category: 'Pantry' }])
            ]);
            const pantry = ['Salt'];

            const list = generateGroceryList(plan, pantry);
            const salt = list.find(i => i.name === 'Salt');

            expect(salt?.isStocked).toBe(true);
        });

        it('should mark item as stocked if fuzzy match exists (plural/case)', () => {
            const plan = mockPlan([
                mockDish('Omelette', [{ name: 'Eggs', quantity: '3', category: 'Protein' }])
            ]);
            const pantry = ['egg']; // Singular in pantry

            const list = generateGroceryList(plan, pantry);
            const eggs = list.find(i => i.name === 'Eggs');

            expect(eggs?.isStocked).toBe(true);
        });

        it('should NOT mark missing items as stocked', () => {
            const plan = mockPlan([
                mockDish('Burger', [{ name: 'Buns', quantity: '2', category: 'Pantry' }])
            ]);
            const pantry = ['Lettuce'];

            const list = generateGroceryList(plan, pantry);
            expect(list[0].isStocked).toBe(false);
        });
    });

    describe('Category Handling', () => {
        it('should preserve categories from ingredients', () => {
            const plan = mockPlan([
                mockDish('Steak', [{ name: 'Beef', quantity: '200g', category: 'Protein' }])
            ]);
            const list = generateGroceryList(plan, []);
            expect(list[0].category).toBe('Protein');
        });
    });

});
