import { describe, it, expect } from 'vitest';
import {
    hasSeenDish,
    filterUnseenDishes,
    analyzeUserPreferences,
    UserHistory
} from './userHistoryService';
import { Dish } from '../types';

// --- hasSeenDish Tests ---
describe('hasSeenDish - Seen Dish Detection', () => {

    it('should detect exact match', () => {
        const shownDishes = ['Dal Fry', 'Paneer Tikka', 'Chicken Biryani'];
        expect(hasSeenDish('Dal Fry', shownDishes)).toBe(true);
    });

    it('should be case insensitive', () => {
        const shownDishes = ['Dal Fry', 'Paneer Tikka'];
        expect(hasSeenDish('dal fry', shownDishes)).toBe(true);
        expect(hasSeenDish('DAL FRY', shownDishes)).toBe(true);
        expect(hasSeenDish('DaL fRy', shownDishes)).toBe(true);
    });

    it('should handle whitespace trimming', () => {
        const shownDishes = ['Dal Fry', 'Paneer Tikka'];
        expect(hasSeenDish(' Dal Fry ', shownDishes)).toBe(true);
        expect(hasSeenDish('Dal Fry  ', shownDishes)).toBe(true);
    });

    it('should return false for unseen dish', () => {
        const shownDishes = ['Dal Fry', 'Paneer Tikka'];
        expect(hasSeenDish('Butter Chicken', shownDishes)).toBe(false);
    });

    it('should return false for empty shown list', () => {
        expect(hasSeenDish('Dal Fry', [])).toBe(false);
    });

    it('should not partial match', () => {
        const shownDishes = ['Dal Fry'];
        expect(hasSeenDish('Dal', shownDishes)).toBe(false);
        expect(hasSeenDish('Fry', shownDishes)).toBe(false);
    });
});

// --- filterUnseenDishes Tests ---
describe('filterUnseenDishes - Unseen Dish Filtering', () => {

    const createDish = (name: string): Dish => ({
        id: name.toLowerCase().replace(/\s/g, '-'),
        name,
        localName: name,
        description: 'Test description',
        cuisine: 'Indian',
        type: 'Lunch',
        image: '',
        macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        ingredients: [],
        instructions: [],
        tags: [],
        allergens: [],
        isStaple: false
    });

    it('should filter out seen dishes', () => {
        const dishes = [
            createDish('Dal Fry'),
            createDish('Paneer Tikka'),
            createDish('Butter Chicken')
        ];
        const shown = ['Dal Fry', 'Paneer Tikka'];

        const result = filterUnseenDishes(dishes, shown);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Butter Chicken');
    });

    it('should preserve all dishes when none are seen', () => {
        const dishes = [
            createDish('Dal Fry'),
            createDish('Paneer Tikka')
        ];
        const shown: string[] = [];

        const result = filterUnseenDishes(dishes, shown);

        expect(result).toHaveLength(2);
    });

    it('should return empty array when all dishes are seen', () => {
        const dishes = [
            createDish('Dal Fry'),
            createDish('Paneer Tikka')
        ];
        const shown = ['Dal Fry', 'Paneer Tikka'];

        const result = filterUnseenDishes(dishes, shown);

        expect(result).toHaveLength(0);
    });

    it('should handle empty dishes array', () => {
        const result = filterUnseenDishes([], ['Dal Fry']);
        expect(result).toHaveLength(0);
    });

    it('should handle case insensitive filtering', () => {
        const dishes = [createDish('Dal Fry')];
        const shown = ['dal fry'];

        const result = filterUnseenDishes(dishes, shown);

        expect(result).toHaveLength(0);
    });
});

// --- analyzeUserPreferences Edge Cases ---
describe('analyzeUserPreferences - Edge Cases', () => {

    it('should handle history with empty arrays', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [],
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        expect(result).toBe('');
    });

    it('should handle undefined likedDishes', () => {
        const history = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: undefined as any,
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history as UserHistory);
        expect(result).toBe('');
    });

    it('should limit cuisines to top 3', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [
                { name: 'D1', cuisine: 'Indian', tags: [], timestamp: new Date() },
                { name: 'D2', cuisine: 'Indian', tags: [], timestamp: new Date() },
                { name: 'D3', cuisine: 'Thai', tags: [], timestamp: new Date() },
                { name: 'D4', cuisine: 'Chinese', tags: [], timestamp: new Date() },
                { name: 'D5', cuisine: 'Mexican', tags: [], timestamp: new Date() },
                { name: 'D6', cuisine: 'Italian', tags: [], timestamp: new Date() }
            ],
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        // Should contain at most 3 cuisines in USER LOVES
        const lovesMatch = result.match(/USER LOVES: ([^.]+)/);
        if (lovesMatch) {
            const cuisines = lovesMatch[1].split(', ');
            expect(cuisines.length).toBeLessThanOrEqual(3);
        }
    });

    it('should limit tags to top 5', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [
                { name: 'D1', cuisine: 'Indian', tags: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], timestamp: new Date() }
            ],
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        const qualitiesMatch = result.match(/PREFERRED QUALITIES: ([^.]+)/);
        if (qualitiesMatch) {
            const tags = qualitiesMatch[1].split(', ');
            expect(tags.length).toBeLessThanOrEqual(5);
        }
    });
});
