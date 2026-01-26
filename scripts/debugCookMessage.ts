
import * as dotenv from "dotenv";
dotenv.config();

import { DayPlan } from '../types';

async function run() {
    console.log("Testing generateCookInstructions...");

    try {
        // Dynamic import to ensure dotenv is loaded first and env vars are available
        const { generateCookInstructions } = await import('../services/geminiService');

        const MOCK_PLAN: DayPlan[] = [
            {
                day: "Monday",
                lunch: {
                    id: '1', name: "Paneer Butter Masala", localName: "पनीर बटर मसाला",
                    ingredients: [], instructions: [], type: 'Lunch', cuisine: 'Indian',
                    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    tags: [], healthTags: [], allergens: [], description: '', isStaple: false,
                    image: ''
                },
                dinner: {
                    id: '2', name: "Dal Tadka", localName: "दाल तड़का",
                    ingredients: [], instructions: [], type: 'Dinner', cuisine: 'Indian',
                    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    tags: [], healthTags: [], allergens: [], description: '', isStaple: false,
                    image: ''
                },
                isLocked: false
            }
        ];

        const MOCK_PROFILE = {
            name: "Rahul",
            allergens: ["Nuts"],
            dietaryPreference: "Vegetarian",
            conditions: ["Diabetes"],
            cuisines: ["Indian"],
            bmr: 2000,
            dailyCalorieTarget: 2000,
            email: "test@example.com",
            onboardingCompleted: true
        };

        const result = await generateCookInstructions(MOCK_PLAN, MOCK_PROFILE);
        console.log("Result:", result);

        if (!result) {
            console.error("Result is null!");
        } else if (result.trim() === '') {
            console.error("Result is empty string!");
        } else {
            console.log("Success with message length:", result.length);
        }
    } catch (e) {
        console.error("Error running test:", e);
    }
}

run();
