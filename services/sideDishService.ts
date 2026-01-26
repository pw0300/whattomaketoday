import { Dish, Macros, DietaryPreference } from '../types';

export const SIDE_DISHES: Partial<Dish>[] = [
    {
        id: 'side-boiled-eggs',
        name: 'Boiled Eggs (2)',
        localName: 'Uble Ande',
        description: 'Two large hard-boiled eggs for extra protein.',
        cuisine: 'Universal',
        type: 'Snack',
        macros: { protein: 12, carbs: 1, fat: 10, calories: 155 },
        tags: ['Non-Vegetarian', 'Keto', 'High Protein'],
        healthTags: ['Muscle Gain', 'Low GI']
    },
    {
        id: 'side-greek-yogurt',
        name: 'Greek Yogurt (150g)',
        localName: 'Greek Dahi',
        description: 'Creamy high-protein curd.',
        cuisine: 'Mediterranean',
        type: 'Snack',
        macros: { protein: 15, carbs: 5, fat: 0, calories: 80 },
        tags: ['Vegetarian', 'High Protein'],
        healthTags: ['Gut Health', 'Muscle Gain']
    },
    {
        id: 'side-protein-shake',
        name: 'Whey Protein Shake',
        localName: 'Protein Shake',
        description: 'Vanilla/Chocolate whey protein scoop in water.',
        cuisine: 'Universal',
        type: 'Snack',
        macros: { protein: 24, carbs: 3, fat: 2, calories: 120 },
        tags: ['Vegetarian', 'High Protein'],
        healthTags: ['Muscle Gain', 'Post-Workout']
    },
    {
        id: 'side-paneer-cubes',
        name: 'Roasted Paneer (100g)',
        localName: 'Paneer Tikka',
        description: 'Lightly roasted cottage cheese cubes.',
        cuisine: 'Indian',
        type: 'Snack',
        macros: { protein: 18, carbs: 4, fat: 20, calories: 265 },
        tags: ['Vegetarian', 'Keto', 'High Protein'],
        healthTags: ['Strength']
    },
    {
        id: 'side-roasted-peanuts',
        name: 'Roasted Peanuts (30g)',
        localName: 'Moongfali',
        description: 'Crunchy roasted peanuts with a pinch of salt.',
        cuisine: 'Indian',
        type: 'Snack',
        macros: { protein: 7, carbs: 5, fat: 14, calories: 160 },
        tags: ['Vegan', 'Vegetarian', 'Keto'],
        healthTags: ['Heart Health']
    },
    {
        id: 'side-tofu-stirfry',
        name: 'Roasted Tofu (100g)',
        localName: 'Tofu',
        description: 'Roasted tofu cubes with soy sauce.',
        cuisine: 'Asian',
        type: 'Snack',
        macros: { protein: 10, carbs: 2, fat: 5, calories: 95 },
        tags: ['Vegan', 'Vegetarian', 'High Protein'],
        healthTags: ['Plant-based protein']
    },
    {
        id: 'side-almonds',
        name: 'Almonds (10)',
        localName: 'Badam',
        description: 'Handful of raw almonds.',
        cuisine: 'Universal',
        type: 'Snack',
        macros: { protein: 3, carbs: 3, fat: 7, calories: 75 },
        tags: ['Vegan', 'Vegetarian', 'Paleo'],
        healthTags: ['Brain Health']
    }
];

/**
 * Finds the best side dish to bridge a macro deficit
 */
export const getBestPairing = (deficit: Macros, diet: DietaryPreference, cuisine?: string): Dish | null => {
    if (deficit.protein < 5 && deficit.calories < 100) return null;

    // Filter by diet
    const candidates = SIDE_DISHES.filter(side => {
        if (diet === 'Vegetarian' && side.tags?.includes('Non-Vegetarian')) return false;
        if (diet === 'Vegan' && !side.tags?.includes('Vegan')) return false;
        return true;
    });

    if (candidates.length === 0) return null;

    // Scoring: Find the one that best fills the protein gap without exceeding calories too much
    return candidates.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // Favor cuisine match if available
        if (cuisine) {
            if (a.cuisine?.toLowerCase() === cuisine.toLowerCase()) scoreA += 0.5;
            if (b.cuisine?.toLowerCase() === cuisine.toLowerCase()) scoreB += 0.5;
        }

        const fillA = (a.macros?.protein || 0) / (deficit.protein || 1);
        const fillB = (b.macros?.protein || 0) / (deficit.protein || 1);

        // Goal: Get as close to 1.0 (100% fill) as possible
        const fitnessA = Math.abs(1 - fillA) - scoreA;
        const fitnessB = Math.abs(1 - fillB) - scoreB;

        return fitnessA - fitnessB;
    })[0] as Dish;
};
