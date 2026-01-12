
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNewDishes } from './geminiService';

// Mock global fetch
global.fetch = vi.fn();

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate dishes in parallel', async () => {
        const mockResponse = {
            id: '123',
            name: 'Test Dish',
            description: 'Delicious',
            ingredients: [],
            instructions: []
        };

        // Mock fetch to return success
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        // Mock User Profile
        const profile: any = {
            likedDishes: ['Pizza'],
            allergens: [],
            conditions: [],
            cuisines: ['Italian'],
            dietaryPreference: 'Any'
        };

        const result = await generateNewDishes(2, profile);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Test Dish');
        expect(global.fetch).toHaveBeenCalledTimes(2); // 2 parallel calls
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

        expect(result).toHaveLength(0); // Should return empty array, not crash
    });
});
