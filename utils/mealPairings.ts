/**
 * Meal Pairing Rules
 * Ensures complete, edible meals by adding appropriate accompaniments
 */

export interface MealCompletionRule {
    mainDishes: string[];        // Dish names that trigger this rule
    accompaniments: string[];    // Required accompaniments to add
    description: string;         // What makes this a complete meal
}

// South Indian meal completion rules
export const SOUTH_INDIAN_PAIRINGS: MealCompletionRule[] = [
    {
        mainDishes: ['Idli', 'Idly', 'Rava Idli', 'Ragi Idli'],
        accompaniments: ['Sambar', 'Coconut Chutney'],
        description: 'Traditional South Indian breakfast'
    },
    {
        mainDishes: ['Dosa', 'Masala Dosa', 'Rava Dosa', 'Plain Dosa', 'Set Dosa'],
        accompaniments: ['Sambar', 'Coconut Chutney'],
        description: 'Classic dosa with sambar and chutney'
    },
    {
        mainDishes: ['Vada', 'Medu Vada', 'Dahi Vada'],
        accompaniments: ['Sambar', 'Coconut Chutney'],
        description: 'Crispy vadas with accompaniments'
    },
    {
        mainDishes: ['Upma', 'Rava Upma'],
        accompaniments: ['Coconut Chutney', 'Pickle'],
        description: 'Semolina upma with chutney'
    },
    {
        mainDishes: ['Pongal', 'Ven Pongal', 'Khara Pongal'],
        accompaniments: ['Sambar', 'Coconut Chutney'],
        description: 'Comforting pongal with sambar'
    },
    {
        mainDishes: ['Uttapam', 'Onion Uttapam'],
        accompaniments: ['Sambar', 'Tomato Chutney'],
        description: 'Thick pancake with toppings'
    },
    {
        mainDishes: ['Rice', 'Steamed Rice', 'Plain Rice'],
        accompaniments: ['Rasam', 'Sambar', 'Papad'],
        description: 'South Indian rice meal'
    }
];

// North Indian meal completion rules
export const NORTH_INDIAN_PAIRINGS: MealCompletionRule[] = [
    {
        mainDishes: ['Roti', 'Chapati', 'Phulka', 'Paratha'],
        accompaniments: ['Dal', 'Sabzi'],
        description: 'North Indian bread with dal and vegetables'
    },
    {
        mainDishes: ['Dal Tadka', 'Dal Fry', 'Moong Dal'],
        accompaniments: ['Rice', 'Roti'],
        description: 'Dal served with carbs'
    },
    {
        mainDishes: ['Rajma', 'Chole', 'Kadhi'],
        accompaniments: ['Rice', 'Onion Salad'],
        description: 'Curry with rice'
    }
];

// Gujarati cuisine
export const GUJARATI_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Dhokla', 'Khaman'], accompaniments: ['Green Chutney', 'Fried Chilies'], description: 'Steamed snack' },
    { mainDishes: ['Thepla'], accompaniments: ['Pickle', 'Curd'], description: 'Flatbread combo' },
    { mainDishes: ['Khichdi'], accompaniments: ['Kadhi', 'Papad'], description: 'Comfort food' }
];

// Bengali cuisine
export const BENGALI_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Fish Curry', 'Macher Jhol', 'Hilsa'], accompaniments: ['Rice', 'Dal'], description: 'Bengali fish meal' },
    { mainDishes: ['Luchi'], accompaniments: ['Aloo Dum', 'Cholar Dal'], description: 'Fried bread combo' }
];

// Chinese cuisine
export const CHINESE_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Fried Rice', 'Veg Fried Rice'], accompaniments: ['Manchurian', 'Spring Rolls'], description: 'Chinese rice combo' },
    { mainDishes: ['Noodles', 'Hakka Noodles'], accompaniments: ['Manchurian', 'Soup'], description: 'Noodle combo' },
    { mainDishes: ['Momos', 'Dumplings'], accompaniments: ['Spicy Chutney', 'Soup'], description: 'Dumplings with dip' }
];

// Thai cuisine
export const THAI_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Pad Thai'], accompaniments: ['Peanuts', 'Lime', 'Bean Sprouts'], description: 'Thai noodles' },
    { mainDishes: ['Green Curry', 'Red Curry', 'Thai Curry'], accompaniments: ['Jasmine Rice'], description: 'Thai curry' }
];

// Italian cuisine
export const ITALIAN_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Pasta', 'Spaghetti', 'Penne', 'Lasagna'], accompaniments: ['Garlic Bread', 'Salad'], description: 'Pasta meal' },
    { mainDishes: ['Pizza'], accompaniments: ['Garlic Dip', 'Coleslaw'], description: 'Pizza combo' }
];

// Mexican cuisine
export const MEXICAN_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Tacos', 'Taco'], accompaniments: ['Salsa', 'Guacamole'], description: 'Tacos with dips' },
    { mainDishes: ['Burrito'], accompaniments: ['Salsa', 'Chips'], description: 'Burrito meal' },
    { mainDishes: ['Nachos'], accompaniments: ['Cheese Dip', 'Salsa'], description: 'Party snack' }
];

// Continental cuisine
export const CONTINENTAL_PAIRINGS: MealCompletionRule[] = [
    { mainDishes: ['Steak', 'Grilled Chicken'], accompaniments: ['Mashed Potatoes', 'Veggies'], description: 'Western main' },
    { mainDishes: ['Sandwich', 'Club Sandwich'], accompaniments: ['Fries', 'Coleslaw'], description: 'Sandwich combo' }
];

// All pairing rules combined
export const ALL_PAIRINGS: MealCompletionRule[] = [
    ...SOUTH_INDIAN_PAIRINGS,
    ...NORTH_INDIAN_PAIRINGS,
    ...GUJARATI_PAIRINGS,
    ...BENGALI_PAIRINGS,
    ...CHINESE_PAIRINGS,
    ...THAI_PAIRINGS,
    ...ITALIAN_PAIRINGS,
    ...MEXICAN_PAIRINGS,
    ...CONTINENTAL_PAIRINGS
];

/**
 * Get suggested accompaniments for a dish
 */
export const getAccompaniments = (dishName: string): string[] => {
    const normalizedName = dishName.toLowerCase().trim();

    for (const rule of ALL_PAIRINGS) {
        const matches = rule.mainDishes.some(main =>
            normalizedName.includes(main.toLowerCase()) ||
            main.toLowerCase().includes(normalizedName)
        );

        if (matches) {
            return rule.accompaniments;
        }
    }

    return []; // No accompaniments needed
};

/**
 * Check if a meal is complete (has accompaniments if needed)
 */
export const isMealComplete = (dishName: string, otherDishesInMeal: string[]): boolean => {
    const accompaniments = getAccompaniments(dishName);
    if (accompaniments.length === 0) return true; // No accompaniments needed

    // Check if at least one accompaniment is present
    const normalizedOthers = otherDishesInMeal.map(d => d.toLowerCase());
    return accompaniments.some(acc =>
        normalizedOthers.some(other => other.includes(acc.toLowerCase()))
    );
};

/**
 * Get meal completion suggestions for display
 */
export const getMealSuggestion = (dishName: string): string | null => {
    const accompaniments = getAccompaniments(dishName);
    if (accompaniments.length === 0) return null;

    return `Complete with: ${accompaniments.join(' + ')}`;
};
