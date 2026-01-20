import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildConstraintPrompt } from './geminiService';
import { analyzeUserPreferences, UserHistory } from './userHistoryService';
import { Allergen, HealthCondition, UserProfile } from '../types';

// --- buildConstraintPrompt Tests ---
describe('buildConstraintPrompt - Personalization', () => {

    const baseProfile: UserProfile = {
        name: 'Test User',
        allergens: [],
        allergenNotes: '',
        conditions: [],
        conditionNotes: '',
        cuisines: [],
        cuisineNotes: '',
        dietaryPreference: 'Any',
        customNotes: '',
        dailyTargets: { protein: 0, carbs: 0, fat: 0, calories: 0 },
        isOnboarded: true
    };

    it('should return empty string for blank profile', () => {
        const result = buildConstraintPrompt(baseProfile);
        expect(result).toBe('');
    });

    it('should include dietary preference (Vegetarian)', () => {
        const profile = { ...baseProfile, dietaryPreference: 'Vegetarian' as const };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Diet: Vegetarian');
    });

    it('should include dietary preference (Vegan)', () => {
        const profile = { ...baseProfile, dietaryPreference: 'Vegan' as const };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Diet: Vegan');
    });

    it('should NOT include "Any" dietary preference', () => {
        const profile = { ...baseProfile, dietaryPreference: 'Any' as const };
        const result = buildConstraintPrompt(profile);
        expect(result).not.toContain('Diet:');
    });

    it('should format allergens correctly with "No:" prefix', () => {
        const profile = { ...baseProfile, allergens: [Allergen.Dairy, Allergen.Nuts] };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('No: Dairy, Nuts');
    });

    it('should include allergen notes verbatim', () => {
        const profile = { ...baseProfile, allergenNotes: 'severe reaction to peanuts' };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Allergen Details: "severe reaction to peanuts"');
    });

    it('should include health conditions', () => {
        const profile = { ...baseProfile, conditions: [HealthCondition.Diabetes, HealthCondition.PCOS] };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Health: Diabetes, PCOS');
    });

    it('should include condition notes verbatim', () => {
        const profile = { ...baseProfile, conditionNotes: 'strict sugar control needed' };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Health Details: "strict sugar control needed"');
    });

    it('should highlight cuisine preferences with PRIORITIZE keyword', () => {
        const profile = { ...baseProfile, cuisines: ['Indian', 'Thai'] };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('PREFERRED CUISINES (PRIORITIZE): Indian, Thai');
    });

    it('should include cuisine notes with MUST HAVE', () => {
        const profile = { ...baseProfile, cuisineNotes: 'must have dal daily' };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('MUST HAVE: "must have dal daily"');
    });

    it('should include custom notes', () => {
        const profile = { ...baseProfile, customNotes: 'extra spicy please' };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Custom Note: "extra spicy please"');
    });

    it('should include health report summary', () => {
        const profile = { ...baseProfile, healthReportSummary: 'Low iron levels detected' };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Health Report: "Low iron levels detected"');
    });

    it('should exclude disliked dishes with "Do NOT suggest"', () => {
        const profile = { ...baseProfile, dislikedDishes: ['Pizza', 'Burger'] };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Do NOT suggest: Pizza, Burger');
    });

    it('should include liked dishes as "USER FAVORITES" (last 5 only)', () => {
        const profile = {
            ...baseProfile,
            likedDishes: ['Dish1', 'Dish2', 'Dish3', 'Dish4', 'Dish5', 'Dish6', 'Dish7']
        };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('USER FAVORITES (suggest similar): Dish3, Dish4, Dish5, Dish6, Dish7');
        expect(result).not.toContain('Dish1');
        expect(result).not.toContain('Dish2');
    });

    it('should combine multiple constraints correctly', () => {
        const profile: UserProfile = {
            ...baseProfile,
            dietaryPreference: 'Vegetarian',
            allergens: [Allergen.Gluten],
            cuisines: ['Indian'],
            conditions: [HealthCondition.Diabetes]
        };
        const result = buildConstraintPrompt(profile);
        expect(result).toContain('Diet: Vegetarian');
        expect(result).toContain('No: Gluten');
        expect(result).toContain('Health: Diabetes');
        expect(result).toContain('PREFERRED CUISINES (PRIORITIZE): Indian');
    });
});

// --- analyzeUserPreferences Tests ---
describe('analyzeUserPreferences - History Analysis', () => {

    it('should return empty string for null history', () => {
        const result = analyzeUserPreferences(null);
        expect(result).toBe('');
    });

    it('should return empty string for history with no liked dishes', () => {
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

    it('should extract top cuisines from liked dishes', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [
                { name: 'Dal Fry', cuisine: 'Indian', tags: [], timestamp: new Date() },
                { name: 'Paneer Tikka', cuisine: 'Indian', tags: [], timestamp: new Date() },
                { name: 'Pad Thai', cuisine: 'Thai', tags: [], timestamp: new Date() }
            ],
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        expect(result).toContain('USER LOVES:');
        expect(result).toContain('Indian');
    });

    it('should extract top tags from liked dishes', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [
                { name: 'Dish1', cuisine: 'Indian', tags: ['Spicy', 'Healthy'], timestamp: new Date() },
                { name: 'Dish2', cuisine: 'Indian', tags: ['Spicy', 'Quick'], timestamp: new Date() },
                { name: 'Dish3', cuisine: 'Thai', tags: ['Spicy'], timestamp: new Date() }
            ],
            dislikedDishes: [],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        expect(result).toContain('PREFERRED QUALITIES:');
        expect(result).toContain('Spicy');
    });

    it('should extract disliked cuisines for AVOID section', () => {
        const history: UserHistory = {
            userId: 'test',
            shownDishNames: [],
            likedDishes: [
                { name: 'Dal Fry', cuisine: 'Indian', tags: [], timestamp: new Date() }
            ],
            dislikedDishes: [
                { name: 'Sushi', cuisine: 'Japanese', tags: [], timestamp: new Date() },
                { name: 'Ramen', cuisine: 'Japanese', tags: [], timestamp: new Date() }
            ],
            lastUpdated: new Date()
        };
        const result = analyzeUserPreferences(history);
        expect(result).toContain('AVOID:');
        expect(result).toContain('Japanese');
    });
});
