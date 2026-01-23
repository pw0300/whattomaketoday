import { DayPlan, Ingredient } from '../types';

export interface GroceryItem extends Ingredient {
    sourceDishes: string[];
    isStocked: boolean;
    totalQuantity: number;
    unit: string;
}

/**
 * Helper to normalize strings for comparison (singular/plural, case, trim)
 */
const normalize = (str: string): string => {
    if (!str) return '';
    // Remove 's' at end if it looks plural (basic heuristic)
    // Remove special chars, lowercase
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
};

const parseQuantity = (qtyStr: string): { value: number, unit: string } => {
    // Handle fractions like ½, ¼
    const fractions: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67 };

    // Clean string
    let cleanStr = qtyStr.trim();

    // Check for fractions
    for (const [char, val] of Object.entries(fractions)) {
        if (cleanStr.includes(char)) {
            cleanStr = cleanStr.replace(char, val.toString());
        }
    }

    // Regex to split number and text
    const match = cleanStr.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].trim() || 'unit';
        return { value: isNaN(val) ? 1 : val, unit };
    }

    // If no number found, assume 1 unit
    return { value: 1, unit: qtyStr || 'unit' };
};

export const generateGroceryList = (plan: DayPlan[], pantryStock: string[]): GroceryItem[] => {
    const aggregatedMap = new Map<string, GroceryItem>();

    // 1. Flatten and Aggregate
    plan.forEach(day => {
        const meals = [day.lunch, day.dinner];
        meals.forEach(dish => {
            if (!dish) return;

            dish.ingredients.forEach(ing => {
                // Normalization Key: Lowercase, trimmed
                // We use the full normalized name as key to grouping
                // But for "Onion" and "Chopped Onion" -> we might want specific logic, 
                // for now just simple name string grouping
                const key = ing.name.toLowerCase().trim();

                const { value, unit } = parseQuantity(ing.quantity);
                const sourceName = dish.localName || dish.name;

                if (aggregatedMap.has(key)) {
                    const existing = aggregatedMap.get(key)!;
                    existing.totalQuantity += value;
                    if (!existing.sourceDishes.includes(sourceName)) {
                        existing.sourceDishes.push(sourceName);
                    }
                    // If unit differs, append it? For now, we keep the first unit found OR "mixed"
                    // Ideally we normalize units (e.g. g -> kg), but that requires a big dictionary.
                    // For MVP, if units differ significantly, we might want to flag it, 
                    // but our test expects simple summing.
                } else {
                    aggregatedMap.set(key, {
                        ...ing,
                        totalQuantity: value,
                        unit: unit,
                        quantity: '', // derived field, will formatting later if needed, or ignored
                        sourceDishes: [sourceName],
                        isStocked: false
                    });
                }
            });
        });
    });

    // 2. Check Pantry & Format
    const result = Array.from(aggregatedMap.values()).map(item => {
        // Fuzzy check against pantry
        const itemNorm = normalize(item.name);
        const isStocked = pantryStock.some(p => normalize(p) === itemNorm);

        // Format final quantity string
        const qtyDisplay = Number.isInteger(item.totalQuantity)
            ? item.totalQuantity.toString()
            : item.totalQuantity.toFixed(2).replace(/\.00$/, '');

        // Update the base Ingredient 'quantity' field to be the summed string
        item.quantity = `${qtyDisplay} ${item.unit}`.trim();

        return {
            ...item,
            isStocked
        };
    });

    return result;
};

export const consolidateIngredients = (ingredients: Ingredient[]): { quantity: number, unit: string } => {
    // Stub for now, logic embedded above
    return { quantity: 0, unit: 'unit' };
};
