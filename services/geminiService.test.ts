
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNewDishes, isValidDish, buildDynamicConstraintPrompt, buildRecipePrompt, buildSeededRecipePrompt } from './geminiService';

// Mock Firebase to prevent real cache from interfering
vi.mock('./firebaseService', () => ({
    db: null, // Disable Firestore cache
    auth: null
}));

// Mock userHistoryService
vi.mock('./userHistoryService', () => ({
    getShownDishNames: vi.fn().mockResolvedValue([]),
    getUserHistory: vi.fn().mockResolvedValue(null),
    analyzeUserPreferences: vi.fn().mockReturnValue(''),
    filterUnseenDishes: vi.fn((dishes) => dishes)
}));

// Mock knowledgeGraphService
vi.mock('./knowledgeGraphService', () => ({
    knowledgeGraph: {
        getRelevantSafetyContext: vi.fn().mockResolvedValue(''),
        suggestDishes: vi.fn().mockResolvedValue([]),
        isDishContextSafe: vi.fn().mockReturnValue(true)
    }
}));

// Mock pineconeService to prevent real vector search
vi.mock('./pineconeService', () => ({
    pineconeService: {
        search: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue(undefined),
        hybridSearch: vi.fn().mockResolvedValue([]),
        isAvailable: vi.fn().mockReturnValue(false)
    }
}));

// Mock contextManagerService
vi.mock('./contextManagerService', () => ({
    contextManager: {
        currentSession: null,
        condensedMemory: null,
        initSession: vi.fn(),
        getCondensedMemory: vi.fn().mockReturnValue(null),
        getOptimizedContext: vi.fn().mockReturnValue('')
    }
}));

// Mock global fetch
global.fetch = vi.fn();

// Mock retryWithBackoff to run immediately
vi.mock('../utils/asyncUtils', () => ({
    retryWithBackoff: vi.fn((fn) => fn()),
    chunkArray: vi.fn((arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    })
}));

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('isValidDish', () => {
        it('should validate a complete dish', () => {
            const validDish = {
                name: 'Paneer Tikka',
                description: 'Delicious grilled paneer with spices and yogurt marinade.',
                cuisine: 'North Indian',
                type: 'Dinner'
            };
            expect(isValidDish(validDish)).toBe(true);
        });

        it('should reject dish with missing name', () => {
            expect(isValidDish({ description: 'Test', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
        });

        it('should reject dish with short description', () => {
            expect(isValidDish({ name: 'Test', description: 'Short', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
        });

        it('should reject dish with null input', () => {
            expect(isValidDish(null)).toBe(false);
        });
    });

    describe('buildDynamicConstraintPrompt', () => {
        it('should build constraints from profile', async () => {
            const profile: any = {
                dietaryPreference: 'Vegetarian',
                allergens: ['Dairy', 'Nuts'],
                conditions: ['Diabetes'],
                cuisines: ['Italian', 'Mexican'],
                likedDishes: ['Pizza'],
                cuisineNotes: '' // required for async calls possibly
            };

            const result = await buildDynamicConstraintPrompt(profile);

            expect(result).toContain('Vegetarian');
            expect(result).toContain('Dairy');
            expect(result).toContain('Nuts');
            expect(result).toContain('Diabetes');
            expect(result).toContain('Italian');
        });

        it('should return empty for "Any" diet with no restrictions', async () => {
            const profile: any = {
                dietaryPreference: 'Any',
                allergens: [],
                conditions: [],
                cuisines: []
            };

            // It might return prompt for knowledge graph safety check even with Any,
            // but if no allergens/conditions, it should be minimal.
            // buildDynamicConstraintPrompt always calls loadKnowledgeGraph now.

            const result = await buildDynamicConstraintPrompt(profile);
            // If completely empty, it returns just what minimal logic adds.
            // The original test expected empty string. Let's see if that holds.
            // If logic changed to include optional parts or "Diet: Any" is skipped...
            // "Diet: Any" is skipped in code: if (profile.dietaryPreference !== 'Any') parts.push...
            // So result should be fairly empty if no other flags.

            // However, the function returns concatenated string. 
            // If parts is empty, context is empty.
            // Then optional parts... none.
            // So it should be empty.
            expect(result).toBe('');
        });
    });


    describe('generateNewDishes', () => {
        it('should generate dishes via API when cache is empty', async () => {
            // Mock window to pass check in secureGenerate
            (global as any).window = {};

            const mockResponse = {
                name: 'Test Dish',
                description: 'A delicious test dish with amazing flavors.',
                cuisine: 'Italian',
                type: 'Dinner',
                tags: ['Tasty'],
                healthTags: ['Healthy'],
                macros: { calories: 350 }
            };

            // Mock fetch to return success
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            });

            const profile: any = {
                likedDishes: [],
                allergens: [],
                conditions: [],
                cuisines: ['Italian'],
                dietaryPreference: 'Any'
            };

            const result = await generateNewDishes(2, profile);

            // Should return dishes (exact count depends on buffer logic)
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].name).toBe('Test Dish');
        });

        it('should handle API failure gracefully', async () => {
            (global.fetch as any).mockRejectedValue(new Error("Network Error"));

            const profile: any = {
                likedDishes: [],
                allergens: [],
                conditions: [],
                cuisines: [],
                dietaryPreference: 'Any'
            };

            const result = await generateNewDishes(1, profile);

            // Should return empty array, not crash
            expect(result).toHaveLength(0);
        });
    });
});

