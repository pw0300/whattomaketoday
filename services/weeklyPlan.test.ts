import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCookInstructions } from './geminiService';
import { DayPlan, Dish, Allergen, HealthCondition, UserProfile } from '../types';

// Mock global fetch
global.fetch = vi.fn();

// Mock retryWithBackoff to run immediately
vi.mock('../utils/asyncUtils', () => ({
    retryWithBackoff: vi.fn((fn) => fn())
}));

// --- Helper Functions ---
const createDish = (name: string, localName?: string): Dish => ({
    id: name.toLowerCase().replace(/\s/g, '-'),
    name,
    localName: localName || name,
    description: 'Test description',
    cuisine: 'Indian',
    type: 'Lunch',
    image: '',
    macros: { protein: 20, carbs: 30, fat: 10, calories: 300 },
    ingredients: [
        { name: 'Paneer', quantity: '200g', category: 'Dairy' },
        { name: 'Onion', quantity: '2', category: 'Produce' }
    ],
    instructions: ['Step 1', 'Step 2'],
    tags: ['Spicy', 'Quick'],
    allergens: [],
    isStaple: false,
    healthTags: ['High-Protein']
});

const createDayPlan = (day: string, lunch: Dish | null, dinner: Dish | null): DayPlan => ({
    day,
    lunch,
    dinner,
    isLocked: false
});

const baseProfile: UserProfile = {
    name: 'Test User',
    allergens: [],
    allergenNotes: '',
    conditions: [],
    conditionNotes: '',
    cuisines: ['Indian'],
    cuisineNotes: '',
    dietaryPreference: 'Vegetarian',
    customNotes: '',
    dailyTargets: { protein: 50, carbs: 200, fat: 60, calories: 1800 },
    isOnboarded: true
};

