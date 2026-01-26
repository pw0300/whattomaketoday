import { describe, it, expect } from 'vitest';
import { getBestPairing } from './sideDishService';
import { DietaryPreference } from '../types';

describe('sideDishService', () => {
    it('should suggest high protein pairing for protein deficit', () => {
        const deficit = { protein: 20, carbs: 0, fat: 0, calories: 100 };
        const pairing = getBestPairing(deficit, 'Non-Vegetarian');

        expect(pairing).not.toBeNull();
        expect(pairing?.id).toBe('boiled-eggs'); // Expect eggs as best protein match
    });

    it('should suggest vegetarian protein for vegetarian diet', () => {
        const deficit = { protein: 20, carbs: 0, fat: 0, calories: 100 };
        const pairing = getBestPairing(deficit, 'Vegetarian');

        expect(pairing).not.toBeNull();
        expect(pairing?.tags).not.toContain('Non-Vegetarian');
        expect(pairing?.id).not.toBe('boiled-eggs'); // Eggs are non-veg/eggetarian usually
        // Note: In our mock, eggs are Non-Veg. 
        // Best veg match might be Whey or Paneer
    });

    it('should suggest nuts for higher fat/calorie deficit', () => {
        const deficit = { protein: 5, carbs: 5, fat: 15, calories: 150 };
        const pairing = getBestPairing(deficit, 'Vegetarian');

        expect(pairing).not.toBeNull();
        expect(pairing?.id).toBe('almonds');
    });

    it('should return null if deficit is negligible', () => {
        const deficit = { protein: 2, carbs: 0, fat: 0, calories: 20 };
        const pairing = getBestPairing(deficit, 'Any');

        expect(pairing).toBeNull();
    });

    it('should respect vegan constraints', () => {
        const deficit = { protein: 20, carbs: 0, fat: 0, calories: 100 };
        const pairing = getBestPairing(deficit, 'Vegan');

        if (pairing) {
            expect(pairing.tags).not.toContain('Dairy');
            expect(pairing.id).not.toBe('greek-yogurt');
            expect(pairing.id).not.toBe('whey-shake');
        }
    });
});
