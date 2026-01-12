
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCookInstructions } from './geminiService';
import { DayPlan } from '../types';

// Mock global fetch
global.fetch = vi.fn();

describe('geminiService - Cook Instructions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate Hindi instructions for a valid plan', async () => {
        // Mock successful API response
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => "Namaste! Kal Lunch me Dal banao."
        });

        const mockPlan: DayPlan[] = [
            {
                day: 'Monday',
                lunch: { id: '1', name: 'Dal Fry', localName: 'Dal', type: 'Lunch', cuisine: 'Indian', description: '', ingredients: [], instructions: [], macros: { protein: 0, carbs: 0, fat: 0, calories: 0 }, isStaple: false },
                dinner: null,
                isLocked: false
            }
        ];

        const result = await generateCookInstructions(mockPlan);

        expect(result).toBe("Namaste! Kal Lunch me Dal banao.");
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Dal Fry')
        }));
    });

    it('should return null if plan is empty', async () => {
        const result = await generateCookInstructions([]);
        expect(result).toBeNull();
    });

    it('should handle API failure', async () => {
        (global.fetch as any).mockRejectedValue(new Error("API Fail"));
        const mockPlan: DayPlan[] = [
            {
                day: 'Monday',
                lunch: { id: '1', name: 'Dal Fry', localName: 'Dal', type: 'Lunch', cuisine: 'Indian', description: '', ingredients: [], instructions: [], macros: { protein: 0, carbs: 0, fat: 0, calories: 0 }, isStaple: false },
                dinner: null,
                isLocked: false
            }
        ];
        const result = await generateCookInstructions(mockPlan);
        expect(result).toBeNull();
    });
});