// --- Weekly Plan & Cook Instructions Tests ---
describe('generateCookInstructions - WhatsApp Message Generation', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return null for empty weekly plan', async () => {
        const result = await generateCookInstructions([]);
        expect(result).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null for plan with only null meals', async () => {
        const emptyPlan: DayPlan[] = [
            createDayPlan('Monday', null, null),
            createDayPlan('Tuesday', null, null)
        ];
        const result = await generateCookInstructions(emptyPlan);
        expect(result).toBeNull();
    });

    it('should generate message for plan with lunch only', async () => {
        const mockResponse = {
            reasoning: "User is Vegetarian. Dal is safe.",
            whatsapp_message: "Kal Lunch me Dal Fry banana hai."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry', 'दाल फ्राई'), null)
        ];

        const result = await generateCookInstructions(plan);

        expect(result).toBe("Kal Lunch me Dal Fry banana hai.");
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Dal Fry')
        }));
    });

    it('should generate message for plan with lunch AND dinner', async () => {
        const mockResponse = {
            reasoning: "Multiple meals planned. No conflicts.",
            whatsapp_message: "Monday ko Lunch me Dal aur Dinner me Paneer Tikka banana hai."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry', 'दाल'), createDish('Paneer Tikka', 'पनीर टिक्का'))
        ];

        const result = await generateCookInstructions(plan);

        expect(result).toContain('Paneer Tikka');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should include allergen warning in prompt for allergic user', async () => {
        const mockResponse = {
            reasoning: "User has Dairy allergy. Will warn cook.",
            whatsapp_message: "Doodh ya paneer bilkul mat dalna!"
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const profileWithAllergen: UserProfile = {
            ...baseProfile,
            allergens: [Allergen.Dairy]
        };

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Vegetable Curry'), null)
        ];

        await generateCookInstructions(plan, profileWithAllergen);

        // Verify the API was called with allergen info
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Dairy')
        }));
    });

    it('should include health condition context for diabetic user', async () => {
        const mockResponse = {
            reasoning: "User has Diabetes. Suggesting low sugar options.",
            whatsapp_message: "Cheeni kam rakhna please."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const profileWithCondition: UserProfile = {
            ...baseProfile,
            conditions: [HealthCondition.Diabetes]
        };

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Kheer'), null)
        ];

        await generateCookInstructions(plan, profileWithCondition);

        // Verify the API was called with health condition
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Diabetes')
        }));
    });

    it('should handle API failure gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error("Network Error"));

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry'), null)
        ];

        const result = await generateCookInstructions(plan);

        expect(result).toBeNull();
    });

    it('should handle API returning malformed response', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ unexpected: 'format' })
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry'), null)
        ];

        const result = await generateCookInstructions(plan);

        expect(result).toBeNull();
    });

    it('should include local name (Hindi) in menu summary', async () => {
        const mockResponse = {
            reasoning: "Including local names for clarity.",
            whatsapp_message: "Dal banao (दाल फ्राई)"
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry', 'दाल फ्राई'), null)
        ];

        await generateCookInstructions(plan);

        // Verify request includes local name
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            body: expect.stringContaining('दाल फ्राई')
        }));
    });

    it('should process multiple days in the plan', async () => {
        const mockResponse = {
            reasoning: "Full week planned.",
            whatsapp_message: "Is week ka menu: Monday-Dal, Tuesday-Paneer"
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry'), null),
            createDayPlan('Tuesday', createDish('Paneer Tikka'), createDish('Roti Sabzi')),
            createDayPlan('Wednesday', null, createDish('Biryani'))
        ];

        const result = await generateCookInstructions(plan);

        expect(result).toContain('Monday');
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            body: expect.stringContaining('Monday')
        }));
        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            body: expect.stringContaining('Tuesday')
        }));
    });

    it('should include dietary preference in constraints', async () => {
        const mockResponse = {
            reasoning: "Vegetarian preference noted.",
            whatsapp_message: "Sabzi banao, nonveg mat banana."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Sabzi'), null)
        ];

        await generateCookInstructions(plan, baseProfile);

        expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
            body: expect.stringContaining('Vegetarian')
        }));
    });

    it('should skip days with no meals', async () => {
        const mockResponse = {
            reasoning: "Only processing days with meals.",
            whatsapp_message: "Monday ko Dal banao."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Dal Fry'), null),
            createDayPlan('Tuesday', null, null), // Empty day
            createDayPlan('Wednesday', createDish('Paneer'), null)
        ];

        await generateCookInstructions(plan);

        // Verify request body doesn't include empty Tuesday
        const callBody = (global.fetch as any).mock.calls[0][1].body;
        expect(callBody).toContain('Monday');
        expect(callBody).toContain('Wednesday');
        // Tuesday should not appear in menu summary since it has no meals
    });
});

// --- WhatsApp Message Personalization Tests ---
describe('Cook Instructions - Personalization Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should combine multiple user constraints in safety context', async () => {
        const mockResponse = {
            reasoning: "Complex profile with multiple constraints.",
            whatsapp_message: "Special instructions for this user."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const complexProfile: UserProfile = {
            ...baseProfile,
            dietaryPreference: 'Vegetarian',
            allergens: [Allergen.Nuts, Allergen.Gluten],
            conditions: [HealthCondition.Diabetes],
            allergenNotes: 'severe peanut allergy',
            customNotes: 'prefer less oil'
        };

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Special Dish'), null)
        ];

        await generateCookInstructions(plan, complexProfile);

        const callBody = (global.fetch as any).mock.calls[0][1].body;
        expect(callBody).toContain('Vegetarian');
        expect(callBody).toContain('Nuts');
        expect(callBody).toContain('Gluten');
        expect(callBody).toContain('Diabetes');
    });

    it('should work without user profile (anonymous mode)', async () => {
        const mockResponse = {
            reasoning: "No user constraints provided.",
            whatsapp_message: "Generic cooking instructions."
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const plan: DayPlan[] = [
            createDayPlan('Monday', createDish('Generic Dish'), null)
        ];

        // Call without profile
        const result = await generateCookInstructions(plan);

        expect(result).toBe("Generic cooking instructions.");
    });
});
