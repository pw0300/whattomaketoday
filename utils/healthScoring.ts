import { Dish } from "../types";

/**
 * Calculates a heuristic Health Score (0-100) for a dish.
 * 
 * Logic:
 * - Base Score: 70
 * - Protein Boost: +1 point per gram over 10g (max +15)
 * - Calorie Balance: +10 if within 300-600 range
 * - Green Tags (Safe/Low GI): +5 each
 * - Red Tags (High GI/Warning): -15 each
 * - Fiber/Veggie Boost: +5 for "Fiber" or "Vegetable" tags
 */
export const calculateHealthScore = (dish: Dish): number => {
    let score = 70;

    // 1. Tag Analysis
    if (dish.healthTags) {
        dish.healthTags.forEach(tag => {
            const lowerTag = tag.toLowerCase();

            // Positive Tags
            if (lowerTag.includes('diabetes') || lowerTag.includes('low gi') || lowerTag.includes('safe') || lowerTag.includes('heart')) {
                score += 5;
            }
            if (lowerTag.includes('fiber') || lowerTag.includes('protein') || lowerTag.includes('vitamin')) {
                score += 3;
            }

            // Negative Tags
            if (lowerTag.includes('high gi') || lowerTag.includes('warning') || lowerTag.includes('avoid') || lowerTag.includes('sugar')) {
                score -= 15;
            }
        });
    }

    // 2. Macro Analysis (if available)
    if (dish.macros) {
        // Protein Boost
        if (dish.macros.protein) {
            const proteinBonus = Math.min(Math.max(dish.macros.protein - 10, 0), 15);
            score += proteinBonus;
        }

        // Calorie Check (Penalize extremes)
        if (dish.macros.calories) {
            if (dish.macros.calories > 800) score -= 10;
            if (dish.macros.calories < 200 && dish.type !== 'Snack') score -= 5; // Too light for a meal
            if (dish.macros.calories >= 300 && dish.macros.calories <= 600) score += 5; // Sweet spot
        }
    }

    // Clamp between 0-100
    return Math.min(Math.max(Math.round(score), 0), 100);
};

export const getHealthColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
};
