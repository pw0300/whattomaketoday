import { Dish } from '../types';

export const BANNED_INGREDIENTS = [
    'human', 'unknown', 'bleach', 'poison', 'toxic',
    'plastic', 'metal', 'glass'
];

export const MAX_CALORIES = 1500; // Per dish hard limit (unless explicit cheat meal)

/**
 * Hard deterministic safety check for a dish.
 * Returns true if safe, false if rejected.
 */
export const isDishSafe = (dish: Dish): boolean => {
    // 1. Critical Field Check
    if (!dish.name || !dish.description || !dish.cuisine) {
        console.warn(`[Safety] Rejected "${dish.name}": Missing fields.`);
        return false;
    }

    // 2. Calorie Limit Check
    if (dish.macros && dish.macros.calories > MAX_CALORIES) {
        console.warn(`[Safety] Rejected "${dish.name}": Calories ${dish.macros.calories} > ${MAX_CALORIES}`);
        return false;
    }

    // 3. Banned Terms Check
    const text = `${dish.name} ${dish.description} ${dish.ingredients?.map(i => i.name).join(' ')}`.toLowerCase();
    for (const banned of BANNED_INGREDIENTS) {
        if (text.includes(banned)) {
            console.warn(`[Safety] Rejected "${dish.name}": Contains banned term "${banned}"`);
            return false;
        }
    }

    // 4. Quality Heuristics
    if (dish.description.length < 10) {
        console.warn(`[Safety] Rejected "${dish.name}": Description too short.`);
        return false;
    }

    if (dish.name.toLowerCase().includes("recipe")) {
        // Metric: AI sometimes outputs "Recipe for X" as the name
        console.warn(`[Safety] Rejected "${dish.name}": Invalid name format.`);
        return false;
    }

    return true;
};
