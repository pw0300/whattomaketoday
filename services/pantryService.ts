import { PantryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migrates legacy string[] pantry to PantryItem[]
 * Defaults all items to 'binary' quantityType (In Stock).
 */
export const migratePantry = (legacyStock: string[]): PantryItem[] => {
    if (!legacyStock) return [];

    // Deduplicate names
    const uniqueNames = Array.from(new Set(legacyStock.map(s => s.trim()).filter(s => s.length > 0)));

    return uniqueNames.map(name => ({
        id: uuidv4(),
        name: name,
        quantityType: 'binary',
        quantityLevel: 1, // Default 'In Stock'
        category: 'Uncategorized', // We'll need a way to look this up later from KG
        addedAt: Date.now()
    }));
};

/**
 * Adds an item to the pantry.
 * If item with same name exists, it resets/updates the quantity and timestamp.
 */
export const addPantryItem = (currentStock: PantryItem[], partialItem: Partial<PantryItem> & { name: string }): PantryItem[] => {
    const existingIndex = currentStock.findIndex(i => i.name.toLowerCase() === partialItem.name.toLowerCase());

    if (existingIndex >= 0) {
        // Update existing
        const updatedStock = [...currentStock];
        updatedStock[existingIndex] = {
            ...updatedStock[existingIndex],
            quantityLevel: partialItem.quantityLevel || 3, // Reset to Full/High if unspecified
            addedAt: Date.now(), // Refresh timestamp
            ...partialItem, // Override any other fields provided
            id: updatedStock[existingIndex].id // key ID stable
        };
        return updatedStock;
    } else {
        // Add new
        const newItem: PantryItem = {
            id: uuidv4(),
            quantityType: 'binary',
            quantityLevel: 1,
            category: 'Uncategorized',
            addedAt: Date.now(),
            ...partialItem
        };
        return [...currentStock, newItem];
    }
};

/**
 * Removes an item by ID.
 */
export const deductPantryItem = (currentStock: PantryItem[], itemId: string): PantryItem[] => {
    return currentStock.filter(i => i.id !== itemId);
};

/**
 * Updates an item's details (e.g. quantity change).
 */
export const updatePantryItem = (currentStock: PantryItem[], itemId: string, updates: Partial<PantryItem>): PantryItem[] => {
    return currentStock.map(i => i.id === itemId ? { ...i, ...updates } : i);
};