// --- isValidDish Tests ---
describe('isValidDish - Dish Validation', () => {

    it('should reject null', () => {
        expect(isValidDish(null)).toBe(false);
    });

    it('should reject undefined', () => {
        expect(isValidDish(undefined)).toBe(false);
    });

    it('should reject non-object', () => {
        expect(isValidDish('string')).toBe(false);
        expect(isValidDish(123)).toBe(false);
        expect(isValidDish([])).toBe(false);
    });

    it('should reject dish with missing name', () => {
        expect(isValidDish({ description: 'Good', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with empty name', () => {
        expect(isValidDish({ name: '', description: 'Good description here', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with name less than 2 chars', () => {
        expect(isValidDish({ name: 'A', description: 'Good description here', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with missing description', () => {
        expect(isValidDish({ name: 'Dal Fry', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with description less than 10 chars', () => {
        expect(isValidDish({ name: 'Dal Fry', description: 'Short', cuisine: 'Indian', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with missing cuisine', () => {
        expect(isValidDish({ name: 'Dal Fry', description: 'A delicious lentil dish', type: 'Lunch' })).toBe(false);
    });

    it('should reject dish with missing type', () => {
        expect(isValidDish({ name: 'Dal Fry', description: 'A delicious lentil dish', cuisine: 'Indian' })).toBe(false);
    });

    it('should accept valid dish with all fields', () => {
        expect(isValidDish({
            name: 'Dal Fry',
            description: 'A delicious lentil dish with aromatic spices',
            cuisine: 'Indian',
            type: 'Lunch'
        })).toBe(true);
    });

    it('should accept dish with extra fields', () => {
        expect(isValidDish({
            name: 'Dal Fry',
            description: 'A delicious lentil dish with aromatic spices',
            cuisine: 'Indian',
            type: 'Lunch',
            tags: ['Healthy'],
            macros: { calories: 300 }
        })).toBe(true);
    });
});

// --- Prompt Building Tests ---
describe('buildRecipePrompt - Recipe Generation Prompt', () => {

    it('should include CRITICAL prefix when constraints provided', () => {
        const prompt = buildRecipePrompt('Diet: Vegetarian. No: Nuts.');
        expect(prompt).toContain('CRITICAL:');
        expect(prompt).toContain('Diet: Vegetarian. No: Nuts.');
    });

    it('should include cuisine and technique in prompt', () => {
        const prompt = buildRecipePrompt('');
        // e.g. "Italian grilled dish"
        expect(prompt).toMatch(/(Italian|Thai|Indian|Chinese|Mediterranean)/);
        expect(prompt).toMatch(/(grilled|roasted|stir-fried|steamed|sautéed)/);
    });

    it('should NOT include verbose JSON schema in prompt text (handled by API)', () => {
        const prompt = buildRecipePrompt('');
        expect(prompt).not.toContain('Return JSON');
        expect(prompt).not.toContain('macros');
    });

    it('should NOT include rules section (handled by schema)', () => {
        const prompt = buildRecipePrompt('');
        expect(prompt).not.toContain('RULES');
    });

    it('should work with empty constraints', () => {
        const prompt = buildRecipePrompt('');
        expect(prompt).not.toContain('CRITICAL:');
        expect(prompt).toContain('dish');
    });

    it('should use user cuisines when provided', () => {
        const prompt = buildRecipePrompt('', ['Indian', 'Thai']);
        // Should contain one of the user's cuisines
        const hasUserCuisine = prompt.includes('Indian') || prompt.includes('Thai');
        expect(hasUserCuisine).toBe(true);
    });
});

describe('buildSeededRecipePrompt - Seeded Recipe Prompt', () => {

    it('should include specific dish name quoted', () => {
        const prompt = buildSeededRecipePrompt('Butter Chicken', '');
        expect(prompt).toContain('"Butter Chicken"');
        expect(prompt).toContain('Complete all schema fields');
    });

    it('should include constraints when provided', () => {
        const prompt = buildSeededRecipePrompt('Dal Makhani', 'Diet: Vegetarian');
        expect(prompt).toContain('CRITICAL INSTRUCTIONS');
        expect(prompt).toContain('Diet: Vegetarian');
    });
});
